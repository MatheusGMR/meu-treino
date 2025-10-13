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
      // 1. Criar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          birth_date: data.birth_date,
          gender: data.gender,
          notes: data.specializations,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // 3. Adicionar role 'personal'
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "personal",
      });

      if (roleError) throw roleError;

      return authData.user;
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
