import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {
      transcription,
      session_id,
      contexto_pergunta,
      pergunta_exibida,
      hora_checkin,
      dia_util,
    } = await req.json();
    if (!transcription || !session_id) {
      return new Response(
        JSON.stringify({ error: "transcription and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user anamnesis for context
    const { data: anamnesis } = await supabase
      .from("anamnesis")
      .select("primary_goal, medical_restrictions, pain_locations, has_joint_pain, injury_type, escala_dor, perfil_primario, ins_cat, dor_cat")
      .eq("client_id", user.id)
      .maybeSingle();

    // Fetch today's session exercises for context
    const { data: sessionData } = await supabase
      .from("sessions")
      .select(`
        name, description,
        session_exercises (
          order_index,
          exercises ( name, primary_muscle, exercise_group, contraindication ),
          methods ( name, reps_min, reps_max, rest_seconds, load_level ),
          volumes ( num_series, num_exercises )
        )
      `)
      .eq("id", session_id)
      .single();

    const exercisesList = sessionData?.session_exercises?.map(se => ({
      nome: se.exercises?.name || "Exercício",
      grupo: se.exercises?.exercise_group || "",
      musculo: se.exercises?.primary_muscle || "",
      series_original: se.volumes?.num_series || 3,
      reps_original: `${se.methods?.reps_min || 8}-${se.methods?.reps_max || 12}`,
      carga_original: se.methods?.load_level || "Moderada",
      descanso_original: se.methods?.rest_seconds || 60,
    })) || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um assistente de personal trainer brasileiro. O cliente respondeu, em áudio livre, a uma pergunta contextual de check-in pré-treino. Sua tarefa é DUPLA:

A) EXTRAÇÃO ESTRUTURADA (obrigatória, mesmo se ausente — use null):
   - dor_cat: D0 (sem dor) | D1 (leve, não atrapalha) | D2 (moderada, atrapalha) | D3 (intensa, impede)
   - dor_local[]: regiões mencionadas (ex: ["lombar","ombro direito"])
   - tempo_cat: T1 (até 20min) | T2 (20-40min) | T3 (40min+) — null se não mencionou
   - disposicao: OK | Moderada | Comprometida
   - vocab_capturado[]: 3-8 palavras/expressões LITERAIS marcantes do cliente (ex: ["travado","sem energia","dor chata"])

B) ANÁLISE DE TREINO (igual antes):
   - mood_summary, mood_category (otimo|bem|cansado|com_dor|indisposto)
   - needs_adjustment, suggestions[], overall_recommendation
   - estimated_time_original/adapted

Contexto do cliente:
- Pergunta exibida: "${pergunta_exibida || "Como você está hoje?"}"
- Contexto: ${contexto_pergunta || "geral"} (${dia_util ? "dia útil" : "fim de semana"})
- Objetivo: ${anamnesis?.primary_goal || "não informado"}
- Perfil: ${anamnesis?.perfil_primario || "não calculado"} | Insegurança: ${anamnesis?.ins_cat || "?"} | Dor base: ${anamnesis?.dor_cat || "?"}
- Restrições: ${JSON.stringify(anamnesis?.medical_restrictions || [])}
- Dores articulares: ${anamnesis?.has_joint_pain ? `Sim - ${JSON.stringify(anamnesis.pain_locations)}` : "Não"}

Treino de hoje: ${sessionData?.name || "não disponível"}
Exercícios: ${JSON.stringify(exercisesList)}`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Resposta do cliente: "${transcription}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_checkin_v2",
                description: "Extract categorical state + workout adjustments",
                parameters: {
                  type: "object",
                  properties: {
                    dor_cat: { type: ["string", "null"], enum: ["D0", "D1", "D2", "D3", null] },
                    dor_local: { type: "array", items: { type: "string" } },
                    tempo_cat: { type: ["string", "null"], enum: ["T1", "T2", "T3", null] },
                    disposicao: { type: ["string", "null"], enum: ["OK", "Moderada", "Comprometida", null] },
                    vocab_capturado: { type: "array", items: { type: "string" } },
                    mood_summary: { type: "string" },
                    mood_category: { type: "string", enum: ["otimo", "bem", "cansado", "com_dor", "indisposto"] },
                    needs_adjustment: { type: "boolean" },
                    estimated_time_original: { type: "number" },
                    estimated_time_adapted: { type: "number" },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exercise_name: { type: "string" },
                          adjustment_type: { type: "string", enum: ["reduce_load", "swap_exercise", "reduce_sets", "skip"] },
                          details: { type: "string" },
                          original_series: { type: "number" },
                          suggested_series: { type: "number" },
                          original_reps: { type: "string" },
                          suggested_reps: { type: "string" },
                          original_load: { type: "string" },
                          suggested_load: { type: "string" },
                        },
                        required: ["exercise_name", "adjustment_type", "details", "original_series", "suggested_series", "original_reps", "suggested_reps", "original_load", "suggested_load"],
                      },
                    },
                    overall_recommendation: { type: "string" },
                  },
                  required: ["mood_summary", "mood_category", "needs_adjustment", "suggestions", "overall_recommendation", "estimated_time_original", "estimated_time_adapted", "dor_cat", "tempo_cat", "disposicao", "vocab_capturado", "dor_local"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "analyze_checkin_v2" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;

    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      analysis = {
        mood_summary: "Check-in recebido.",
        mood_category: "bem",
        needs_adjustment: false,
        suggestions: [],
        overall_recommendation: "Treino pode seguir normalmente.",
        estimated_time_original: 45,
        estimated_time_adapted: 45,
        dor_cat: null,
        dor_local: [],
        tempo_cat: null,
        disposicao: null,
        vocab_capturado: [],
      };
    }

    const today = new Date().toISOString().split("T")[0];

    // 1) Persist legacy table (back-compat)
    const { data: checkin, error: dbError } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          client_id: user.id,
          checkin_date: today,
          transcription,
          mood_summary: analysis.mood_summary,
          ai_suggestions: analysis,
        },
        { onConflict: "client_id,checkin_date" }
      )
      .select()
      .single();

    if (dbError) throw dbError;

    // 2) Persist v2 categorical session (independent — triggers downstream alerts)
    const { error: v2Error } = await supabase
      .from("daily_checkin_sessions")
      .insert({
        client_id: user.id,
        checkin_date: today,
        hora_checkin: hora_checkin || null,
        dia_util: dia_util ?? true,
        contexto_pergunta: contexto_pergunta || null,
        pergunta_exibida: pergunta_exibida || null,
        transcription,
        dor_cat_dia: analysis.dor_cat,
        dor_local_dia: analysis.dor_local || [],
        tempo_cat: analysis.tempo_cat,
        disposicao: analysis.disposicao,
        vocab_capturado: analysis.vocab_capturado || [],
        ai_summary: analysis.mood_summary,
        ai_raw_response: analysis,
      });

    if (v2Error) console.error("daily_checkin_sessions insert error:", v2Error);

    return new Response(JSON.stringify({ checkin, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-checkin error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
