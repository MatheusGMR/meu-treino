import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Listens for realtime updates when a client completes their anamnesis.
 * Shows a toast notification to the personal trainer.
 */
export const useAnamnesisCompletionNotifier = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('anamnesis-completion-notifier')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Only trigger when anamnesis_completed changes from false/null to true
          if (newData.anamnesis_completed === true && !oldData.anamnesis_completed) {
            // Check if this client belongs to the current personal
            const { data: assignment } = await supabase
              .from('client_assignments')
              .select('client_id')
              .eq('personal_id', user.id)
              .eq('client_id', newData.id)
              .eq('status', 'Ativo')
              .maybeSingle();

            if (assignment) {
              // Invalidate queries to refresh client data
              queryClient.invalidateQueries({ queryKey: ["clients"] });
              queryClient.invalidateQueries({ queryKey: ["client-details", newData.id] });

              toast({
                title: "📋 Anamnese concluída!",
                description: `${newData.full_name} completou a anamnese e está pronto para avaliação e atribuição de treino.`,
                duration: 10000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
