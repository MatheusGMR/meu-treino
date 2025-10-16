import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );

    console.log("Webhook recebido:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { user_id, plan_id } = subscription.metadata;

        if (user_id && plan_id) {
          await supabase.from("personal_subscriptions").upsert({
            personal_id: user_id,
            plan_id: plan_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          });

          console.log(`Assinatura de Personal ${user_id} atualizada`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from("personal_subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Assinatura cancelada: ${subscription.id}`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const { client_id, personal_id, config_id } = subscription.metadata;

          if (client_id && personal_id && config_id) {
            await supabase.from("client_subscriptions").insert({
              client_id,
              personal_id,
              config_id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });

            console.log(`Assinatura de Cliente ${client_id} criada`);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const metadata = subscription.metadata;

        const userType = metadata.client_id ? "client" : "personal";
        const userId = metadata.client_id || metadata.user_id;

        let commission = 0;
        let netAmount = invoice.amount_paid / 100;

        if (userType === "client") {
          const { data: commissionData } = await supabase
            .from("commission_settings")
            .select("commission_percentage")
            .or(`personal_id.eq.${metadata.personal_id},personal_id.is.null`)
            .order("personal_id", { ascending: false, nullsFirst: false })
            .limit(1)
            .single();

          const percentage = commissionData?.commission_percentage || 5;
          commission = (invoice.amount_paid / 100) * (percentage / 100);
          netAmount = (invoice.amount_paid / 100) - commission;
        }

        await supabase.from("payment_history").insert({
          user_id: userId,
          user_type: userType,
          amount: invoice.amount_paid / 100,
          admin_commission: commission,
          net_amount: netAmount,
          stripe_payment_intent_id: invoice.payment_intent as string,
          stripe_invoice_id: invoice.id,
          status: "succeeded",
          description: invoice.description || `Pagamento ${userType}`,
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
        });

        console.log(`Pagamento registrado: ${invoice.id}, Comissão: R$${commission.toFixed(2)}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const metadata = subscription.metadata;

        const userType = metadata.client_id ? "client" : "personal";
        const userId = metadata.client_id || metadata.user_id;

        await supabase.from("payment_history").insert({
          user_id: userId,
          user_type: userType,
          amount: invoice.amount_due / 100,
          admin_commission: 0,
          net_amount: 0,
          stripe_invoice_id: invoice.id,
          status: "failed",
          description: `Falha no pagamento - ${invoice.description}`,
        });

        if (userType === "personal") {
          await supabase
            .from("personal_subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscription.id);
        } else {
          await supabase
            .from("client_subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscription.id);
        }

        console.log(`Falha no pagamento: ${invoice.id}`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
