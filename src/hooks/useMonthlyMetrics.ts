import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useMonthlyMetrics = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["monthly-metrics", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Buscar sessões completadas no mês
      const { data: completions } = await supabase
        .from("daily_workout_schedule")
        .select("*")
        .eq("client_id", user.id)
        .eq("completed", true)
        .gte("completed_at", startOfMonth.toISOString());

      // Buscar treino ativo
      const { data: activeWorkout } = await supabase
        .from("client_workouts")
        .select("total_sessions, completed_sessions")
        .eq("client_id", user.id)
        .eq("status", "Ativo")
        .maybeSingle();

      // Buscar últimas 2 avaliações
      const { data: assessments } = await supabase
        .from("physical_assessments")
        .select("weight, assessment_date")
        .eq("client_id", user.id)
        .order("assessment_date", { ascending: false })
        .limit(2);

      const sessionsThisMonth = completions?.length || 0;
      const totalSessions = activeWorkout?.total_sessions || 0;
      const weightChange = assessments && assessments.length === 2 
        ? Number(assessments[0].weight) - Number(assessments[1].weight) 
        : 0;
      
      // Calcular frequência semanal
      const daysInMonth = new Date().getDate();
      const frequency = daysInMonth > 0 ? (sessionsThisMonth / daysInMonth) * 100 : 0;

      return {
        sessionsCompleted: sessionsThisMonth,
        totalSessions,
        weightChange: weightChange.toFixed(1),
        weeklyFrequency: Math.round(frequency),
      };
    },
    enabled: !!user,
  });
};
