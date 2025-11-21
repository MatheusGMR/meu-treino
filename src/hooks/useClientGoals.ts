import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useClientGoals = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["client-goals", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const { data: anamnesis, error } = await supabase
        .from("anamnesis")
        .select("primary_goal, desired_body_type")
        .eq("client_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Map primary_goal to user-friendly text
      const goalMapping: Record<string, string> = {
        'Hipertrofia': 'Ganho de Massa',
        'Emagrecimento': 'Perda de Peso',
        'Condicionamento': 'Condicionamento',
        'Saúde': 'Saúde Geral',
      };
      
      return {
        goal: anamnesis?.primary_goal ? goalMapping[anamnesis.primary_goal] || anamnesis.primary_goal : 'Não definido',
        targetWeight: anamnesis?.desired_body_type?.toString() || '0',
      };
    },
    enabled: !!user,
  });
};
