import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useHasWorkout = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["has-workout", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from("client_workouts")
        .select("id")
        .eq("client_id", user.id)
        .eq("status", "Ativo")
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
};
