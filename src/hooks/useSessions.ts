import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { SessionFormData } from "@/lib/schemas/sessionSchema";

export const useSessions = (filters?: {
  types?: string[];
  search?: string;
}) => {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: async () => {
      let query = supabase
        .from("sessions")
        .select("*, session_exercises(count)")
        .order("created_at", { ascending: false });

      if (filters?.types && filters.types.length > 0) {
        query = query.in("session_type", filters.types as any);
      }

      if (filters?.search) {
        query = query.ilike("description", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSessionWithExercises = (id: string) => {
  return useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          *,
          session_exercises (
            *,
            exercises (*)
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

export const useExercisesByType = (sessionType: string) => {
  const groupMapping: Record<string, string[]> = {
    Mobilidade: ["Abdômen", "Pernas", "Costas", "Outro"],
    Alongamento: ["Abdômen", "Pernas", "Costas", "Ombros", "Outro"],
    Musculação: [
      "Abdômen",
      "Peito",
      "Costas",
      "Pernas",
      "Ombros",
      "Bíceps",
      "Tríceps",
      "Glúteos",
      "Panturrilha",
    ],
  };

  const allowedGroups = groupMapping[sessionType] || [];

  return useQuery({
    queryKey: ["exercises-by-type", sessionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .in("exercise_group", allowedGroups as any)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!sessionType && allowedGroups.length > 0,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SessionFormData) => {
      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          description: data.description,
          session_type: data.session_type,
          created_by: user?.id,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create session exercises
      const { error: exercisesError } = await supabase
        .from("session_exercises")
        .insert(
          data.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            session_id: session.id,
            order_index: ex.order_index,
            sets: ex.sets,
            reps: ex.reps,
            rest_time: ex.rest_time,
            notes: ex.notes,
          }))
        );

      if (exercisesError) throw exercisesError;

      return session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Sucesso!",
        description: "Sessão criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar sessão: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SessionFormData }) => {
      // Update session
      const { error: sessionError } = await supabase
        .from("sessions")
        .update({
          description: data.description,
          session_type: data.session_type,
        })
        .eq("id", id);

      if (sessionError) throw sessionError;

      // Delete old exercises
      const { error: deleteError } = await supabase
        .from("session_exercises")
        .delete()
        .eq("session_id", id);

      if (deleteError) throw deleteError;

      // Insert new exercises
      const { error: exercisesError } = await supabase
        .from("session_exercises")
        .insert(
          data.exercises.map((ex) => ({
            exercise_id: ex.exercise_id,
            session_id: id,
            order_index: ex.order_index,
            sets: ex.sets,
            reps: ex.reps,
            rest_time: ex.rest_time,
            notes: ex.notes,
          }))
        );

      if (exercisesError) throw exercisesError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", variables.id] });
      toast({
        title: "Sucesso!",
        description: "Sessão atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar sessão: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast({
        title: "Sucesso!",
        description: "Sessão deletada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao deletar sessão: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
