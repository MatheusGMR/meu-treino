import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId } = await req.json();
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "clientId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📋 Gerando treino experimental para cliente:", clientId);

    // 1. Buscar anamnese do cliente
    const { data: anamnesis, error: anamnesisError } = await supabase
      .from("anamnesis")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (anamnesisError || !anamnesis) {
      throw new Error("Anamnese não encontrada");
    }

    // 2. Determinar grupos musculares prioritários baseado nas regiões
    const regioesMap: Record<string, string[]> = {
      "Peito": ["Peito"],
      "Costas": ["Costas"],
      "Ombros": ["Ombros"],
      "Braços": ["Bíceps", "Tríceps"],
      "Abdômen": ["Abdômen"],
      "Quadríceps": ["Quadríceps", "Pernas"],
      "Posterior de coxa": ["Posterior"],
      "Glúteos": ["Glúteos"],
      "Panturrilhas": ["Panturrilha"],
      "Mobilidade": ["Outro"],
      "Postura": ["Lombar", "Costas"],
    };

    // 2. Buscar exercícios de mobilidade e alongamento prioritariamente
    console.log("🧘 Buscando exercícios de mobilidade e alongamento...");

    // Priorizar exercícios de Mobilidade e Alongamento
    const { data: mobilityExercises, error: mobError } = await supabase
      .from("exercises")
      .select("id, name, exercise_group, level, exercise_type")
      .in("exercise_type", ["Mobilidade", "Alongamento"])
      .limit(30);

    if (mobError) throw mobError;

    let finalExercises = mobilityExercises || [];

    // Se não tiver exercícios suficientes de mobilidade/alongamento, buscar gerais leves
    if (finalExercises.length < 4) {
      console.log("⚠️ Poucos exercícios de mobilidade, complementando...");
      const { data: fallbackExercises, error: fbError } = await supabase
        .from("exercises")
        .select("id, name, exercise_group, level, exercise_type")
        .limit(20);

      if (!fbError && fallbackExercises) {
        // Adicionar exercícios que não são duplicados
        const existingIds = new Set(finalExercises.map(e => e.id));
        for (const ex of fallbackExercises) {
          if (!existingIds.has(ex.id)) {
            finalExercises.push(ex);
          }
        }
      }
    }

    // Ordenar: mobilidade primeiro, depois alongamento, depois outros
    finalExercises.sort((a, b) => {
      const priority: Record<string, number> = { "Mobilidade": 0, "Alongamento": 1, "Musculação": 2, "Cardio": 3 };
      return (priority[a.exercise_type] ?? 4) - (priority[b.exercise_type] ?? 4);
    });

    // Limitar a 6 exercícios
    finalExercises = finalExercises.slice(0, 6);
    console.log("🧘 Exercícios selecionados:", finalExercises.map(e => `${e.name} (${e.exercise_type})`));

    if (finalExercises.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum exercício disponível na base" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Buscar método e volume padrão (criar fallback automaticamente se vazio)
    let { data: defaultMethod } = await supabase
      .from("methods")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!defaultMethod) {
      console.log("⚙️ Nenhum método encontrado — criando fallback padrão");
      const { data: newMethod, error: nmErr } = await supabase
        .from("methods")
        .insert({
          name: "Padrão Mobilidade",
          reps_min: 8,
          reps_max: 12,
          rest_seconds: 30,
          load_level: "Baixa",
          cadence_contraction: 2,
          cadence_pause: 1,
          cadence_stretch: 2,
          reps_description: "8 a 12 repetições controladas",
        })
        .select("id")
        .single();
      if (nmErr) throw nmErr;
      defaultMethod = newMethod;
    }

    let { data: defaultVolume } = await supabase
      .from("volumes")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!defaultVolume) {
      console.log("⚙️ Nenhum volume encontrado — criando fallback padrão");
      const { data: newVolume, error: nvErr } = await supabase
        .from("volumes")
        .insert({
          name: "Padrão Mobilidade",
          num_series: 3,
          num_exercises: 6,
        })
        .select("id")
        .single();
      if (nvErr) throw nvErr;
      defaultVolume = newVolume;
    }

    // 4. Determinar tipo de sessão
    const hasMobility = finalExercises.some(e => e.exercise_type === "Mobilidade");
    const hasStretching = finalExercises.some(e => e.exercise_type === "Alongamento");
    const sessionType = hasMobility ? "Mobilidade" : hasStretching ? "Alongamento" : "Musculação";

    // 5. Criar sessão
    const sessionName = "Mobilidade & Bem-estar";
    const sessionDesc = "Sessão experimental de mobilidade e alongamento para preparar seu corpo para os treinos personalizados.";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        name: sessionName,
        description: sessionDesc,
        session_type: sessionType,
      })
      .select()
      .single();

    if (sessionError || !session) throw sessionError || new Error("Erro ao criar sessão");

    // 6. Vincular exercícios à sessão
    const sessionExercises = finalExercises.map((ex, idx) => ({
      session_id: session.id,
      exercise_id: ex.id,
      method_id: defaultMethod.id,
      volume_id: defaultVolume.id,
      order_index: idx,
    }));

    const { error: seError } = await supabase
      .from("session_exercises")
      .insert(sessionExercises);

    if (seError) throw seError;

    // 7. Criar workout
    const nivel = anamnesis.nivel_experiencia || "Iniciante";
    const { data: workout, error: wError } = await supabase
      .from("workouts")
      .insert({
        name: "Treino Experimental - Mobilidade & Bem-estar",
        training_type: "Funcional",
        level: "Iniciante",
      })
      .select()
      .single();

    if (wError || !workout) throw wError || new Error("Erro ao criar treino");

    // 8. Vincular sessão ao workout
    const { error: wsError } = await supabase
      .from("workout_sessions")
      .insert({
        workout_id: workout.id,
        session_id: session.id,
        order_index: 0,
      });

    if (wsError) throw wsError;

    // 9. Atribuir ao cliente
    const today = new Date().toISOString().split("T")[0];
    const { data: clientWorkout, error: cwError } = await supabase
      .from("client_workouts")
      .insert({
        client_id: clientId,
        workout_id: workout.id,
        start_date: today,
        status: "Ativo",
        total_sessions: 1,
        completed_sessions: 0,
        notes: "⚡ Treino experimental gerado automaticamente. Seu treino personalizado será criado pelo profissional em até 24h.",
      })
      .select()
      .single();

    if (cwError || !clientWorkout) throw cwError || new Error("Erro ao atribuir treino");

    // 10. Criar agendamento para hoje
    const { error: schedError } = await supabase
      .from("daily_workout_schedule")
      .insert({
        client_id: clientId,
        client_workout_id: clientWorkout.id,
        session_id: session.id,
        scheduled_for: today,
        session_order: 0,
        completed: false,
      });

    if (schedError) {
      console.warn("⚠️ Erro ao agendar (não crítico):", schedError);
    }

    console.log("✅ Treino experimental criado com sucesso:", {
      workoutId: workout.id,
      sessionId: session.id,
      exerciseCount: finalExercises.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        workoutId: workout.id,
        sessionId: session.id,
        exerciseCount: finalExercises.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro ao gerar treino experimental:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
