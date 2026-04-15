import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    // Mercado Pago sends IPN notifications with type and data.id
    // Also supports the new webhook format with "action" and "data"
    const topic = body.type || body.topic;
    const paymentId = body.data?.id;

    // We only care about payment notifications
    if (topic !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      console.log("Ignoring non-payment notification:", topic, body.action);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!paymentId) {
      console.log("No payment ID in webhook payload");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    // Fetch payment details from Mercado Pago API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Failed to fetch payment from MP:", mpResponse.status, errorText);
      throw new Error(`MP API error: ${mpResponse.status}`);
    }

    const payment = await mpResponse.json();
    console.log("Payment details:", JSON.stringify({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      status_detail: payment.status_detail,
    }));

    const userId = payment.external_reference; // We set this as user.id in the preference
    if (!userId) {
      console.log("No external_reference (user_id) in payment");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to update regardless of RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map MP payment status to our status
    let paymentStatus: string;
    switch (payment.status) {
      case "approved":
        paymentStatus = "paid";
        break;
      case "pending":
      case "in_process":
      case "authorized":
        paymentStatus = "pending";
        break;
      case "rejected":
      case "cancelled":
      case "refunded":
      case "charged_back":
        paymentStatus = payment.status;
        break;
      default:
        paymentStatus = payment.status;
    }

    // Update eligibility_submissions with payment info
    const { error: updateError } = await supabase
      .from("eligibility_submissions")
      .update({
        payment_status: paymentStatus,
        payment_provider: "mercadopago",
        payment_id: String(payment.id),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating eligibility:", updateError);
      throw updateError;
    }

    console.log(`Updated user ${userId} payment status to: ${paymentStatus}`);

    return new Response(JSON.stringify({ ok: true, status: paymentStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to MP to avoid retries on our errors
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
