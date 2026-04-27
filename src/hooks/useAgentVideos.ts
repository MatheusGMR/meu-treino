import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AgentVideoForm } from "@/lib/schemas/agentVideoSchema";

export type AgentVideoRow = {
  id: string;
  video_code: string;
  title: string;
  description: string | null;
  pilar: string | null;
  momento: string | null;
  youtube_url: string | null;
  duration_seconds: number | null;
  recommended_for_ins_cat: string | null;
  recommended_for_dor_cat: string | null;
  obrigatorio: boolean;
  gatilho: string | null;
  sessoes_alvo: number[] | null;
  bloco_alvo: number | null;
  exercise_id: string | null;
  mandatory_at_session: number | null;
  ordem_sequencia: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const QK = ["agent-videos"] as const;

export function useAgentVideos() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: QK,
    queryFn: async (): Promise<AgentVideoRow[]> => {
      const { data, error } = await supabase
        .from("agent_videos")
        .select("*")
        .order("pilar", { ascending: true })
        .order("recommended_for_ins_cat", { ascending: true, nullsFirst: false })
        .order("video_code", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const create = useMutation({
    mutationFn: async (payload: AgentVideoForm) => {
      const { error } = await supabase.from("agent_videos").insert({
        ...payload,
        youtube_url: payload.youtube_url || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo criado");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar vídeo"),
  });

  const update = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AgentVideoForm }) => {
      const { error } = await supabase
        .from("agent_videos")
        .update({ ...payload, youtube_url: payload.youtube_url || null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo atualizado");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vídeo removido");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  return { list, create, update, remove };
}
