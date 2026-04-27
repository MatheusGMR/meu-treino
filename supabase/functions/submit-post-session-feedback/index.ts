// Feedback pós-sessão (máx 4 toques, linguagem leve).
// 1) estado_geral: bem | cansado_mas_bem | senti_algo
// 2) regiao (se senti_algo): lombar | joelho | ombro | outra
// 3) intensidade: leve | normal | puxado
// Detecta dor_nova: região não mapeada na anamnesis → alerta JMP silencioso.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  schedule_id?: string;
  estado_geral: "bem" | "cansado_mas_bem" | "senti_algo";
  regiao?: "lombar" | "joelho" | "ombro" | "outra";
  intensidade?: "leve" | "normal" | "puxado";
}

const REGIAO_TO_L: Record<string, string> = {
  lombar: "L1",
  ombro: "L2",
  joelho: "L3",
};

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

    const body = (await req.json()) as FeedbackRequest;
    if (!body.estado_geral) throw new Error("estado_geral required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) Grava feedback principal
    const moodMap: Record<string, string> = {
      bem: "ENERGIA_ALTA",
      cansado_mas_bem: "OK",
      senti_algo: "DESCONFORTO",
    };
    const { data: feedback, error: insertErr } = await supabase
      .from("post_workout_feedbacks")
      .insert({
        client_id: user.id,
        schedule_id: body.schedule_id ?? null,
        feedback_date: new Date().toISOString().slice(0, 10),
        mood_category: moodMap[body.estado_geral],
        difficulty_rating: body.intensidade ?? null,
        mood_summary: body.regiao ? `Região: ${body.regiao}` : null,
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // 2) Detecta dor_nova
    if (body.estado_geral === "senti_algo" && body.regiao) {
      const { data: anamnesis } = await supabase
        .from("anamnesis")
        .select("dor_local")
        .eq("client_id", user.id)
        .maybeSingle();

      const reportedL = REGIAO_TO_L[body.regiao];
      const knownLocations = (anamnesis?.dor_local ?? []).map((s: string) => s.toUpperCase());
      const isNew =
        body.regiao === "outra" || (reportedL && !knownLocations.includes(reportedL));

      if (isNew) {
        await supabase.from("agent_alerts").insert({
          client_id: user.id,
          alert_type: "dor_nova",
          severity: body.intensidade === "puxado" ? "alta" : "media",
          title: "Dor nova reportada (fora do mapeamento)",
          description: `Cliente reportou desconforto em ${body.regiao} (intensidade ${body.intensidade ?? "n/d"}). Não mapeado na anamnese.`,
          payload: {
            regiao: body.regiao,
            intensidade: body.intensidade,
            schedule_id: body.schedule_id,
            known_locations: knownLocations,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("submit-post-session-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
