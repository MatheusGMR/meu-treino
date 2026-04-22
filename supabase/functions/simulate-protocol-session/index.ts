// Simulador do motor determinístico do Protocolo Destravamento
// Recebe inputs hipotéticos (anamnese + check-in) e retorna o treino que seria gerado,
// sem persistir nada no banco. Usado pelo admin para validar/refinar a lógica.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SimRequest {
  session_number: number;
  // Anamnese simulada
  perfil_primario: string;
  ins_cat: "I1" | "I2" | "I3";
  dor_cat: "D0" | "D1" | "D2" | "D3";
  dor_local: string[];
  // Check-in do dia (opcional — sobrepõe anamnese se fornecido)
  tempo_cat: "T1" | "T2" | "T3";
  disposicao: "OK" | "Moderada" | "Comprometida";
  client_name?: string;
}

const PERFIL_TO_SHORT: Record<string, string> = {
  P01_empurrado_pela_dor: "01",
  P02_assustado_com_tempo: "02",
  P03_frustrado: "03",
  P04_estreante: "04",
  P05_sobrecarregado: "05",
  P06_deslocado: "06",
};

function pickAB(n: number): "A" | "B" {
  return n % 2 === 1 ? "A" : "B";
}
function blocoFromSession(n: number): number {
  if (n <= 12) return 1;
  if (n <= 24) return 2;
  return 3;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Apenas admins podem simular");

    const body: SimRequest = await req.json();
    const sessionNumber = body.session_number;
    if (!sessionNumber || sessionNumber < 1 || sessionNumber > 36)
      throw new Error("session_number deve estar entre 1 e 36");

    const bloco = blocoFromSession(sessionNumber);
    const { data: milestones } = await supabase
      .from("protocol_milestones")
      .select("*")
      .order("session_number");
    const milestone = (milestones ?? []).find((m: any) => m.session_number === sessionNumber);

    const dor_cat = body.dor_cat ?? "D0";
    const dor_local = body.dor_local ?? [];
    const tempo_cat = body.tempo_cat ?? "T2";
    const disposicao = body.disposicao ?? "OK";
    const ins_cat = body.ins_cat ?? "I2";
    const perfil = body.perfil_primario ?? "P04_estreante";
    const perfil_curto = PERFIL_TO_SHORT[perfil] ?? "04";
    const clientName = (body.client_name ?? "Cliente").split(" ")[0];

    const decisions: string[] = [];

    // PASSO 1-2: Dor
    let intensity_factor = 1.0;
    let avoid_groups: string[] = [];
    if (dor_cat === "D3") {
      intensity_factor = 0.4;
      avoid_groups = dor_local;
      decisions.push(`DOR D3: reduzir intensidade 40%, evitar regiões: ${dor_local.join(", ") || "(nenhuma)"}`);
    } else if (dor_cat === "D2") {
      intensity_factor = 0.7;
      decisions.push("DOR D2: reduzir intensidade 30%");
    } else {
      decisions.push(`DOR ${dor_cat}: sem ajustes por dor`);
    }

    // PASSO 3-4: Tempo
    let max_exercises = 8;
    if (tempo_cat === "T1") {
      max_exercises = 5;
      decisions.push("TEMPO T1: sessão curta (5 ex)");
    } else if (tempo_cat === "T3") {
      max_exercises = 10;
      decisions.push("TEMPO T3: sessão longa (10 ex)");
    } else {
      decisions.push("TEMPO T2: sessão padrão (8 ex)");
    }

    // PASSO 5: Disposição
    if (disposicao === "Comprometida") {
      intensity_factor *= 0.7;
      decisions.push("DISPOSIÇÃO Comprometida: -30% intensidade");
    } else if (disposicao === "Moderada") {
      intensity_factor *= 0.85;
      decisions.push("DISPOSIÇÃO Moderada: -15% intensidade");
    } else {
      decisions.push("DISPOSIÇÃO OK: sem ajustes");
    }

    // PASSO 6: Insegurança → safety
    let allowed_safety: string[] = [];
    if (ins_cat === "I3") {
      allowed_safety = ["S1"];
      decisions.push("INS I3: apenas S1");
    } else if (ins_cat === "I2") {
      allowed_safety = ["S1", "S2"];
      decisions.push("INS I2: S1-S2");
    } else {
      allowed_safety = ["S1", "S2", "S3"];
      decisions.push("INS I1: S1-S3");
    }

    // PASSO 7: A/B
    const variant = pickAB(sessionNumber);
    decisions.push(`Variação ${variant} (sessão ${sessionNumber})`);

    // Buscar exercícios do protocolo
    const { data: allExercises } = await supabase
      .from("exercises")
      .select("id, name, primary_muscle, block, safety_level, video_url")
      .eq("protocol_only", true)
      .in("safety_level", allowed_safety as any);

    const blocosPermitidos: string[] = ["MOB"];
    if (bloco >= 1) blocosPermitidos.push("FORT");
    if (bloco >= 2) blocosPermitidos.push("MS", "MI");
    if (bloco >= 3) blocosPermitidos.push("CARD");
    blocosPermitidos.push("ALONG");
    decisions.push(`Bloco ${bloco}: liberados ${blocosPermitidos.join(", ")}`);

    const filteredByBlock = (allExercises ?? []).filter((e: any) =>
      e.block ? blocosPermitidos.includes(e.block) : true
    );
    const filteredByPain = filteredByBlock.filter((e: any) => {
      if (!avoid_groups.length) return true;
      const muscle = (e.primary_muscle ?? "").toLowerCase();
      return !avoid_groups.some((g) => muscle.includes(g.toLowerCase()));
    });

    const mobs = filteredByPain.filter((e: any) => e.block === "MOB").slice(0, 2);
    const others = filteredByPain
      .filter((e: any) => e.block !== "MOB" && e.block !== "ALONG")
      .slice(0, max_exercises - 3);
    const along = filteredByPain.filter((e: any) => e.block === "ALONG").slice(0, 1);
    const sessionExercises = [...mobs, ...others, ...along].slice(0, max_exercises);

    // Vídeos obrigatórios do marco
    let mandatoryVideos: any[] = [];
    if (milestone?.required_video_codes?.length) {
      const { data: videos } = await supabase
        .from("agent_videos")
        .select("*")
        .in("video_code", milestone.required_video_codes);
      mandatoryVideos = videos ?? [];
    }

    // Template de comunicação
    const moment = milestone ? "marco" : "pre_sessao";
    const { data: templates } = await supabase
      .from("agent_communication_templates")
      .select("*")
      .eq("active", true)
      .eq("moment", moment);

    let chosenTemplate: any = null;
    if (templates?.length) {
      chosenTemplate =
        templates.find((t: any) => t.perfil_primario === perfil && t.ins_cat === ins_cat) ??
        templates.find((t: any) => t.perfil_primario === perfil && t.ins_cat === null) ??
        templates.find((t: any) => t.perfil_primario === null);
    }

    const tempoEstimado = max_exercises * 4;
    const calibratedMessage = (chosenTemplate?.template ?? "Bom treino, {nome}!")
      .replace(/\{nome\}/g, clientName)
      .replace(/\{sessao\}/g, String(sessionNumber))
      .replace(/\{tempo_estimado\}/g, String(tempoEstimado));

    return new Response(
      JSON.stringify({
        success: true,
        simulation: true,
        session: {
          number: sessionNumber,
          bloco,
          variant,
          intensity_factor: Number(intensity_factor.toFixed(2)),
          allowed_safety,
          allowed_blocks: blocosPermitidos,
          max_exercises,
          exercise_count: sessionExercises.length,
          exercises: sessionExercises,
        },
        milestone: milestone
          ? {
              type: milestone.milestone_type,
              title: milestone.title,
              description: milestone.description,
              mandatory_videos: mandatoryVideos,
            }
          : null,
        message: calibratedMessage,
        template_used: chosenTemplate
          ? {
              perfil: chosenTemplate.perfil_primario,
              ins_cat: chosenTemplate.ins_cat,
              tone: chosenTemplate.tone,
              raw: chosenTemplate.template,
            }
          : null,
        moment,
        decisions,
        context: { dor_cat, dor_local, tempo_cat, disposicao, ins_cat, perfil_primario: perfil, perfil_curto },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("simulate-protocol-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
