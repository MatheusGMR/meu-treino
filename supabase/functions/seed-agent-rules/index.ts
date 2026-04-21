import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mapeamento perfil curto → enum perfil_comportamental
const PERFIL_MAP: Record<string, string> = {
  "01": "P01_empurrado_pela_dor",
  "02": "P02_assustado_com_tempo",
  "03": "P03_frustrado",
  "04": "P04_estreante",
  "05": "P05_sobrecarregado",
  "06": "P06_deslocado",
};

// ============== MARCOS DO PROTOCOLO (9 sessões-chave) ==============
const MILESTONES = [
  { session_number: 1, milestone_type: "inicio", title: "Início do Protocolo", required_video_codes: ["VID-INTRO-01", "VID-INTRO-02"], client_message_template: "Hoje começa o seu Protocolo Destravamento, {nome}. Vamos no seu ritmo. Antes de iniciar, assista os dois vídeos abaixo — eles vão te orientar.", jmp_action: "Confirmar que cliente assistiu vídeos de introdução. Revisar alert_medical se houver.", triggers_alert: false },
  { session_number: 6, milestone_type: "revisao_I3", title: "Revisão Sessão 6", required_video_codes: [], client_message_template: "Você completou 6 sessões, {nome}! Vamos revisar como está se sentindo para ajustar o caminho.", jmp_action: "Para clientes I3 com experiência prévia: revisar progresso e considerar avanço para I2.", triggers_alert: true, alert_type: "checkpoint_jmp" },
  { session_number: 12, milestone_type: "encerra_bloco", title: "Encerramento do Bloco 1", required_video_codes: ["VID-PROG-B2"], client_message_template: "{nome}, você concluiu o Bloco 1! 12 sessões. Vamos conhecer o que vem no Bloco 2.", jmp_action: "Validar transição Bloco 1 → 2. Conferir frequência semanal.", triggers_alert: false },
  { session_number: 13, milestone_type: "inicia_bloco", title: "Início do Bloco 2", required_video_codes: ["VID-PROG-B2"], client_message_template: "Bem-vindo ao Bloco 2, {nome}. Agora vamos um pouco mais fundo. Confia no processo.", jmp_action: "Confirmar início do Bloco 2.", triggers_alert: false },
  { session_number: 18, milestone_type: "checkpoint_jmp", title: "Checkpoint — Metade do Caminho", required_video_codes: [], client_message_template: "Metade do caminho, {nome}. 18 de 36. Que orgulho de você ter chegado até aqui.", jmp_action: "Checkpoint obrigatório JMP: revisar histórico de dor, frequência, aderência.", triggers_alert: true, alert_type: "checkpoint_jmp" },
  { session_number: 24, milestone_type: "encerra_bloco", title: "Encerramento do Bloco 2", required_video_codes: ["VID-PROG-B3"], client_message_template: "{nome}, fim do Bloco 2! 24 sessões. Vamos pro Bloco 3, o último antes da reta final.", jmp_action: "Validar transição Bloco 2 → 3.", triggers_alert: false },
  { session_number: 25, milestone_type: "inicia_bloco", title: "Início do Bloco 3", required_video_codes: ["VID-PROG-B3"], client_message_template: "Bloco 3, {nome}. A maturidade do movimento. Vamos juntos.", jmp_action: "Confirmar início do Bloco 3.", triggers_alert: false },
  { session_number: 30, milestone_type: "checkpoint_jmp", title: "Checkpoint Final", required_video_codes: [], client_message_template: "30 sessões, {nome}! 6 pra fechar. Você vem firme.", jmp_action: "Checkpoint final JMP: preparar plano pós-protocolo, avaliar resultados.", triggers_alert: true, alert_type: "checkpoint_jmp" },
  { session_number: 36, milestone_type: "encerra_protocolo", title: "Encerramento do Protocolo", required_video_codes: ["VID-FIM-01"], client_message_template: "Você concluiu o Protocolo Destravamento, {nome}. 36 sessões. Hoje é o seu dia. Assista o vídeo final.", jmp_action: "Encerrar protocolo. Disponibilizar relatório completo + sugestão de continuidade.", triggers_alert: false },
];

