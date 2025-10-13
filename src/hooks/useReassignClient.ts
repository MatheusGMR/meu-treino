import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ReassignClient } from "@/lib/schemas/reassignmentSchema";

export const useReassignClient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReassignClient & { change_reason: string }) => {
      // Atualizar client_assignment
      const { error: updateError } = await supabase
        .from("client_assignments")
        .update({ 
          personal_id: data.new_personal_id 
        })
        .eq("client_id", data.client_id);

      if (updateError) throw updateError;

      // Registrar motivo da mudança no histórico
      const { error: historyError } = await supabase
        .from("assignment_history")
        .update({ change_reason: data.change_reason })
        .eq("client_id", data.client_id)
        .order("changed_at", { ascending: false })
        .limit(1);

      if (historyError) console.warn("Erro ao atualizar motivo:", historyError);

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Cliente reatribuído",
        description: "O cliente foi atribuído ao novo profissional com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reatribuir cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
