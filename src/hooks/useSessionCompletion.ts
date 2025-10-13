import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompleteSetData {
  clientWorkoutId: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: string;
  weight: number;
  notes?: string;
  restTimeUsed?: number;
}

export const useCompleteSet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CompleteSetData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("session_completions")
        .insert({
          client_workout_id: data.clientWorkoutId,
          session_id: data.sessionId,
          exercise_id: data.exerciseId,
          sets_completed: data.setNumber,
          reps_completed: data.reps,
          weight_used: data.weight,
          notes: data.notes,
          rest_time_used: data.restTimeUsed,
          client_id: userData.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session-progress"] });
      toast({ title: "Série registrada!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar série",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("daily_workout_schedule")
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-metrics"] });
      toast({ 
        title: "Parabéns! 🎉", 
        description: "Treino do dia concluído!" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao completar sessão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
