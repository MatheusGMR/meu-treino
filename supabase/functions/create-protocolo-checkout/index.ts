import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const { paymentMethod } = await req.json();
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error("Mercado Pago não configurado. Configure a chave de acesso.");
    }

    const isTestToken = MP_ACCESS_TOKEN.startsWith("TEST-");

    const origin = req.headers.get("origin") || "https://trainer-client-portal.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Create Mercado Pago preference
    const preference = {
      items: [
        {
          id: "protocolo-destravamento",
          title: "Protocolo Destravamento - Mensalidade",
          description: "Treino personalizado com acompanhamento JMP + App Meu Treino",
          quantity: 1,
          currency_id: "BRL",
          unit_price: 219.90,
          category_id: "services",
        },
      ],
      payer: {
        email: user.email,
        name: profile?.full_name || user.email,
      },
      back_urls: {
        success: `${origin}/client/checkout-success`,
        failure: `${origin}/client/checkout?status=failure`,
        pending: `${origin}/client/checkout?status=pending`,
      },
      auto_return: "approved",
      payment_methods: paymentMethod === "pix" 
        ? { excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }] }
        : { excluded_payment_types: [{ id: "bank_transfer" }] },
      external_reference: user.id,
      notification_url: webhookUrl,
      metadata: {
        user_id: user.id,
        plan: "protocolo_destravamento",
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("MP Error:", errorData);
      throw new Error("Erro ao criar sessão de pagamento");
    }

    const mpData = await mpResponse.json();
    console.log("MP Preference created:", mpData.id, "token_mode:", isTestToken ? "test" : "live");

    const checkoutUrl = isTestToken
      ? (mpData.sandbox_init_point || mpData.init_point)
      : (mpData.init_point || mpData.sandbox_init_point);

    return new Response(JSON.stringify({ 
      url: checkoutUrl,
      preference_id: mpData.id,
      mode: isTestToken ? "test" : "live",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
