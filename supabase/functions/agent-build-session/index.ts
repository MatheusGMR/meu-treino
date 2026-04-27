// Motor determinístico do Protocolo Destravamento — v2
// Agora delega 100% da seleção de exercícios para a RPC `select_session_exercises`,
// que materializa as 30 combinações OUT-001..OUT-030 da matriz JMP.
// Esta função permanece responsável por: marcos, vídeos obrigatórios, templates de comunicação
// e atualização de progresso.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BuildRequest {
  client_id: string;
  session_number?: number;
}

const PERFIL_TO_SHORT: Record<string, string> = {
  P01_empurrado_pela_dor: "01",
  P02_assustado_com_tempo: "02",
  P03_frustrado: "03",
  P04_estreante: "04",
  P05_sobrecarregado: "05",
  P06_deslocado: "06",
};

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

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const body: BuildRequest = await req.json();
    if (!body.client_id) throw new Error("client_id required");

    // ============ 1. Carregar contexto leve ============
    const [anamnesisRes, progressRes, profileRes, milestonesRes] = await Promise.all([
      supabase.from("anamnesis").select("ins_cat, perfil_primario").eq("client_id", body.client_id).maybeSingle(),
      supabase.from("client_protocol_progress").select("*").eq("client_id", body.client_id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", body.client_id).maybeSingle(),
      supabase.from("protocol_milestones").select("*").order("session_number"),
    ]);

    const anamnesis = anamnesisRes.data;
    const progress = progressRes.data;
    const clientName = profileRes.data?.full_name?.split(" ")[0] ?? "amigo";
    const milestones = milestonesRes.data ?? [];

    if (!anamnesis) throw new Error("Anamnese não encontrada para este cliente");

    const sessionNumber = body.session_number ?? ((progress?.sessao_atual ?? 0) + 1);
    if (sessionNumber < 1 || sessionNumber > 36)
      throw new Error(`Sessão fora do intervalo (1-36): ${sessionNumber}`);

    const bloco = blocoFromSession(sessionNumber);
    const milestone = milestones.find((m: any) => m.session_number === sessionNumber);

    // ============ 2. RPC determinística (motor JMP) ============
    const { data: selection, error: rpcErr } = await supabase.rpc(
      "select_session_exercises",
      { _client_id: body.client_id, _sessao_num: sessionNumber }
    );
    if (rpcErr) throw rpcErr;
    if (!selection || (selection as any).error) {
      throw new Error(`RPC retornou erro: ${JSON.stringify(selection)}`);
    }
    const sel = selection as any;

    // ============ 3. Marcos (vídeos obrigatórios) ============
    let mandatoryVideos: any[] = [];
    if (milestone?.required_video_codes?.length) {
      const { data: videos } = await supabase
        .from("agent_videos")
        .select("*")
        .in("video_code", milestone.required_video_codes);
      mandatoryVideos = videos ?? [];
    }

    // ============ 4. Template de comunicação ============
    const ins_cat = anamnesis.ins_cat ?? "I2";
    const perfil = anamnesis.perfil_primario ?? "P04_estreante";
    const perfil_curto = PERFIL_TO_SHORT[perfil] ?? "04";
    const isMilestone = !!milestone;
    const moment = isMilestone ? "marco" : "pre_sessao";

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

    const totalEx =
      (sel.mobilidade?.length ?? 0) +
      (sel.fortalecimento?.length ?? 0) +
      (sel.resistido?.length ?? 0) +
      (sel.alongamento?.length ?? 0);
    const tempoEstimado = totalEx * 4;
    const calibratedMessage = (chosenTemplate?.template ?? "Bom treino, {nome}!")
      .replace(/\{nome\}/g, clientName)
      .replace(/\{sessao\}/g, String(sessionNumber))
      .replace(/\{tempo_estimado\}/g, String(tempoEstimado));

    // ============ 5. Atualiza progresso ============
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

    // ============ 6. Resposta ============
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          number: sessionNumber,
          bloco,
          treino_letra: sel.treino_letra,
          output_id: sel.output_id,
          modo_d3: sel.modo_d3,
          reps: sel.reps,
          series: sel.series,
          n_exercicios: sel.n_exercicios,
          mobilidade: sel.mobilidade ?? [],
          fortalecimento: sel.fortalecimento ?? [],
          resistido: sel.resistido ?? [],
          alongamento: sel.alongamento ?? [],
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
        decisions: sel.decisions ?? [],
        context: {
          tempo_cat: sel.tempo_cat,
          dor_cat: sel.dor_cat,
          disposicao: sel.disposicao,
          pain_region: sel.pain_region,
          ins_cat: sel.ins_cat,
          nivel_experiencia: sel.nivel_experiencia,
          safety_max: sel.safety_max,
          perfil_primario: perfil_curto,
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
