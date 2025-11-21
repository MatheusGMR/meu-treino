import { useState, useMemo, useCallback, useEffect } from "react";
import { useWorkoutMuscleAnalysis, useSessionMuscleAnalysis } from "./useWorkoutMuscleAnalysis";
import { useHealthCompatibilityCheck } from "./useHealthCompatibilityCheck";
import { useAssignWorkout } from "./useClientWorkouts";
import { useClientDetails } from "./useClients";
import { useClientAnamnesis } from "./useAnamnesis";
import { useExercises } from "./useExercises";
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
    
    // TODO: Implementar criação de workout+session via edge function
    console.log("Criar treino:", tempWorkout);
  }, [canSubmit, tempWorkout]);

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
    compatibility,
    estimatedTime,
    weeklyVolume,
    addNewSession,
    removeSession,
    updateSession,
    canSubmit,
    submit,
    isSubmitting: assignWorkoutMutation.isPending,
    clientProfile: clientDetails?.profile,
    clientAnamnesis: anamnesisData?.anamnesis,
  };
};
