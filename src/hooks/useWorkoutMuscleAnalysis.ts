import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MuscleGroupDistribution {
  group: string;
  count: number;
  percentage: number;
  exercises: string[];
}

interface MuscleAnalysis {
  muscleGroups: MuscleGroupDistribution[];
  totalExercises: number;
  warnings: string[];
  isBalanced: boolean;
}

export const useWorkoutMuscleAnalysis = (workoutId?: string) => {
  return useQuery({
    queryKey: ["workout-muscle-analysis", workoutId],
    queryFn: async (): Promise<MuscleAnalysis> => {
      if (!workoutId) {
        return {
          muscleGroups: [],
          totalExercises: 0,
          warnings: [],
          isBalanced: true,
        };
      }

      // Buscar treino com sessões e exercícios
      const { data: workout, error } = await supabase
        .from("workouts")
        .select(`
          *,
          workout_sessions (
            *,
            sessions (
              *,
              session_exercises (
                *,
                exercises (
                  id,
                  name,
                  exercise_group
                )
              )
            )
          )
        `)
        .eq("id", workoutId)
        .single();

      if (error) throw error;

      // Mapear todos os exercícios
      const allExercises: Array<{ name: string; group: string }> = [];
      workout.workout_sessions?.forEach((ws: any) => {
        ws.sessions?.session_exercises?.forEach((se: any) => {
          if (se.exercises) {
            allExercises.push({
              name: se.exercises.name,
              group: se.exercises.exercise_group,
            });
          }
        });
      });

      // Contar grupos musculares
      const groupCounts: Record<string, { count: number; exercises: string[] }> = {};
      allExercises.forEach((ex) => {
        if (!groupCounts[ex.group]) {
          groupCounts[ex.group] = { count: 0, exercises: [] };
        }
        groupCounts[ex.group].count++;
        groupCounts[ex.group].exercises.push(ex.name);
      });

      const totalExercises = allExercises.length;
      const muscleGroups: MuscleGroupDistribution[] = Object.entries(groupCounts).map(
        ([group, data]) => ({
          group,
          count: data.count,
          percentage: totalExercises > 0 ? (data.count / totalExercises) * 100 : 0,
          exercises: data.exercises,
        })
      );

      // Detectar desequilíbrios
      const warnings: string[] = [];
      muscleGroups.forEach((mg) => {
        if (mg.percentage > 40) {
          warnings.push(`${mg.group} está com ${mg.percentage.toFixed(0)}% do treino - pode estar sobrecarregado`);
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

      const isBalanced = warnings.length === 0;

      return {
        muscleGroups: muscleGroups.sort((a, b) => b.percentage - a.percentage),
        totalExercises,
        warnings,
        isBalanced,
      };
    },
    enabled: !!workoutId,
  });
};

export const useSessionMuscleAnalysis = (sessionId?: string) => {
  return useQuery({
    queryKey: ["session-muscle-analysis", sessionId],
    queryFn: async (): Promise<MuscleAnalysis> => {
      if (!sessionId) {
        return {
          muscleGroups: [],
          totalExercises: 0,
          warnings: [],
          isBalanced: true,
        };
      }

      const { data: session, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_exercises (
            *,
            exercises (
              id,
              name,
              exercise_group
            )
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      const allExercises: Array<{ name: string; group: string }> = [];
      session.session_exercises?.forEach((se: any) => {
        if (se.exercises) {
          allExercises.push({
            name: se.exercises.name,
            group: se.exercises.exercise_group,
          });
        }
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
      const muscleGroups: MuscleGroupDistribution[] = Object.entries(groupCounts).map(
        ([group, data]) => ({
          group,
          count: data.count,
          percentage: totalExercises > 0 ? (data.count / totalExercises) * 100 : 0,
          exercises: data.exercises,
        })
      );

      const warnings: string[] = [];
      muscleGroups.forEach((mg) => {
        if (mg.percentage > 50) {
          warnings.push(`${mg.group} domina ${mg.percentage.toFixed(0)}% da sessão`);
        }
      });

      return {
        muscleGroups: muscleGroups.sort((a, b) => b.percentage - a.percentage),
        totalExercises,
        warnings,
        isBalanced: warnings.length === 0,
      };
    },
    enabled: !!sessionId,
  });
};
