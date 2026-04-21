import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProtocolProgress {
  id: string;
  client_id: string;
  sessao_atual: number;
  total_sessoes: number;
  bloco_atual: number;
  frequencia_semanal: number;
  dor_consecutiva: number;
  status: string;
  iniciado_em: string;
  concluido_em: string | null;
  ultima_sessao_completed_at: string | null;
}

export interface MilestoneInfo {
  session_number: number;
  milestone_type: string;
  title: string;
  description: string | null;
  required_video_codes: string[] | null;
  client_message_template: string | null;
}

/**
 * Carrega progresso do Protocolo Destravamento + próximo marco aplicável.
 * Retorna `null` se cliente não está em protocolo.
 */
export const useProtocolProgress = (clientId?: string) => {
  const { user } = useAuth();
  const targetId = clientId ?? user?.id;

  return useQuery({
    queryKey: ["protocol-progress", targetId],
    queryFn: async () => {
      if (!targetId) return null;

      const { data: progress } = await supabase
        .from("client_protocol_progress")
        .select("*")
        .eq("client_id", targetId)
        .maybeSingle();

      if (!progress) return null;

      // próximo marco: o de session_number === sessao_atual+1 OU sessao_atual quando ainda não cumprido
      const nextSession = (progress.sessao_atual ?? 0) + 1;
      const { data: milestone } = await supabase
        .from("protocol_milestones")
        .select("*")
        .eq("session_number", nextSession)
        .maybeSingle();

      return {
        progress: progress as ProtocolProgress,
        nextMilestone: milestone as MilestoneInfo | null,
      };
    },
    enabled: !!targetId,
  });
};