// ============== VÍDEOS DO AGENTE ==============
const VIDEOS = [
  { video_code: "VID-INTRO-01", title: "Bem-vindo ao Protocolo Destravamento", description: "Introdução ao método e expectativas para as próximas 36 sessões.", mandatory_at_session: 1 },
  { video_code: "VID-INTRO-02", title: "Como funciona seu treino diário", description: "Explicação prática: aquecimento, mobilidade, fortalecimento e como reportar dor.", mandatory_at_session: 1 },
  { video_code: "VID-PROG-B2", title: "Bloco 2 — O que muda", description: "O que esperar do segundo bloco e como progredir com segurança.", mandatory_at_session: 13 },
  { video_code: "VID-PROG-B3", title: "Bloco 3 — Reta final", description: "Maturidade do movimento e preparação para a continuidade.", mandatory_at_session: 25 },
  { video_code: "VID-FIM-01", title: "Você conseguiu — Encerramento do Protocolo", description: "Mensagem final do JMP e próximos passos.", mandatory_at_session: 36 },
  { video_code: "VID-ENC-I3-03", title: "Mensagem para quem tem insegurança alta", description: "Apoio direto para perfis I3.", recommended_for_ins_cat: "I3" },
  { video_code: "VID-DOR-01", title: "Como interpretar a sua dor", description: "Diferença entre desconforto e dor real.", recommended_for_dor_cat: "D2" },
];

