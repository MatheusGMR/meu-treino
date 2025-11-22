import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AddProfessional } from "@/lib/schemas/professionalSchema";

export const useAdminProfessionals = () => {
  return useQuery({
    queryKey: ["admin-professionals"],
    queryFn: async () => {
      // Buscar usuários com role 'personal'
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "personal");

      if (rolesError) throw rolesError;

      const personalIds = userRoles.map((r) => r.user_id);

      if (personalIds.length === 0) return [];

      // Buscar perfis dos profissionais
      const { data: professionals, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", personalIds)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Buscar contagem de clientes por profissional
      const professionalsWithClients = await Promise.all(
        professionals.map(async (prof) => {
          const { count } = await supabase
            .from("client_assignments")
            .select("*", { count: "exact", head: true })
            .eq("personal_id", prof.id)
            .eq("status", "Ativo");

          return {
            ...prof,
            active_clients_count: count || 0,
          };
        })
      );

      return professionalsWithClients;
    },
  });
};

export const useAddProfessional = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddProfessional) => {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      // Chamar edge function
      const { data: result, error } = await supabase.functions.invoke(
        'create-professional',
        {
          body: data,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Erro ao criar profissional");

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Profissional adicionado",
        description: "O profissional foi cadastrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar profissional",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
