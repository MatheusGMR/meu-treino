import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePendingUpdates = () => {
  return useQuery({
    queryKey: ["pending-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_updates")
        .select("*")
        .eq("review_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useApproveUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateId: string) => {
      // Buscar a atualização pendente
      const { data: update, error: fetchError } = await supabase
        .from("pending_updates")
        .select("*")
        .eq("id", updateId)
        .single();

      if (fetchError) throw fetchError;

      const entityData = update.entity_data as any;

      // Inserir na tabela apropriada
      let insertError;
      if (update.entity_type === "exercise") {
        const { error } = await supabase.from("exercises").insert({
          ...entityData,
          is_new: true,
          added_at: new Date().toISOString(),
          source_reference: update.source_reference,
          confidence_score: update.confidence_score,
        });
        insertError = error;
      } else if (update.entity_type === "method") {
        const { error } = await supabase.from("methods").insert({
          ...entityData,
          is_new: true,
          added_at: new Date().toISOString(),
          source_reference: update.source_reference,
          confidence_score: update.confidence_score,
        });
        insertError = error;
      } else if (update.entity_type === "volume") {
        const { error } = await supabase.from("volumes").insert({
          ...entityData,
          is_new: true,
          added_at: new Date().toISOString(),
          source_reference: update.source_reference,
          confidence_score: update.confidence_score,
        });
        insertError = error;
      }

      if (insertError) throw insertError;

      // Atualizar status da atualização pendente
      const { error: updateError } = await supabase
        .from("pending_updates")
        .update({
          review_status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", updateId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Atualização aprovada e publicada!");
      queryClient.invalidateQueries({ queryKey: ["pending-updates"] });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["methods"] });
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      toast.error("Erro ao aprovar atualização: " + error.message);
    },
  });
};

export const useRejectUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from("pending_updates")
        .update({
          review_status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualização rejeitada");
      queryClient.invalidateQueries({ queryKey: ["pending-updates"] });
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar atualização: " + error.message);
    },
  });
};

export const useTriggerResearch = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("research-updates");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Pesquisa iniciada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao iniciar pesquisa: " + error.message);
    },
  });
};
