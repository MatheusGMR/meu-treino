import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useClientWorkouts = (clientId: string) => {
  return useQuery({
    queryKey: ["client-workouts", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_workouts")
        .select(`
          *,
          workouts (
            id,
            name,
            training_type,
            level
          )
        `)
        .eq("client_id", clientId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

export const useAssignWorkout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      workoutId,
      startDate,
      endDate,
      notes,
    }: {
      clientId: string;
      workoutId: string;
      startDate: string;
      endDate?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Buscar número de sessões do treino
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_sessions")
        .select("session_id")
        .eq("workout_id", workoutId);

      if (workoutError) throw workoutError;

      const totalSessions = workoutData?.length || 0;

      const { error } = await supabase.from("client_workouts").insert({
        client_id: clientId,
        workout_id: workoutId,
        assigned_by: user.id,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes || null,
        status: "Ativo",
        total_sessions: totalSessions,
        completed_sessions: 0,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-workouts", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-details", variables.clientId] });
      toast({
        title: "Treino atribuído!",
        description: "O treino foi atribuído ao cliente com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atribuir treino",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutAssignmentId,
      data,
    }: {
      workoutAssignmentId: string;
      data: {
        status?: string;
        end_date?: string;
        notes?: string;
        completed_sessions?: number;
      };
    }) => {
      const { error } = await supabase
        .from("client_workouts")
        .update(data)
        .eq("id", workoutAssignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-workouts"] });
      toast({
        title: "Treino atualizado!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar treino",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUnassignWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutAssignmentId: string) => {
      const { error } = await supabase
        .from("client_workouts")
        .delete()
        .eq("id", workoutAssignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-workouts"] });
      toast({
        title: "Treino removido!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover treino",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
