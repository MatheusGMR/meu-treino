import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useClientAnamnesisProfile = (clientId: string) => {
  return useQuery({
    queryKey: ["client-anamnesis-profile", clientId],
    queryFn: async () => {
      // Buscar anamnese do cliente
      const { data: anamnesis, error: anamnesisError } = await supabase
        .from("anamnesis")
        .select("calculated_profile")
        .eq("client_id", clientId)
        .single();

      if (anamnesisError) throw anamnesisError;
      if (!anamnesis?.calculated_profile) return null;

      // Buscar perfil de anamnese baseado no calculated_profile
      const { data: profile, error: profileError } = await supabase
        .from("anamnesis_profiles")
        .select("*")
        .eq("name", anamnesis.calculated_profile)
        .single();

      if (profileError) throw profileError;

      return profile;
    },
    enabled: !!clientId,
  });
};
