import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    console.log("Creating checkout for user:", user.id);

    // Buscar plano ativo
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("active", true)
      .single();

    if (!plan) throw new Error("Nenhum plano disponível");
    console.log("Found plan:", plan.id, plan.name);

    // Buscar profile do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Criar ou buscar customer no Stripe
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log("Existing customer found:", customer.id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        metadata: { user_id: user.id, user_type: "personal" },
      });
      console.log("New customer created:", customer.id);
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: plan.trial_days,
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
      },
      success_url: `${req.headers.get("origin")}/personal/assinatura?success=true`,
      cancel_url: `${req.headers.get("origin")}/escolher-plano?canceled=true`,
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
