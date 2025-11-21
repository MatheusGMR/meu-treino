import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useWeeklySchedule = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["weekly-schedule", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Get last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("daily_workout_schedule")
        .select(`
          *,
          sessions (
            id,
            name,
            session_exercises (
              exercises (
                thumbnail_url
              )
            )
          )
        `)
        .eq("client_id", user.id)
        .gte("scheduled_for", startDate)
        .lte("scheduled_for", endDate)
        .order("scheduled_for", { ascending: true });

      if (error) throw error;
      
      // Transform data to match DayCarousel format
      const transformedData = (data || []).map((schedule, index) => ({
        id: schedule.id,
        dayNumber: index + 1,
        completed: schedule.completed || false,
        locked: false, // Could add logic here based on previous day completion
        thumbnailUrl: schedule.sessions?.session_exercises?.[0]?.exercises?.thumbnail_url || undefined,
        scheduledFor: schedule.scheduled_for,
      }));
      
      return transformedData;
    },
    enabled: !!user,
  });
};
