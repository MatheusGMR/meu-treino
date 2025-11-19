import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTodayWorkout = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["today-workout", user?.id],
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
            description,
            session_exercises (
              *,
              exercises (*)
            )
          )
        `)
        .eq("client_id", user.id)
        .eq("scheduled_for", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
