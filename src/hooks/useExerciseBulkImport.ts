import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImportStats {
  total: number;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails: Array<{ line: number; error: string; data?: any }>;
  processingTime: number;
}

interface ImportResponse {
  success: boolean;
  stats?: ImportStats;
  message?: string;
  error?: string;
}

export const useExerciseBulkImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<ImportResponse> => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-exercises-csv', {
        body: formData,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success && data.stats) {
        const { stats } = data;
        toast.success(
          `Importação concluída! ${stats.inserted} inseridos, ${stats.updated} atualizados, ${stats.errors} erros`,
          { duration: 5000 }
        );
        queryClient.invalidateQueries({ queryKey: ["exercises"] });
      } else {
        toast.error(data.error || "Erro ao importar exercícios");
      }
    },
    onError: (error: any) => {
      toast.error(`Erro na importação: ${error.message || "Erro desconhecido"}`);
    },
  });
};