// ============== TEMPLATES DE COMUNICAÇÃO ==============
const TEMPLATES_RAW: Array<{
  perfil_curto: string | null;
  ins_cat: string | null;
  moment: string;
  tone: string;
  template: string;
  verbos_chave?: string[];
  reforcar?: string[];
  evitar?: string[];
}> = [
  // PERFIL 01 — Empurrado pela Dor
  { perfil_curto: "01", ins_cat: "I1", moment: "pre_sessao", tone: "direto_acolhedor", template: "Bom te ver, {nome}. Hoje vamos cuidar do que te trouxe aqui. Sem pressa.", verbos_chave: ["cuidar", "aliviar"], reforcar: ["alívio progressivo"], evitar: ["força", "intensidade"] },
  { perfil_curto: "01", ins_cat: "I2", moment: "pre_sessao", tone: "acolhedor", template: "Olá, {nome}. Sei que a dor incomoda. Vamos no seu tempo, um movimento de cada vez.", reforcar: ["respeito ao corpo"], evitar: ["desafio"] },
  { perfil_curto: "01", ins_cat: "I3", moment: "pre_sessao", tone: "muito_acolhedor", template: "{nome}, antes de qualquer coisa: nada do que você fizer hoje precisa doer. Se algo incomodar, paramos. Tá combinado?", reforcar: ["segurança", "controle"], evitar: ["urgência", "performance"] },
  { perfil_curto: "01", ins_cat: null, moment: "pos_sessao", tone: "validador", template: "Você cuidou de você hoje, {nome}. Isso já é resultado." },

  // PERFIL 02 — Assustado com Tempo
  { perfil_curto: "02", ins_cat: "I1", moment: "pre_sessao", tone: "objetivo", template: "{nome}, vamos otimizar. Treino enxuto, foco no que importa.", reforcar: ["eficiência"], evitar: ["enrolação"] },
  { perfil_curto: "02", ins_cat: "I2", moment: "pre_sessao", tone: "objetivo_acolhedor", template: "Sei que seu tempo é curto, {nome}. Hoje vamos focar no essencial — em até {tempo_estimado} minutos." },
  { perfil_curto: "02", ins_cat: "I3", moment: "pre_sessao", tone: "tranquilizador", template: "{nome}, mesmo que dê só 20 minutos hoje, vai valer. Comece e veja como se sente." },
  { perfil_curto: "02", ins_cat: null, moment: "pos_sessao", tone: "objetivo", template: "Pronto, {nome}. Mais um dia em dia. Bora pra próxima." },

  // PERFIL 03 — Frustrado
  { perfil_curto: "03", ins_cat: "I1", moment: "pre_sessao", tone: "leve_motivador", template: "{nome}, hoje é dia novo. Esquece o que não deu certo antes. Vamos fazer diferente.", reforcar: ["recomeço"], evitar: ["culpa", "comparação"] },
  { perfil_curto: "03", ins_cat: "I2", moment: "pre_sessao", tone: "validador", template: "Você está aqui, {nome}, e isso já vale. Vamos sem expectativa, só presente." },
  { perfil_curto: "03", ins_cat: "I3", moment: "pre_sessao", tone: "muito_acolhedor", template: "{nome}, ninguém vai te cobrar nada. Cada sessão é um pequeno passo. Você é o ritmo." },

  // PERFIL 04 — Estreante
  { perfil_curto: "04", ins_cat: "I1", moment: "pre_sessao", tone: "guia", template: "Bem-vindo, {nome}. Vou te guiar passo a passo. Qualquer dúvida, é só perguntar.", reforcar: ["aprendizado"], evitar: ["jargão técnico"] },
  { perfil_curto: "04", ins_cat: "I2", moment: "pre_sessao", tone: "didatico", template: "{nome}, hoje você vai conhecer movimentos novos. Vou explicar tudo. Sem pressão." },
  { perfil_curto: "04", ins_cat: "I3", moment: "pre_sessao", tone: "muito_acolhedor", template: "{nome}, primeiro: relaxa. Não tem certo nem errado. A gente aprende juntos." },

  // PERFIL 05 — Sobrecarregado
  { perfil_curto: "05", ins_cat: "I1", moment: "pre_sessao", tone: "leve", template: "{nome}, o treino de hoje é seu momento. Esquece o resto por 30 minutos.", reforcar: ["pausa", "presença"] },
  { perfil_curto: "05", ins_cat: "I2", moment: "pre_sessao", tone: "acolhedor", template: "Sei que o dia foi pesado, {nome}. Vamos calibrar pra o que você consegue agora." },
  { perfil_curto: "05", ins_cat: "I3", moment: "pre_sessao", tone: "muito_acolhedor", template: "{nome}, se hoje é só mobilidade, está ótimo. O importante é não quebrar o ritmo." },

  // PERFIL 06 — Deslocado
  { perfil_curto: "06", ins_cat: "I1", moment: "pre_sessao", tone: "convidativo", template: "{nome}, vamos descobrir junto o que funciona pra você. Cada corpo é único." },
  { perfil_curto: "06", ins_cat: "I2", moment: "pre_sessao", tone: "acolhedor", template: "{nome}, aqui você não precisa se encaixar em nada. A gente molda o treino ao seu corpo." },
  { perfil_curto: "06", ins_cat: "I3", moment: "pre_sessao", tone: "muito_acolhedor", template: "{nome}, treino não é lugar de comparação. É lugar seu. Vamos no seu ritmo." },

  // GENÉRICOS por momento
  { perfil_curto: null, ins_cat: null, moment: "marco", tone: "celebracao", template: "{nome}, hoje é um marco no seu Protocolo. Sessão {sessao} de 36." },
  { perfil_curto: null, ins_cat: null, moment: "alerta", tone: "cuidado", template: "{nome}, percebi que algo mudou no seu corpo. Vou avisar a equipe JMP pra te apoiar." },
  { perfil_curto: null, ins_cat: null, moment: "encerramento", tone: "celebracao", template: "{nome}, você concluiu as 36 sessões. Que jornada. Obrigado pela confiança." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin access required");

    const report = { milestones: 0, videos: 0, templates: 0, errors: [] as string[] };

    for (const m of MILESTONES) {
      const { error } = await supabase.from("protocol_milestones").upsert(m as any, { onConflict: "session_number" });
      if (error) report.errors.push(`milestone ${m.session_number}: ${error.message}`);
      else report.milestones++;
    }

    for (const v of VIDEOS) {
      const { error } = await supabase.from("agent_videos").upsert(v as any, { onConflict: "video_code" });
      if (error) report.errors.push(`video ${v.video_code}: ${error.message}`);
      else report.videos++;
    }

    await supabase.from("agent_communication_templates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    for (const t of TEMPLATES_RAW) {
      const payload = {
        perfil_primario: t.perfil_curto ? PERFIL_MAP[t.perfil_curto] : null,
        ins_cat: t.ins_cat,
        moment: t.moment,
        tone: t.tone,
        template: t.template,
        verbos_chave: t.verbos_chave ?? null,
        reforcar: t.reforcar ?? null,
        evitar: t.evitar ?? null,
        active: true,
      };
      const { error } = await supabase.from("agent_communication_templates").insert(payload as any);
      if (error) report.errors.push(`template ${t.perfil_curto}/${t.ins_cat}/${t.moment}: ${error.message}`);
      else report.templates++;
    }

    return new Response(JSON.stringify({ success: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-agent-rules error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
