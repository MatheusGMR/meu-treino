import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useClientAnamnesis = (clientId: string) => {
  return useQuery({
    queryKey: ["client-anamnesis", clientId],
    queryFn: async () => {
      const { data: anamnesisData, error: anamnesisError } = await supabase
        .from("anamnesis")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      if (anamnesisError) throw anamnesisError;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, anamnesis_profile, anamnesis_completed, anamnesis_last_update")
        .eq("id", clientId)
        .single();

      if (profileError) throw profileError;

      let profileDetails = null;
      if (anamnesisData?.calculated_profile) {
        const { data: profileDetailsData, error: profileDetailsError } = await supabase
          .from("anamnesis_profiles")
          .select(`
            *,
            recommendations:anamnesis_recommendations(*)
          `)
          .eq("name", anamnesisData.calculated_profile)
          .maybeSingle();

        if (profileDetailsError) throw profileDetailsError;
        profileDetails = profileDetailsData;
      }

      return {
        anamnesis: anamnesisData,
        profile: profileData,
        profileDetails,
      };
    },
    enabled: !!clientId,
  });
};

export const useRequestAnamnesis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          anamnesis_completed: false,
          anamnesis_last_update: null,
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ["client-anamnesis", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-details", clientId] });
      toast({
        title: "Solicitação enviada",
        description: "O cliente receberá uma notificação para preencher a anamnese.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
