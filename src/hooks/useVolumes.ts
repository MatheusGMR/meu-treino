import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VolumeFormData } from "@/lib/schemas/volumeSchema";

export const useVolumes = (search?: string) => {
  return useQuery({
    queryKey: ["volumes", search],
    queryFn: async () => {
      let query = supabase
        .from("volumes")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateVolume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VolumeFormData) => {
      const { data: session } = await supabase.auth.getSession();
      
      const { data: volume, error } = await supabase
        .from("volumes")
        .insert({
          ...data,
          created_by: session.session?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return volume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      toast.success("Volume criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar volume: " + error.message);
    },
  });
};

export const useUpdateVolume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VolumeFormData }) => {
      const { data: volume, error } = await supabase
        .from("volumes")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return volume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      toast.success("Volume atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar volume: " + error.message);
    },
  });
};

export const useDeleteVolume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("volumes").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      toast.success("Volume excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir volume: " + error.message);
    },
  });
};
