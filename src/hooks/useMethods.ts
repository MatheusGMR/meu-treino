import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MethodFormData } from "@/lib/schemas/methodSchema";

export const useMethods = (search?: string) => {
  return useQuery({
    queryKey: ["methods", search],
    queryFn: async () => {
      let query = supabase
        .from("methods")
        .select("*")
        .order("objective", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,load_level.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Ordenar no frontend por risk_level e energy_cost (básico → avançado)
      const sortedData = data?.sort((a, b) => {
        const riskOrder: Record<string, number> = {
          'Baixo risco': 1,
          'Médio risco': 2,
          'Alto risco': 3,
          'Alto risco de fadiga': 4,
        };
        
        const energyOrder: Record<string, number> = {
          'Baixo': 1,
          'Médio': 2,
          'Alto': 3,
        };
        
        const riskA = riskOrder[a.risk_level] || 999;
        const riskB = riskOrder[b.risk_level] || 999;
        
        if (riskA !== riskB) return riskA - riskB;
        
        const energyA = energyOrder[a.energy_cost] || 999;
        const energyB = energyOrder[b.energy_cost] || 999;
        
        if (energyA !== energyB) return energyA - energyB;
        
        // Desempate por objective e name
        return (a.objective || '').localeCompare(b.objective || '') || 
               (a.name || '').localeCompare(b.name || '');
      });
      
      return sortedData;
    },
  });
};

export const useCreateMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MethodFormData) => {
      const { data: method, error } = await supabase
        .from("methods")
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      return method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["methods"] });
      toast.success("Método criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar método: " + error.message);
    },
  });
};

export const useUpdateMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MethodFormData }) => {
      const { data: method, error } = await supabase
        .from("methods")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return method;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["methods"] });
      toast.success("Método atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar método: " + error.message);
    },
  });
};

export const useDeleteMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("methods").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["methods"] });
      toast.success("Método excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir método: " + error.message);
    },
  });
};
