import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkoutMuscleAnalysis, useSessionMuscleAnalysis } from "./useWorkoutMuscleAnalysis";
import { useHealthCompatibilityCheck } from "./useHealthCompatibilityCheck";
import { useAssignWorkout } from "./useClientWorkouts";
import { useClientDetails } from "./useClients";
import { useClientAnamnesis } from "./useAnamnesis";
import { useExercises } from "./useExercises";
import { useSessions } from "./useSessions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface TempSession {
  id?: string;
  name: string;
  description: string;
  exercises: SessionExerciseData[];
  isNew?: boolean;
  isEdited?: boolean;
}

interface TempWorkout {
  name: string;
  training_type?: string;
  level?: string;
  gender?: string;
  sessions: TempSession[];
}

export const useClientWorkoutBuilder = (clientId: string) => {
  const [tempWorkout, setTempWorkout] = useState<TempWorkout>({
    name: "",
    sessions: [],
  });
  const [acknowledgeRisks, setAcknowledgeRisks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const assignWorkoutMutation = useAssignWorkout();
  
  // Buscar dados do cliente
  const { data: clientDetails } = useClientDetails(clientId);
  const { data: anamnesisData } = useClientAnamnesis(clientId);
  
  // Buscar dados dos exercícios para análise correta
  const { data: exercisesData } = useExercises();

  // Análise de saúde em tempo real
  const healthCheck = useHealthCompatibilityCheck(clientId, undefined);

  // Análise muscular para treino temporário
  const muscleAnalysis = useMemo(() => {
    if (tempWorkout.sessions.length === 0 || !exercisesData) {
      return {
        muscleGroups: [],
        totalExercises: 0,
        warnings: [],
        isBalanced: true,
      };
    }

    // Criar mapa de exerciseId -> dados do exercício
    const exerciseMap = new Map(
      exercisesData.map(ex => [ex.id, ex])
    );

    // Mapear todos os exercícios das sessões temporárias com dados reais
    const allExercises: Array<{ name: string; group: string }> = [];
    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const exerciseData = exerciseMap.get(ex.exercise_id);
        if (exerciseData) {
          allExercises.push({
            name: exerciseData.name,
            group: exerciseData.exercise_group,
          });
        }
      });
    });

    const groupCounts: Record<string, { count: number; exercises: string[] }> = {};
    allExercises.forEach((ex) => {
      if (!groupCounts[ex.group]) {
        groupCounts[ex.group] = { count: 0, exercises: [] };
      }
      groupCounts[ex.group].count++;
      groupCounts[ex.group].exercises.push(ex.name);
    });

    const totalExercises = allExercises.length;
    const muscleGroups = Object.entries(groupCounts).map(([group, data]) => ({
      group,
      count: data.count,
      percentage: totalExercises > 0 ? (data.count / totalExercises) * 100 : 0,
      exercises: data.exercises,
    }));

    const warnings: string[] = [];
    
    // Verificar sobrecarga de grupos
    muscleGroups.forEach((mg) => {
      if (mg.percentage > 40) {
        warnings.push(
          `${mg.group} está com ${mg.percentage.toFixed(0)}% do treino - pode estar sobrecarregado`
        );
      }
    });

    // Verificar grupos antagonistas
    const hasChest = muscleGroups.find((mg) => mg.group === "Peito");
    const hasBack = muscleGroups.find((mg) => mg.group === "Costas");
    
    if (hasChest && !hasBack) {
      warnings.push("Treino trabalha Peito mas não trabalha Costas - risco de desequilíbrio muscular");
    }
    if (hasBack && !hasChest) {
      warnings.push("Treino trabalha Costas mas não trabalha Peito - considere balancear");
    }

    const hasQuadriceps = muscleGroups.find((mg) => mg.group === "Quadríceps" || mg.group === "Pernas");
    const hasHamstrings = muscleGroups.find((mg) => mg.group === "Posterior");
    
    if (hasQuadriceps && !hasHamstrings) {
      warnings.push("Treino trabalha frente das pernas mas não posterior - risco de desequilíbrio");
    }

    return {
      muscleGroups: muscleGroups.sort((a, b) => b.percentage - a.percentage),
      totalExercises,
      warnings,
      isBalanced: warnings.length === 0,
    };
  }, [tempWorkout, exercisesData]);

  // Análise de impacto dos exercícios
  const impactAnalysis = useMemo(() => {
    if (tempWorkout.sessions.length === 0 || !exercisesData) {
      return {
        distribution: { Baixo: 0, Médio: 0, Alto: 0 },
        totalExercises: 0,
        overallIntensity: 'balanced' as 'light' | 'balanced' | 'intense',
        warnings: [] as string[],
        score: 0,
      };
    }

    const exerciseMap = new Map(exercisesData.map(ex => [ex.id, ex]));
    
    const impactCounts = { Baixo: 0, Médio: 0, Alto: 0 };
    let totalExercises = 0;

    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const exerciseData = exerciseMap.get(ex.exercise_id);
        if (exerciseData?.impact_level) {
          impactCounts[exerciseData.impact_level as keyof typeof impactCounts]++;
          totalExercises++;
        }
      });
    });

    // Calcular percentuais
    const distribution = {
      Baixo: totalExercises > 0 ? (impactCounts.Baixo / totalExercises) * 100 : 0,
      Médio: totalExercises > 0 ? (impactCounts.Médio / totalExercises) * 100 : 0,
      Alto: totalExercises > 0 ? (impactCounts.Alto / totalExercises) * 100 : 0,
    };

    // Calcular score (1 = leve, 2 = médio, 3 = intenso)
    const score = totalExercises > 0
      ? ((impactCounts.Baixo * 1) + (impactCounts.Médio * 2) + (impactCounts.Alto * 3)) / totalExercises
      : 0;

    // Determinar intensidade geral
    let overallIntensity: 'light' | 'balanced' | 'intense';
    if (score < 1.7) {
      overallIntensity = 'light';
    } else if (score > 2.3) {
      overallIntensity = 'intense';
    } else {
      overallIntensity = 'balanced';
    }

    // Gerar warnings
    const warnings: string[] = [];
    
    if (distribution.Alto > 50) {
      warnings.push('⚡ Treino com alta intensidade - verifique a recuperação do cliente');
    }
    
    if (distribution.Alto > 70) {
      warnings.push('🔥 Treino muito intenso - risco de sobrecarga');
    }
    
    if (distribution.Baixo > 70) {
      warnings.push('💤 Treino com baixa intensidade - pode não gerar estímulo suficiente');
    }
    
    // Considerar nível de atividade do cliente
    const activityLevel = anamnesisData?.anamnesis?.activity_level;
    if (activityLevel === 'Sedentário' && distribution.Alto > 30) {
      warnings.push('⚠️ Cliente sedentário com muitos exercícios de alto impacto');
    }
    
    if (activityLevel === 'Muito Ativo' && distribution.Baixo > 50) {
      warnings.push('💡 Cliente muito ativo - considere aumentar a intensidade');
    }

    return {
      distribution,
      totalExercises,
      overallIntensity,
      warnings,
      score: Math.round(score * 10) / 10,
    };
  }, [tempWorkout, exercisesData, anamnesisData]);

  const compatibility = healthCheck.data || {
    compatible: true,
    warnings: [],
    criticalIssues: [],
    recommendations: [],
    riskLevel: "safe" as const,
  };


  const addNewSession = useCallback((session: TempSession) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: [...prev.sessions, { ...session, isNew: true }],
    }));
  }, []);

  const removeSession = useCallback((index: number) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index),
    }));
  }, []);

  const updateSession = useCallback((index: number, updatedSession: TempSession) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s, i) =>
        i === index ? { ...updatedSession, isEdited: true } : s
      ),
    }));
  }, []);

  const reorderSessions = useCallback((startIndex: number, endIndex: number) => {
    setTempWorkout((prev) => {
      const sessions = [...prev.sessions];
      const [removed] = sessions.splice(startIndex, 1);
      sessions.splice(endIndex, 0, removed);
      return { ...prev, sessions };
    });
  }, []);

  const reorderExercisesInSession = useCallback((sessionIndex: number, startIndex: number, endIndex: number) => {
    setTempWorkout((prev) => {
      const session = prev.sessions[sessionIndex];
      if (!session) return prev;

      const exercises = [...session.exercises];
      const [removed] = exercises.splice(startIndex, 1);
      exercises.splice(endIndex, 0, removed);

      // Reordenar order_index
      const reorderedExercises = exercises.map((ex, idx) => ({
        ...ex,
        order_index: idx,
      }));

      const updatedSessions = prev.sessions.map((s, i) =>
        i === sessionIndex ? { ...s, exercises: reorderedExercises, isEdited: true } : s
      );

      return { ...prev, sessions: updatedSessions };
    });
  }, []);

  // Adicionar sessão existente
  const addExistingSession = useCallback(async (sessionId: string) => {
    try {
      // Buscar detalhes completos da sessão
      const { data: fullSession, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_exercises (
            *,
            exercises (*),
            volumes (*),
            methods (*)
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error || !fullSession) {
        console.error("Erro ao buscar sessão:", error);
        toast({
          title: "Erro ao adicionar sessão",
          description: "Não foi possível carregar os detalhes da sessão",
          variant: "destructive",
        });
        return;
      }

      // Adicionar ao tempWorkout
      setTempWorkout((prev) => ({
        ...prev,
        sessions: [
          ...prev.sessions,
          {
            id: fullSession.id,
            name: fullSession.name,
            description: fullSession.description,
            exercises: fullSession.session_exercises.map((se: any) => ({
              exercise_id: se.exercise_id,
              volume_id: se.volume_id,
              method_id: se.method_id,
              order_index: se.order_index,
            })),
            isNew: false,
          },
        ],
      }));

      toast({
        title: "Sessão adicionada",
        description: `${fullSession.name} foi adicionada ao treino`,
      });
    } catch (error) {
      console.error("Erro ao adicionar sessão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a sessão",
        variant: "destructive",
      });
    }
  }, []);

  // Helper para obter IDs de sessões existentes
  const getExistingSessionIds = useCallback(() => {
    return tempWorkout.sessions
      .filter((s) => !s.isNew && s.id)
      .map((s) => s.id!)
      .filter(Boolean);
  }, [tempWorkout]);

  // Validação para submit
  const canSubmit = useMemo(() => {
    if (!tempWorkout.name.trim()) return false;
    if (tempWorkout.sessions.length === 0) return false;
    if (tempWorkout.sessions[0].exercises.length === 0) return false;
    if (compatibility.riskLevel === "critical" && !acknowledgeRisks) return false;
    return true;
  }, [tempWorkout, compatibility, acknowledgeRisks]);

  // Submit - cria treino novo sempre
  const submit = useCallback(async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      // Separar sessões novas das existentes
      const newSessions = tempWorkout.sessions.filter((s) => s.isNew);
      const existingSessionIds = tempWorkout.sessions
        .filter((s) => !s.isNew && s.id)
        .map((s) => s.id!);

      const { data, error } = await supabase.functions.invoke('create-workout-and-assign', {
        body: {
          clientId,
          workoutName: tempWorkout.name,
          newSessions,
          existingSessionIds,
          trainingType: tempWorkout.training_type,
          level: tempWorkout.level,
          gender: tempWorkout.gender,
          startDate: new Date().toISOString().split('T')[0],
        },
      });

      if (error) {
        console.error("Erro ao criar treino:", error);
        toast({
          title: "Erro ao criar treino",
          description: error.message || "Não foi possível criar o treino",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Treino criado com sucesso:", data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["client-workouts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-details", clientId] });
      queryClient.invalidateQueries({ queryKey: ["today-workout", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-active-workouts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      
      toast({
        title: "Treino criado e atribuído!",
        description: "O treino foi criado e atribuído ao cliente com sucesso.",
      });
      
      return data;
    } catch (error) {
      console.error("Erro ao criar treino:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, tempWorkout, clientId, queryClient]);

  // Calcular tempo estimado
  const estimatedTime = useMemo(() => {
    const totalExercises = muscleAnalysis.totalExercises;
    // Estimativa: 3-5 min por exercício
    return `${totalExercises * 3}-${totalExercises * 5} min`;
  }, [muscleAnalysis]);

  // Calcular volume semanal estimado
  const weeklyVolume = useMemo(() => {
    const totalSets = tempWorkout.sessions.reduce((sum, session) => {
      return sum + session.exercises.length * 3; // Estimativa de 3 séries por exercício
    }, 0);
    
    return {
      totalSets,
      setsPerMuscle: muscleAnalysis.muscleGroups.map(mg => ({
        group: mg.group,
        sets: Math.round((mg.percentage / 100) * totalSets),
      })),
    };
  }, [tempWorkout, muscleAnalysis]);

  return {
    tempWorkout,
    setTempWorkout,
    acknowledgeRisks,
    setAcknowledgeRisks,
    muscleAnalysis,
    impactAnalysis,
    compatibility,
    estimatedTime,
    weeklyVolume,
    addNewSession,
    removeSession,
    updateSession,
    reorderSessions,
    reorderExercisesInSession,
    addExistingSession,
    getExistingSessionIds,
    canSubmit,
    submit,
    isSubmitting,
    clientProfile: clientDetails?.profile,
    clientAnamnesis: anamnesisData?.anamnesis,
  };
};
