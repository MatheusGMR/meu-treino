// Captura sinal de percepção do aluno: botão "Ficou leve?" ou resposta randômica.
// Insere em session_perception_signals — o trigger SQL avalia automaticamente o gatilho
// de progressão (2x consecutivos = alerta JMP).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SignalType = "ESPONTANEO_LEVE" | "RANDOMICO_LEVE" | "RANDOMICO_NORMAL" | "RANDOMICO_PESADO";

interface SignalRequest {
  exercise_id: string;
  signal_type: SignalType;
  schedule_id?: string;
  sessao_num?: number;
}

const VALID: SignalType[] = ["ESPONTANEO_LEVE", "RANDOMICO_LEVE", "RANDOMICO_NORMAL", "RANDOMICO_PESADO"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const body = (await req.json()) as SignalRequest;
    if (!body.exercise_id) throw new Error("exercise_id required");
    if (!VALID.includes(body.signal_type)) throw new Error("invalid signal_type");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Carrega carga atual (snapshot do momento)
    const { data: load } = await supabase
      .from("client_exercise_load_history")
      .select("current_load_kg")
      .eq("client_id", user.id)
      .eq("exercise_id", body.exercise_id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("session_perception_signals")
      .insert({
        client_id: user.id,
        exercise_id: body.exercise_id,
        signal_type: body.signal_type,
        schedule_id: body.schedule_id ?? null,
        sessao_num: body.sessao_num ?? null,
        load_at_signal: load?.current_load_kg ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, signal: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("record-perception-signal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
