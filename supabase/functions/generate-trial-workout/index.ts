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

    const regioes = anamnesis.regioes_que_deseja_melhorar || [];
    const targetGroups: string[] = [];
    for (const regiao of regioes) {
      const mapped = regioesMap[regiao];
      if (mapped) {
        for (const g of mapped) {
          if (!targetGroups.includes(g)) targetGroups.push(g);
        }
      }
    }

    // Fallback: grupos básicos se nenhum foi selecionado
    if (targetGroups.length === 0) {
      targetGroups.push("Peito", "Costas", "Pernas", "Ombros");
    }

    // Limitar a 4 grupos para um treino experimental
    const selectedGroups = targetGroups.slice(0, 4);
    console.log("🎯 Grupos selecionados:", selectedGroups);

    // 3. Buscar exercícios para os grupos (1-2 por grupo, nível adequado)
    const nivel = anamnesis.nivel_experiencia || "Iniciante";
    const exerciseLevel = nivel === "Avançado" ? undefined : "Iniciante";

    const { data: exercises, error: exError } = await supabase
      .from("exercises")
      .select("id, name, exercise_group, level")
      .in("exercise_group", selectedGroups)
      .limit(50);

    if (exError) throw exError;

    if (!exercises || exercises.length === 0) {
      console.log("⚠️ Nenhum exercício encontrado nos grupos, buscando qualquer exercício...");
      const { data: fallbackExercises, error: fbError } = await supabase
        .from("exercises")
        .select("id, name, exercise_group, level")
        .limit(8);

      if (fbError) throw fbError;
      if (!fallbackExercises || fallbackExercises.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "Nenhum exercício disponível na base" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      exercises.push(...fallbackExercises);
    }

    // Selecionar 1-2 exercícios por grupo
    const selectedExercises: typeof exercises = [];
    for (const group of selectedGroups) {
      const groupExercises = exercises.filter(e => e.exercise_group === group);
      // Preferir exercícios de nível iniciante
      const sorted = groupExercises.sort((a, b) => {
        if (a.level === exerciseLevel) return -1;
        if (b.level === exerciseLevel) return 1;
        return 0;
      });
      const count = sorted.length >= 2 ? 2 : sorted.length;
      selectedExercises.push(...sorted.slice(0, count));
    }

    // Limitar a 6 exercícios total
    const finalExercises = selectedExercises.slice(0, 6);
    console.log("💪 Exercícios selecionados:", finalExercises.map(e => e.name));

    if (finalExercises.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível selecionar exercícios adequados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Buscar método e volume padrão (primeiro de cada)
    const { data: defaultMethod } = await supabase
      .from("methods")
      .select("id")
      .limit(1)
      .single();

    const { data: defaultVolume } = await supabase
      .from("volumes")
      .select("id")
      .limit(1)
      .single();

    if (!defaultMethod || !defaultVolume) {
      return new Response(
        JSON.stringify({ success: false, error: "Método ou volume padrão não configurados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Criar sessão
    const sessionName = "Sessão Experimental";
    const sessionDesc = `Treino experimental baseado na sua anamnese - focado em: ${selectedGroups.join(", ")}`;

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        name: sessionName,
        description: sessionDesc,
        session_type: "Musculação",
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
    const { data: workout, error: wError } = await supabase
      .from("workouts")
      .insert({
        name: `Treino Experimental - ${anamnesis.primary_goal || "Geral"}`,
        training_type: "Musculação",
        level: nivel === "Avançado" ? "Avançado" : "Iniciante",
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
        targetGroups: selectedGroups,
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
