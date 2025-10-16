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
    const { clientId, monthlyPrice } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization")!.replace("Bearer ", ""));
    if (!user) throw new Error("Não autenticado");

    console.log("Creating client subscription for:", clientId, "by personal:", user.id);

    // Verificar se é Personal
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    if (!roles?.some(r => r.role === "personal")) {
      throw new Error("Apenas personals podem criar assinaturas de clientes");
    }

    // Buscar dados do cliente
    const { data: client } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .single();

    const { data: clientAuth } = await supabase.auth.admin.getUserById(clientId);

    // Criar product no Stripe
    const product = await stripe.products.create({
      name: `Treino - ${client.full_name}`,
      metadata: {
        personal_id: user.id,
        client_id: clientId,
      },
    });

    console.log("Product created:", product.id);

    // Criar price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(monthlyPrice * 100),
      currency: "brl",
      recurring: { interval: "month" },
    });

    console.log("Price created:", price.id);

    // Salvar config no banco
    const { data: config } = await supabase
      .from("client_payment_configs")
      .insert({
        client_id: clientId,
        personal_id: user.id,
        monthly_price: monthlyPrice,
        stripe_price_id: price.id,
      })
      .select()
      .single();

    console.log("Config saved:", config.id);

    // Criar customer para o cliente
    const customer = await stripe.customers.create({
      email: clientAuth.user?.email || "",
      name: client.full_name,
      metadata: {
        user_id: clientId,
        personal_id: user.id,
        user_type: "client",
      },
    });

    console.log("Customer created:", customer.id);

    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      subscription_data: {
        metadata: {
          client_id: clientId,
          personal_id: user.id,
          config_id: config.id,
        },
        application_fee_percent: 5,
      },
      success_url: `${req.headers.get("origin")}/client/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/client/dashboard?payment=canceled`,
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      configId: config.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao criar assinatura de cliente:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
