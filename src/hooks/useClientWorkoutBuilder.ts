import { useState, useMemo, useCallback, useEffect } from "react";
import { useWorkoutMuscleAnalysis, useSessionMuscleAnalysis } from "./useWorkoutMuscleAnalysis";
import { useHealthCompatibilityCheck } from "./useHealthCompatibilityCheck";
import { useAssignWorkout } from "./useClientWorkouts";
import { useClientDetails } from "./useClients";
import { useClientAnamnesis } from "./useAnamnesis";
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
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | undefined>();
  const [tempWorkout, setTempWorkout] = useState<TempWorkout>({
    name: "Treino Personalizado",
    sessions: [],
  });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [acknowledgeRisks, setAcknowledgeRisks] = useState(false);

  const assignWorkoutMutation = useAssignWorkout();
  
  // Buscar dados do cliente
  const { data: clientDetails } = useClientDetails(clientId);
  const { data: anamnesisData } = useClientAnamnesis(clientId);

  // Análise muscular em tempo real
  const workoutAnalysis = useWorkoutMuscleAnalysis(
    mode === "existing" ? selectedWorkoutId : undefined
  );

  // Análise de saúde em tempo real
  const healthCheck = useHealthCompatibilityCheck(
    clientId,
    mode === "existing" ? selectedWorkoutId : undefined
  );

  // Análise muscular para treino temporário (modo criar novo)
  const tempMuscleAnalysis = useMemo(() => {
    if (mode !== "new" || tempWorkout.sessions.length === 0) {
      return {
        muscleGroups: [],
        totalExercises: 0,
        warnings: [],
        isBalanced: true,
      };
    }

    // Mapear todos os exercícios das sessões temporárias
    const allExercises: Array<{ name: string; group: string }> = [];
    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        // Aqui precisaríamos buscar os dados do exercício, mas para análise em tempo real
        // vamos assumir que temos acesso aos dados via cache ou props
        allExercises.push({
          name: ex.exercise_id, // Placeholder
          group: "Peito", // Placeholder - precisaria buscar dados reais
        });
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
    muscleGroups.forEach((mg) => {
      if (mg.percentage > 40) {
        warnings.push(
          `${mg.group} está com ${mg.percentage.toFixed(0)}% do treino - pode estar sobrecarregado`
        );
      }
    });

    return {
      muscleGroups: muscleGroups.sort((a, b) => b.percentage - a.percentage),
      totalExercises,
      warnings,
      isBalanced: warnings.length === 0,
    };
  }, [mode, tempWorkout]);

  // Combinar análises baseado no modo
  const muscleAnalysis =
    mode === "existing"
      ? workoutAnalysis.data || { muscleGroups: [], totalExercises: 0, warnings: [], isBalanced: true }
      : tempMuscleAnalysis;

  const compatibility = healthCheck.data || {
    compatible: true,
    warnings: [],
    criticalIssues: [],
    recommendations: [],
    riskLevel: "safe" as const,
  };

  // Funções de manipulação de sessões
  const addExistingSession = useCallback((sessionId: string, sessionData: any) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          id: sessionId,
          name: sessionData.name,
          description: sessionData.description,
          exercises: sessionData.exercises || [],
        },
      ],
    }));
  }, []);

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
    if (mode === "existing") {
      if (!selectedWorkoutId) return false;
      if (compatibility.riskLevel === "critical" && !acknowledgeRisks) return false;
      return true;
    } else {
      if (tempWorkout.sessions.length === 0) return false;
      if (compatibility.riskLevel === "critical" && !acknowledgeRisks) return false;
      return true;
    }
  }, [mode, selectedWorkoutId, tempWorkout, compatibility, acknowledgeRisks]);

  // Submit
  const submit = useCallback(async () => {
    if (!canSubmit) return;

    // TODO: Implementar lógica de criação de treino temporário se necessário
    // Por enquanto, só funciona com treinos existentes
    if (mode === "existing" && selectedWorkoutId) {
      await assignWorkoutMutation.mutateAsync({
        clientId,
        workoutId: selectedWorkoutId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate?.toISOString().split("T")[0],
        notes,
      });
    }
  }, [
    canSubmit,
    mode,
    selectedWorkoutId,
    clientId,
    startDate,
    endDate,
    notes,
    assignWorkoutMutation,
  ]);

  // Calcular tempo estimado
  const estimatedTime = useMemo(() => {
    const totalExercises = muscleAnalysis.totalExercises;
    // Estimativa: 3-5 min por exercício
    return `${totalExercises * 3}-${totalExercises * 5} min`;
  }, [muscleAnalysis]);

  return {
    mode,
    setMode,
    selectedWorkoutId,
    setSelectedWorkoutId,
    tempWorkout,
    setTempWorkout,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    notes,
    setNotes,
    acknowledgeRisks,
    setAcknowledgeRisks,
    muscleAnalysis,
    compatibility,
    estimatedTime,
    addExistingSession,
    addNewSession,
    removeSession,
    updateSession,
    canSubmit,
    submit,
    isSubmitting: assignWorkoutMutation.isPending,
    // Dados do cliente
    clientProfile: clientDetails?.profile,
    clientAnamnesis: anamnesisData?.anamnesis,
  };
};
