import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { transcription, session_id } = await req.json();
    if (!transcription || !session_id) {
      return new Response(
        JSON.stringify({ error: "transcription and session_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user anamnesis for context
    const { data: anamnesis } = await supabase
      .from("anamnesis")
      .select("primary_goal, medical_restrictions, pain_locations, has_joint_pain, injury_type, escala_dor")
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

    // Build exercise list with original values for before/after comparison
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

    const systemPrompt = `Você é um assistente de personal trainer. O cliente gravou um áudio dizendo como está hoje antes do treino. Analise o que ele disse e:

1. Resuma o humor/estado físico em 1-2 frases (campo "mood_summary")
2. Determine uma categoria: "otimo", "bem", "cansado", "com_dor", "indisposto"
3. Se necessário, sugira ajustes específicos para o treino de hoje. Para cada exercício que precisa de ajuste, forneça os valores ORIGINAIS e SUGERIDOS para que o cliente veja o antes e depois.
4. Inclua estimativa de tempo total do treino original vs adaptado (em minutos).

Contexto do cliente:
- Objetivo: ${anamnesis?.primary_goal || "não informado"}
- Restrições médicas: ${JSON.stringify(anamnesis?.medical_restrictions || [])}
- Dores articulares: ${anamnesis?.has_joint_pain ? `Sim - ${JSON.stringify(anamnesis.pain_locations)}` : "Não"}
- Lesões: ${anamnesis?.injury_type || "nenhuma"}

Treino de hoje: ${sessionData?.name || "não disponível"}
Exercícios com valores originais: ${JSON.stringify(exercisesList)}`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Transcrição do áudio do cliente: "${transcription}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_mood_and_suggest",
                description: "Analyze client mood and suggest workout adjustments with before/after comparison",
                parameters: {
                  type: "object",
                  properties: {
                    mood_summary: { type: "string", description: "1-2 sentence mood summary in Portuguese" },
                    mood_category: { type: "string", enum: ["otimo", "bem", "cansado", "com_dor", "indisposto"] },
                    needs_adjustment: { type: "boolean" },
                    estimated_time_original: { type: "number", description: "Estimated original workout time in minutes" },
                    estimated_time_adapted: { type: "number", description: "Estimated adapted workout time in minutes" },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          exercise_name: { type: "string" },
                          adjustment_type: { type: "string", enum: ["reduce_load", "swap_exercise", "reduce_sets", "skip"] },
                          details: { type: "string" },
                          original_series: { type: "number", description: "Original number of sets" },
                          suggested_series: { type: "number", description: "Suggested number of sets" },
                          original_reps: { type: "string", description: "Original reps range e.g. 8-12" },
                          suggested_reps: { type: "string", description: "Suggested reps range" },
                          original_load: { type: "string", description: "Original load level" },
                          suggested_load: { type: "string", description: "Suggested load level" },
                        },
                        required: ["exercise_name", "adjustment_type", "details", "original_series", "suggested_series", "original_reps", "suggested_reps", "original_load", "suggested_load"],
                      },
                    },
                    overall_recommendation: { type: "string", description: "Overall recommendation message in Portuguese" },
                  },
                  required: ["mood_summary", "mood_category", "needs_adjustment", "suggestions", "overall_recommendation", "estimated_time_original", "estimated_time_adapted"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "analyze_mood_and_suggest" } },
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
      };
    }

    // Save to DB
    const { data: checkin, error: dbError } = await supabase
      .from("daily_checkins")
      .upsert(
        {
          client_id: user.id,
          checkin_date: new Date().toISOString().split("T")[0],
          transcription,
          mood_summary: analysis.mood_summary,
          ai_suggestions: analysis,
        },
        { onConflict: "client_id,checkin_date" }
      )
      .select()
      .single();

    if (dbError) throw dbError;

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
