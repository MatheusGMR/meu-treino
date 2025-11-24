import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export const useAssignClientToSelf = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já existe assignment
      const { data: existing } = await supabase
        .from("client_assignments")
        .select("id, personal_id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) {
        // Atualizar assignment existente
        const { error } = await supabase
          .from("client_assignments")
          .update({ 
            personal_id: user.id,
            status: 'Ativo',
            start_date: new Date().toISOString().split('T')[0]
          })
          .eq("client_id", clientId);

        if (error) throw error;
      } else {
        // Criar novo assignment
        const { error } = await supabase
          .from("client_assignments")
          .insert({
            client_id: clientId,
            personal_id: user.id,
            status: 'Ativo',
            start_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
      }

      return { clientId };
    },
    onSuccess: () => {
      toast({
        title: "Cliente assumido",
        description: "Você agora é o responsável por este cliente.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao assumir cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
