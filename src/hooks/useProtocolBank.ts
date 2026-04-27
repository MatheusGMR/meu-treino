import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProtocolExercise = {
  id: string;
  name: string;
  exercise_id: string | null;
  external_id: string | null;
  block: "MOB" | "FORT" | "MS" | "MI" | "CARD" | "ALONG" | null;
  equipment_code: "PC" | "ELAS" | "MAC" | "DIV" | "CONV" | "CAB" | "BAR" | "HAL" | null;
  difficulty_code: string | null;
  movement_vector: string | null;
  kind: "PAI" | "SUB" | null;
  parent_exercise_id: string | null;
  pain_region: "L0" | "L1" | "L2" | "L3" | "L_MULTI" | null;
  treino_letra: "A" | "B" | null;
  bloco_protocolo: number | null;
  is_primary: boolean;
  is_fixed_base: boolean;
  safety_level: "S1" | "S2" | "S3" | "S4" | "S5" | null;
  video_url: string | null;
  protocol_only: boolean;
  primary_muscle: string | null;
  exercise_group: string;
  exercise_type: string;
  created_at: string | null;
};

const SELECT_COLS =
  "id,name,exercise_id,external_id,block,equipment_code,difficulty_code,movement_vector,kind,parent_exercise_id,pain_region,treino_letra,bloco_protocolo,is_primary,is_fixed_base,safety_level,video_url,protocol_only,primary_muscle,exercise_group,exercise_type,created_at";

export const useProtocolBank = (filters?: {
  bloco?: number;
  treino?: "A" | "B";
  block?: string;
  kind?: "PAI" | "SUB";
  search?: string;
}) => {
  return useQuery({
    queryKey: ["protocol-bank", filters],
    queryFn: async () => {
      let q = supabase
        .from("exercises")
        .select(SELECT_COLS)
        .eq("protocol_only", true)
        .order("bloco_protocolo", { ascending: true, nullsFirst: false })
        .order("treino_letra", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (filters?.bloco) q = q.eq("bloco_protocolo", filters.bloco);
      if (filters?.treino) q = q.eq("treino_letra", filters.treino);
      if (filters?.block) q = q.eq("block", filters.block as any);
      if (filters?.kind) q = q.eq("kind", filters.kind);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProtocolExercise[];
    },
  });
};

export const useUpsertProtocolExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ProtocolExercise> & { id?: string; name: string }) => {
      const payload: any = {
        ...input,
        protocol_only: input.protocol_only ?? true,
        exercise_group: input.exercise_group ?? "Outro",
        exercise_type: input.exercise_type ?? "Musculação",
      };
      if (payload.id) {
        const { data, error } = await supabase
          .from("exercises")
          .update(payload)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from("exercises").insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-bank"] });
      qc.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercício salvo");
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao salvar exercício"),
  });
};

export const useDeleteProtocolExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-bank"] });
      toast.success("Exercício removido");
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao remover"),
  });
};
