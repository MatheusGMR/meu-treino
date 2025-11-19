import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useClientActiveWorkouts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-active-workouts", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("client_workouts")
        .select(`
          *,
          workouts (
            id,
            name,
            training_type,
            level,
            workout_sessions (
              session_id,
              order_index,
              sessions (
                id,
                name,
                description,
                session_exercises (
                  id
                )
              )
            )
          )
        `)
        .eq("client_id", user.id)
        .eq("status", "Ativo")
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useNextScheduledSession = (clientWorkoutId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["next-scheduled-session", clientWorkoutId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("daily_workout_schedule")
        .select(`
          *,
          sessions (
            id,
            name,
            description
          )
        `)
        .eq("client_workout_id", clientWorkoutId)
        .eq("client_id", user.id)
        .eq("completed", false)
        .gte("scheduled_for", today)
        .order("scheduled_for", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!clientWorkoutId,
  });
};