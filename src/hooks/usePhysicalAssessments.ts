import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { PhysicalAssessment } from "@/lib/schemas/assessmentSchema";

export const useClientAssessments = (clientId: string) => {
  return useQuery({
    queryKey: ["client-assessments", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physical_assessments")
        .select("*")
        .eq("client_id", clientId)
        .order("assessment_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

export const useCreateAssessment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PhysicalAssessment) => {
      if (!user) throw new Error("User not authenticated");

      // Calcular IMC se tiver peso e altura
      let bmi = null;
      if (data.weight && data.height) {
        const heightInMeters = data.height / 100;
        bmi = data.weight / (heightInMeters * heightInMeters);
      }

      const { error } = await supabase.from("physical_assessments").insert({
        ...data,
        assessed_by: user.id,
        bmi,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-assessments", variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ["client-details", variables.client_id] });
      toast({
        title: "Avaliação registrada!",
        description: "A avaliação física foi registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: Partial<PhysicalAssessment>;
    }) => {
      // Recalcular IMC se tiver peso e altura
      let bmi = null;
      if (data.weight && data.height) {
        const heightInMeters = data.height / 100;
        bmi = data.weight / (heightInMeters * heightInMeters);
      }

      const { error } = await supabase
        .from("physical_assessments")
        .update({ ...data, bmi })
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assessments"] });
      toast({
        title: "Avaliação atualizada!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const { error } = await supabase
        .from("physical_assessments")
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assessments"] });
      toast({
        title: "Avaliação removida!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
