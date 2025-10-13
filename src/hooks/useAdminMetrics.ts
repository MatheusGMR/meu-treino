import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      // Total de clientes
      const { count: totalClients } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      // Clientes ativos
      const { count: activeClients } = await supabase
        .from("client_assignments")
        .select("*", { count: "exact", head: true })
        .eq("status", "Ativo");

      // Total de profissionais
      const { count: totalProfessionals } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "personal");

      // Total de treinos criados
      const { count: totalWorkouts } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true });

      // Total de sessões concluídas
      const { count: completedSessions } = await supabase
        .from("daily_workout_schedule")
        .select("*", { count: "exact", head: true })
        .eq("completed", true);

      // Clientes sem profissional
      const { count: unassignedClients } = await supabase
        .from("profiles")
        .select("*, client_assignments!inner(personal_id)", { count: "exact", head: true })
        .is("client_assignments.personal_id", null);

      return {
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        totalProfessionals: totalProfessionals || 0,
        totalWorkouts: totalWorkouts || 0,
        completedSessions: completedSessions || 0,
        unassignedClients: unassignedClients || 0,
      };
    },
  });
};
