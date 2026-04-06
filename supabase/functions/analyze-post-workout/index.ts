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

    const { transcription, session_id, schedule_id } = await req.json();
    if (!transcription) {
      return new Response(
        JSON.stringify({ error: "transcription is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch session info for context
    let sessionInfo = null;
    if (session_id) {
      const { data } = await supabase
        .from("sessions")
        .select(`
          name, description,
          session_exercises (
            order_index,
            exercises ( name, primary_muscle, exercise_group ),
            methods ( name, reps_min, reps_max, load_level ),
            volumes ( num_series )
          )
        `)
        .eq("id", session_id)
        .single();
      sessionInfo = data;
    }

    // Fetch schedule completion data
    let scheduleInfo = null;
    if (schedule_id) {
      const { data } = await supabase
        .from("daily_workout_schedule")
        .select("completed_exercises_count, total_weight_lifted, completed_at, scheduled_for")
        .eq("id", schedule_id)
        .single();
      scheduleInfo = data;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um assistente fitness falando DIRETAMENTE com o aluno que acabou de treinar. Use linguagem em segunda pessoa ("você"), nunca se refira a "o cliente" ou "o aluno" em terceira pessoa.

Analise o feedback pós-treino e:

1. Resuma como a pessoa se sentiu em 1-2 frases falando DIRETAMENTE com ela. Ex: "Você teve um ótimo treino hoje! Mesmo com o cansaço do trabalho, manteve o foco." (campo "mood_summary")
2. Determine uma categoria: "otimo", "bem", "cansado", "com_dor", "indisposto"
3. Determine a dificuldade percebida: "facil", "ideal", "dificil", "muito_dificil"
4. Identifique pontos de atenção: dores novas, desconfortos, problemas de sono, estresse do trabalho, cansaço acumulado
5. Gere dicas práticas de recuperação direcionadas ao aluno (ex: "Tome bastante água nas próximas 2h", "Faça um alongamento leve de 5 min antes de dormir")
6. Gere insights técnicos para o personal trainer (este campo NÃO será mostrado ao aluno)

Treino realizado: ${sessionInfo?.name || "não disponível"}
Exercícios: ${JSON.stringify(sessionInfo?.session_exercises?.map((se: any) => ({
  nome: se.exercises?.name,
  grupo: se.exercises?.exercise_group,
  series: se.volumes?.num_series,
  reps: `${se.methods?.reps_min}-${se.methods?.reps_max}`,
})) || [])}
${scheduleInfo ? `Exercícios concluídos: ${scheduleInfo.completed_exercises_count}, Volume total: ${scheduleInfo.total_weight_lifted}kg` : ""}

REGRAS:
- mood_summary e recovery_tips devem falar DIRETAMENTE com o aluno usando "você"
- recovery_tips deve conter dicas práticas e acionáveis (hidratação, alongamento, sono, alimentação)
- trainer_insights é para o personal e pode usar linguagem técnica
- NÃO sugira alterações no treino atual`;

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
            { role: "user", content: `Transcrição do áudio pós-treino do cliente: "${transcription}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_post_workout",
                description: "Analyze client post-workout feedback",
                parameters: {
                  type: "object",
                  properties: {
                    mood_summary: { type: "string", description: "1-2 frases falando diretamente com o aluno usando 'você'. Ex: 'Você mandou bem hoje!'" },
                    mood_category: { type: "string", enum: ["otimo", "bem", "cansado", "com_dor", "indisposto"] },
                    difficulty_rating: { type: "string", enum: ["facil", "ideal", "dificil", "muito_dificil"] },
                    attention_points: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string", enum: ["dor", "cansaco", "sono", "trabalho", "emocional", "outro"] },
                          description: { type: "string", description: "Descrição falando diretamente com o aluno usando 'você'" },
                          severity: { type: "string", enum: ["baixa", "media", "alta"] },
                        },
                        required: ["category", "description", "severity"],
                      },
                    },
                    recovery_tips: { type: "string", description: "Dicas práticas e acionáveis para o aluno. Ex: 'Hidrate-se bem nas próximas 2h e faça um alongamento leve antes de dormir.'" },
                    trainer_insights: { type: "string", description: "Insights técnicos para o personal trainer (não será mostrado ao aluno)" },
                  },
                  required: ["mood_summary", "mood_category", "difficulty_rating", "attention_points", "recovery_tips", "trainer_insights"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "analyze_post_workout" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente." }), {
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
        mood_summary: "Feedback recebido.",
        mood_category: "bem",
        difficulty_rating: "ideal",
        attention_points: [],
        recovery_tips: "Descanse bem e hidrate-se.",
        trainer_insights: "Nenhum ponto de atenção identificado.",
      };
    }

    // Save to DB
    const { data: feedback, error: dbError } = await supabase
      .from("post_workout_feedbacks")
      .insert({
        client_id: user.id,
        schedule_id: schedule_id || null,
        session_id: session_id || null,
        feedback_date: new Date().toISOString().split("T")[0],
        transcription,
        mood_summary: analysis.mood_summary,
        mood_category: analysis.mood_category,
        ai_analysis: analysis,
        difficulty_rating: analysis.difficulty_rating,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ feedback, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-post-workout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
