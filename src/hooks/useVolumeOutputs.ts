import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type VolumeOutput = {
  output_id: string;
  tempo_cat: "T1" | "T2" | "T3";
  dor_cat: "D0" | "D1" | "D2" | "D3";
  disposicao: "OK" | "Moderada" | "Comprometida" | null;
  modo_d3: boolean;
  n_ex_min: number;
  n_ex_max: number;
  series_min: number;
  series_max: number;
  reps: number;
  mob_rule: any;
  fort_rule: any;
  resist_rule: any;
  along_rule: any;
  notes: string | null;
  active: boolean;
};

export const useVolumeOutputs = () => {
  return useQuery({
    queryKey: ["volume-outputs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volume_outputs")
        .select("*")
        .order("output_id");
      if (error) throw error;
      return (data ?? []) as VolumeOutput[];
    },
  });
};

export const useUpdateVolumeOutput = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<VolumeOutput> & { output_id: string }) => {
      const { output_id, ...patch } = input;
      const { data, error } = await supabase
        .from("volume_outputs")
        .update(patch)
        .eq("output_id", output_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["volume-outputs"] });
      toast.success("Regra de volume atualizada");
    },
    onError: (err: any) => toast.error(err.message ?? "Erro ao salvar regra"),
  });
};
