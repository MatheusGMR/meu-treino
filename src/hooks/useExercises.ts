import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { ExerciseFormData } from "@/lib/schemas/exerciseSchema";
import { uploadExerciseMedia, deleteExerciseMedia } from "@/lib/supabase/storage";

interface ExerciseFilters {
  groups?: string[];
  search?: string;
  type?: string;
}

export const useExercises = (filters?: ExerciseFilters) => {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      let query = supabase
        .from("exercises")
        .select("*")
        .order("level", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (filters?.type) {
        query = query.eq("exercise_type", filters.type as any);
      }

      if (filters?.groups && filters.groups.length > 0) {
        query = query.in("exercise_group", filters.groups as any);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`name.ilike.${searchTerm},exercise_group.ilike.${searchTerm},primary_muscle.ilike.${searchTerm},level.ilike.${searchTerm},exercise_type.ilike.${searchTerm}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
};

export const useCreateExercise = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: ExerciseFormData;
    }) => {
      const { data: exercise, error } = await supabase
        .from("exercises")
        .insert({
          name: data.name,
          exercise_type: data.exercise_type as any,
          exercise_group: data.exercise_group as any,
          video_url: data.video_url,
          contraindication: data.contraindication,
          level: data.level,
          equipment: data.equipment,
          primary_muscle: data.primary_muscle,
          secondary_muscle: data.secondary_muscle,
          impact_level: data.impact_level,
          biomechanical_class: data.biomechanical_class,
          dominant_movement: data.dominant_movement,
          thumbnail_url: data.thumbnail_url,
          created_by: user?.id,
        } as any)
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
    }: {
      id: string;
      data: ExerciseFormData;
    }) => {
      const { data: exercise, error } = await supabase
        .from("exercises")
        .update({
          name: data.name,
          exercise_type: data.exercise_type as any,
          exercise_group: data.exercise_group as any,
          video_url: data.video_url,
          contraindication: data.contraindication,
          level: data.level,
          equipment: data.equipment,
          primary_muscle: data.primary_muscle,
          secondary_muscle: data.secondary_muscle,
          impact_level: data.impact_level,
          biomechanical_class: data.biomechanical_class,
          dominant_movement: data.dominant_movement,
          thumbnail_url: data.thumbnail_url,
        } as any)
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
    mutationFn: async (id: string) => {
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
