// build-session — Motor único do Protocolo Destravamento
// Substitui agent-build-session (real) e simulate-protocol-session (admin).
// 1 função, 2 modos: "real" | "simulation". Mesma RPC `select_session_exercises`.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "real" | "simulation";

interface BuildRequest {
  mode: Mode;
  client_id?: string;
  session_number?: number;
  // simulation-only:
  perfil_primario?: string;
  ins_cat?: "I1" | "I2" | "I3";
  dor_cat?: "D0" | "D1" | "D2" | "D3";
  dor_local?: string[];
  tempo_cat?: "T1" | "T2" | "T3";
  disposicao?: "OK" | "Moderada" | "Comprometida";
  client_name?: string;
  nivel_experiencia?: "iniciante" | "intermediario" | "avancado";
}

const PERFIL_TO_SHORT: Record<string, string> = {
  P01_empurrado_pela_dor: "01",
  P02_assustado_com_tempo: "02",
  P03_frustrado: "03",
  P04_estreante: "04",
  P05_sobrecarregado: "05",
  P06_deslocado: "06",
};

const SIM_CLIENT_ID = "00000000-0000-0000-0000-sim000000001";

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
    const mode: Mode = body.mode ?? "real";

    if (mode !== "real" && mode !== "simulation") {
      throw new Error(`Invalid mode: ${mode}`);
    }

    // ============ Modo simulação: requer admin ============
    if (mode === "simulation") {
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) throw new Error("Apenas admins podem simular");
    }

    // ============ Resolver client_id e session_number ============
    let clientId: string;
    let sessionNumber: number;
    let simContext: {
      perfil: string;
      perfil_curto: string;
      ins_cat: string;
      clientName: string;
    } | null = null;

    if (mode === "real") {
      if (!body.client_id) throw new Error("client_id required em modo real");
      clientId = body.client_id;

      const { data: progress } = await supabase
        .from("client_protocol_progress")
        .select("sessao_atual")
        .eq("client_id", clientId)
        .maybeSingle();

      sessionNumber = body.session_number ?? ((progress?.sessao_atual ?? 0) + 1);
    } else {
      // simulation
      if (!body.session_number) throw new Error("session_number required em modo simulação");
      sessionNumber = body.session_number;

      const dor_cat = body.dor_cat ?? "D0";
      const dor_local = body.dor_local ?? [];
      const tempo_cat = body.tempo_cat ?? "T2";
      const disposicao = body.disposicao ?? "OK";
      const ins_cat = body.ins_cat ?? "I2";
      const perfil = body.perfil_primario ?? "P04_estreante";
      const nivel = body.nivel_experiencia ?? "iniciante";
      const clientName = (body.client_name ?? "Cliente").split(" ")[0];

      clientId = body.client_id ?? SIM_CLIENT_ID;
      simContext = {
        perfil,
        perfil_curto: PERFIL_TO_SHORT[perfil] ?? "04",
        ins_cat,
        clientName,
      };

      // Se for cliente-sim sintético, prepara dados temporários
      if (!body.client_id) {
        const bloco = blocoFromSession(sessionNumber);

        await supabase.from("anamnesis").upsert(
          {
            client_id: SIM_CLIENT_ID,
            ins_cat,
            perfil_primario: perfil,
            dor_cat,
            dor_local,
            nivel_experiencia_norm: nivel,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "client_id" }
        );

        await supabase.from("client_protocol_progress").upsert(
          {
            client_id: SIM_CLIENT_ID,
            sessao_atual: Math.max(0, sessionNumber - 1),
            bloco_atual: bloco,
            total_sessoes: 36,
            status: "ativo",
          },
          { onConflict: "client_id" }
        );

        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("daily_checkin_sessions")
          .delete()
          .eq("client_id", SIM_CLIENT_ID)
          .eq("checkin_date", today);
        await supabase.from("daily_checkin_sessions").insert({
          client_id: SIM_CLIENT_ID,
          checkin_date: today,
          tempo_cat,
          dor_cat_dia: dor_cat,
          dor_local_dia: dor_local,
          disposicao,
          transcription: `[SIM] T=${tempo_cat} D=${dor_cat} Disp=${disposicao} Local=${dor_local.join(",")}`,
        });
      }
    }

    if (sessionNumber < 1 || sessionNumber > 36) {
      throw new Error(`Sessão fora do intervalo (1-36): ${sessionNumber}`);
    }

    const bloco = blocoFromSession(sessionNumber);

    // ============ Carregar contexto leve (real precisa, sim usa simContext) ============
    let realPerfil = "P04_estreante";
    let realInsCat = "I2";
    let realClientName = "amigo";

    if (mode === "real") {
      const [anamnesisRes, profileRes] = await Promise.all([
        supabase
          .from("anamnesis")
          .select("ins_cat, perfil_primario")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", clientId).maybeSingle(),
      ]);
      if (!anamnesisRes.data) throw new Error("Anamnese não encontrada para este cliente");
      realInsCat = anamnesisRes.data.ins_cat ?? "I2";
      realPerfil = anamnesisRes.data.perfil_primario ?? "P04_estreante";
      realClientName = profileRes.data?.full_name?.split(" ")[0] ?? "amigo";
    }

    const perfil = simContext?.perfil ?? realPerfil;
    const perfil_curto = simContext?.perfil_curto ?? PERFIL_TO_SHORT[perfil] ?? "04";
    const ins_cat = simContext?.ins_cat ?? realInsCat;
    const clientName = simContext?.clientName ?? realClientName;

    // ============ Marcos ============
    const { data: milestones } = await supabase
      .from("protocol_milestones")
      .select("*")
      .order("session_number");
    const milestone = (milestones ?? []).find((m: any) => m.session_number === sessionNumber);

    // ============ RPC determinística (motor JMP) ============
    const { data: selection, error: rpcErr } = await supabase.rpc("select_session_exercises", {
      _client_id: clientId,
      _sessao_num: sessionNumber,
    });
    if (rpcErr) throw rpcErr;
    if (!selection || (selection as any).error) {
      throw new Error(`RPC retornou erro: ${JSON.stringify(selection)}`);
    }
    const sel = selection as any;

    // ============ Vídeos obrigatórios do marco ============
    let mandatoryVideos: any[] = [];
    if (milestone?.required_video_codes?.length) {
      const { data: videos } = await supabase
        .from("agent_videos")
        .select("*")
        .in("video_code", milestone.required_video_codes);
      mandatoryVideos = videos ?? [];
    }

    // ============ Template de comunicação ============
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

    const resistArr = Array.isArray(sel.resistido) ? sel.resistido : [];
    const totalEx =
      (sel.mobilidade?.length ?? 0) +
      (sel.fortalecimento?.length ?? 0) +
      resistArr.length +
      (sel.alongamento?.length ?? 0);
    const tempoEstimado = totalEx * 4;
    const calibratedMessage = (chosenTemplate?.template ?? "Bom treino, {nome}!")
      .replace(/\{nome\}/g, clientName)
      .replace(/\{sessao\}/g, String(sessionNumber))
      .replace(/\{tempo_estimado\}/g, String(tempoEstimado));

    // ============ Atualiza progresso (apenas modo real) ============
    if (mode === "real") {
      const { data: existingProgress } = await supabase
        .from("client_protocol_progress")
        .select("client_id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from("client_protocol_progress")
          .update({
            bloco_atual: bloco,
            sessao_atual: sessionNumber,
            updated_at: new Date().toISOString(),
          })
          .eq("client_id", clientId);
      } else {
        await supabase.from("client_protocol_progress").insert({
          client_id: clientId,
          sessao_atual: sessionNumber,
          bloco_atual: bloco,
          total_sessoes: 36,
          status: "ativo",
        });
      }
    }

    // ============ Resposta unificada ============
    return new Response(
      JSON.stringify({
        success: true,
        mode,
        simulation: mode === "simulation", // compat com UI atual
        unified_motor: true,
        session: {
          number: sessionNumber,
          bloco,
          treino_letra: sel.treino_letra,
          output_id: sel.output_id,
          modo_d3: sel.modo_d3,
          reps: sel.reps,
          series: sel.series,
          n_exercicios: sel.n_exercicios,
          safety_max: sel.safety_max,
          mobilidade: sel.mobilidade ?? [],
          fortalecimento: sel.fortalecimento ?? [],
          resistido: sel.resistido ?? [],
          alongamento: sel.alongamento ?? [],
          exercise_count: totalEx,
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
        tone: chosenTemplate?.tone ?? null,
        decisions: sel.decisions ?? [],
        context: {
          tempo_cat: sel.tempo_cat,
          dor_cat: sel.dor_cat,
          disposicao: sel.disposicao,
          pain_region: sel.pain_region,
          dor_locals: sel.dor_locals,
          ins_cat: sel.ins_cat,
          nivel_experiencia: sel.nivel_experiencia,
          safety_max: sel.safety_max,
          perfil_primario: perfil_curto,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("build-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
