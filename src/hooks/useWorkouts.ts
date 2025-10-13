import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { WorkoutFormData } from "@/lib/schemas/workoutSchema";

export const useWorkouts = (filters?: {
  types?: string[];
  levels?: string[];
  search?: string;
}) => {
  return useQuery({
    queryKey: ["workouts", filters],
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("*, workout_sessions(count)")
        .order("created_at", { ascending: false });

      if (filters?.types && filters.types.length > 0) {
        query = query.in("training_type", filters.types as any);
      }

      if (filters?.levels && filters.levels.length > 0) {
        query = query.in("level", filters.levels as any);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useWorkoutWithSessions = (id: string) => {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          *,
          workout_sessions (
            *,
            sessions (
              *,
              session_exercises (
                *,
                exercises (*)
              )
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: WorkoutFormData) => {
      // Create workout
      const { data: workout, error: workoutError } = await supabase
        .from("workouts")
        .insert({
          name: data.name,
          training_type: data.training_type,
          level: data.level,
          gender: data.gender,
          age_range: data.age_range,
          created_by: user?.id,
          responsible_id: user?.id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create workout sessions
      const { error: sessionsError } = await supabase
        .from("workout_sessions")
        .insert(
          data.sessions.map((s) => ({
            session_id: s.session_id,
            workout_id: workout.id,
            order_index: s.order_index,
          }))
        );

      if (sessionsError) throw sessionsError;

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast({
        title: "Sucesso!",
        description: "Treino criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar treino: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkoutFormData }) => {
      // Update workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .update({
          name: data.name,
          training_type: data.training_type,
          level: data.level,
          gender: data.gender,
          age_range: data.age_range,
        })
        .eq("id", id);

      if (workoutError) throw workoutError;

      // Delete old sessions
      const { error: deleteError } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("workout_id", id);

      if (deleteError) throw deleteError;

      // Insert new sessions
      const { error: sessionsError } = await supabase
        .from("workout_sessions")
        .insert(
          data.sessions.map((s) => ({
            session_id: s.session_id,
            workout_id: id,
            order_index: s.order_index,
          }))
        );

      if (sessionsError) throw sessionsError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["workout", variables.id] });
      toast({
        title: "Sucesso!",
        description: "Treino atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar treino: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast({
        title: "Sucesso!",
        description: "Treino deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao deletar treino: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
