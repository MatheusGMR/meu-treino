// Motor determinístico do Protocolo Destravamento
// Hierarquia: Dor D3 > Dor D2 > Tempo > Disposição > Insegurança > Alternância A/B > Mobilidade(nunca suprime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BuildRequest {
  client_id: string;
  session_number?: number; // opcional: se vier, força uso. Senão usa client_protocol_progress.sessao_atual + 1
}

const PERFIL_TO_SHORT: Record<string, string> = {
  P01_empurrado_pela_dor: "01",
  P02_assustado_com_tempo: "02",
  P03_frustrado: "03",
  P04_estreante: "04",
  P05_sobrecarregado: "05",
  P06_deslocado: "06",
};

function pickAB(sessionNumber: number): "A" | "B" {
  // alternância simples: ímpar A, par B
  return sessionNumber % 2 === 1 ? "A" : "B";
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

    // Validar usuário
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const body: BuildRequest = await req.json();
    if (!body.client_id) throw new Error("client_id required");

    // ============ 1. Carregar contexto ============
    const [anamnesisRes, progressRes, checkinRes, profileRes, milestonesRes] = await Promise.all([
      supabase.from("anamnesis").select("*").eq("client_id", body.client_id).maybeSingle(),
      supabase.from("client_protocol_progress").select("*").eq("client_id", body.client_id).maybeSingle(),
      supabase.from("daily_checkin_sessions").select("*").eq("client_id", body.client_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", body.client_id).maybeSingle(),
      supabase.from("protocol_milestones").select("*").order("session_number"),
    ]);

    const anamnesis = anamnesisRes.data;
    const progress = progressRes.data;
    const lastCheckin = checkinRes.data;
    const clientName = profileRes.data?.full_name?.split(" ")[0] ?? "amigo";
    const milestones = milestonesRes.data ?? [];

    if (!anamnesis) throw new Error("Anamnese não encontrada para este cliente");

    const sessionNumber = body.session_number ?? ((progress?.sessao_atual ?? 0) + 1);
    if (sessionNumber < 1 || sessionNumber > 36) throw new Error(`Sessão fora do intervalo (1-36): ${sessionNumber}`);

    const bloco = blocoFromSession(sessionNumber);
    const milestone = milestones.find((m: any) => m.session_number === sessionNumber);

    // ============ 2. Hierarquia de regras (16 passos) ============
    const dor_cat = lastCheckin?.dor_cat_dia ?? anamnesis.dor_cat ?? "D0";
    const dor_local = lastCheckin?.dor_local_dia ?? anamnesis.dor_local ?? [];
    const tempo_cat = lastCheckin?.tempo_cat ?? "T2"; // default médio
    const disposicao = lastCheckin?.disposicao ?? "OK";
    const ins_cat = anamnesis.ins_cat ?? "I2";
    const perfil = anamnesis.perfil_primario ?? "P04_estreante";
    const perfil_curto = PERFIL_TO_SHORT[perfil] ?? "04";

    const decisions: string[] = [];

    // PASSO 1-2: Dor
    let intensity_factor = 1.0;
    let avoid_groups: string[] = [];
    if (dor_cat === "D3") {
      intensity_factor = 0.4;
      avoid_groups = dor_local;
      decisions.push(`DOR D3: reduzir intensidade 40%, evitar regiões: ${dor_local.join(", ")}`);
    } else if (dor_cat === "D2") {
      intensity_factor = 0.7;
      decisions.push(`DOR D2: reduzir intensidade 30%`);
    }

    // PASSO 3-4: Tempo disponível
    let max_exercises = 8;
    if (tempo_cat === "T1") {
      max_exercises = 5;
      decisions.push("TEMPO T1: sessão curta (5 ex)");
    } else if (tempo_cat === "T3") {
      max_exercises = 10;
      decisions.push("TEMPO T3: sessão longa (10 ex)");
    }

    // PASSO 5: Disposição
    if (disposicao === "Comprometida") {
      intensity_factor *= 0.7;
      decisions.push("DISPOSIÇÃO Comprometida: -30% intensidade");
    } else if (disposicao === "Moderada") {
      intensity_factor *= 0.85;
      decisions.push("DISPOSIÇÃO Moderada: -15% intensidade");
    }

    // PASSO 6: Filtro de segurança por insegurança
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

    // PASSO 7: Alternância A/B
    const variant = pickAB(sessionNumber);
    decisions.push(`Variação ${variant} (sessão ${sessionNumber})`);

    // ============ 3. Buscar exercícios do protocolo ============
    const { data: allExercises, error: exErr } = await supabase
      .from("exercises")
      .select("*")
      .eq("protocol_only", true)
      .in("safety_level", allowed_safety as any);

    if (exErr) throw exErr;
    if (!allExercises?.length) throw new Error("Sem exercícios disponíveis no Protocolo");

    // PASSO 8: Filtrar por bloco apropriado (BI=MOB sempre, BII=FORT bloco 2+, BIII=MS bloco 3)
    const blocosPermitidos: string[] = ["MOB"]; // mobilidade nunca suprime
    if (bloco >= 1) blocosPermitidos.push("FORT");
    if (bloco >= 2) blocosPermitidos.push("MS", "MI");
    if (bloco >= 3) blocosPermitidos.push("CARD");
    blocosPermitidos.push("ALONG");

    const filteredByBlock = allExercises.filter((e: any) =>
      e.block ? blocosPermitidos.includes(e.block) : true
    );

    // PASSO 9: Remover exercícios que afetam regiões com dor
    const filteredByPain = filteredByBlock.filter((e: any) => {
      if (!avoid_groups.length) return true;
      const muscle = (e.primary_muscle ?? "").toLowerCase();
      return !avoid_groups.some((g) => muscle.includes(g.toLowerCase()));
    });

    // PASSO 10: Aplicar substituições se faltar exercício
    // (nesta versão MVP, simplesmente filtramos; substituições explícitas via substitution_id são tratadas no futuro)

    // PASSO 11-13: Composição da sessão
    // - 2 mobilidades sempre
    // - resto distribuído entre os blocos do bloco atual
    const mobs = filteredByPain.filter((e: any) => e.block === "MOB").slice(0, 2);
    const others = filteredByPain.filter((e: any) => e.block !== "MOB" && e.block !== "ALONG").slice(0, max_exercises - 3);
    const along = filteredByPain.filter((e: any) => e.block === "ALONG").slice(0, 1);
    const sessionExercises = [...mobs, ...others, ...along].slice(0, max_exercises);

    // PASSO 14: Verificar marco
    const isMilestone = !!milestone;
    let mandatoryVideos: any[] = [];
    if (milestone?.required_video_codes?.length) {
      const { data: videos } = await supabase
        .from("agent_videos")
        .select("*")
        .in("video_code", milestone.required_video_codes);
      mandatoryVideos = videos ?? [];
    }

    // PASSO 15: Selecionar template de comunicação
    const moment = isMilestone ? "marco" : "pre_sessao";
    const { data: templates } = await supabase
      .from("agent_communication_templates")
      .select("*")
      .eq("active", true)
      .eq("moment", moment);

    let chosenTemplate: any = null;
    if (templates?.length) {
      // ordem de preferência: perfil + ins_cat exatos > perfil + null > null
      chosenTemplate =
        templates.find((t: any) => t.perfil_primario === perfil && t.ins_cat === ins_cat) ??
        templates.find((t: any) => t.perfil_primario === perfil && t.ins_cat === null) ??
        templates.find((t: any) => t.perfil_primario === null);
    }

    // PASSO 16: Calibrar texto
    const tempoEstimado = max_exercises * 4;
    const calibratedMessage = (chosenTemplate?.template ?? "Bom treino, {nome}!")
      .replace(/\{nome\}/g, clientName)
      .replace(/\{sessao\}/g, String(sessionNumber))
      .replace(/\{tempo_estimado\}/g, String(tempoEstimado));

    // ============ 4. Atualizar progresso ============
    if (progress) {
      await supabase
        .from("client_protocol_progress")
        .update({
          bloco_atual: bloco,
          sessao_atual: sessionNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("client_id", body.client_id);
    } else {
      await supabase.from("client_protocol_progress").insert({
        client_id: body.client_id,
        sessao_atual: sessionNumber,
        bloco_atual: bloco,
        total_sessoes: 36,
        status: "ativo",
      });
    }

    // ============ 5. Resposta ============
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          number: sessionNumber,
          bloco,
          variant,
          intensity_factor: Number(intensity_factor.toFixed(2)),
          exercises: sessionExercises.map((e: any) => ({
            id: e.id,
            name: e.name,
            primary_muscle: e.primary_muscle,
            block: e.block,
            safety_level: e.safety_level,
            video_url: e.video_url,
          })),
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
        moment,
        tone: chosenTemplate?.tone ?? null,
        decisions, // log de decisões para auditoria
        context: {
          dor_cat, tempo_cat, disposicao, ins_cat, perfil_primario: perfil_curto,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("agent-build-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
