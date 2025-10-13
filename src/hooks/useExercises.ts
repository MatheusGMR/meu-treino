import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { ExerciseFormData } from "@/lib/schemas/exerciseSchema";
import { uploadExerciseMedia, deleteExerciseMedia } from "@/lib/supabase/storage";

export const useExercises = (filters?: {
  groups?: string[];
  intensities?: string[];
  search?: string;
}) => {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      let query = supabase
        .from("exercises")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.groups && filters.groups.length > 0) {
        query = query.in("exercise_group", filters.groups as any);
      }

      if (filters?.intensities && filters.intensities.length > 0) {
        query = query.in("intensity", filters.intensities as any);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateExercise = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      data,
      file,
    }: {
      data: ExerciseFormData;
      file?: File;
    }) => {
      let media_url = data.media_url;

      if (file && user) {
        media_url = await uploadExerciseMedia(file, user.id);
      }

      const { data: exercise, error } = await supabase
        .from("exercises")
        .insert({
          name: data.name,
          exercise_group: data.exercise_group,
          intensity: data.intensity,
          print_name: data.print_name,
          equipment: data.equipment,
          description: data.description,
          media_type: data.media_type,
          media_url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast({
        title: "Sucesso!",
        description: "Exercício criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar exercício: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      file,
      oldMediaUrl,
    }: {
      id: string;
      data: ExerciseFormData;
      file?: File;
      oldMediaUrl?: string;
    }) => {
      let media_url = data.media_url;

      if (file && user) {
        // Delete old media if exists
        if (oldMediaUrl) {
          await deleteExerciseMedia(oldMediaUrl).catch(console.error);
        }
        media_url = await uploadExerciseMedia(file, user.id);
      }

      const { data: exercise, error } = await supabase
        .from("exercises")
        .update({ ...data, media_url })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast({
        title: "Sucesso!",
        description: "Exercício atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar exercício: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mediaUrl }: { id: string; mediaUrl?: string }) => {
      // Delete media first if exists
      if (mediaUrl) {
        await deleteExerciseMedia(mediaUrl).catch(console.error);
      }

      const { error } = await supabase.from("exercises").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast({
        title: "Sucesso!",
        description: "Exercício deletado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao deletar exercício: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
