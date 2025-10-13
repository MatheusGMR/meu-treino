import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import type { AddClient } from "@/lib/schemas/clientSchema";

export type ClientStatus = "Ativo" | "Inativo" | "Suspenso";

export interface Client {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  medical_conditions: string | null;
  goals: string | null;
  notes: string | null;
  assignment: {
    status: ClientStatus;
    start_date: string;
    end_date: string | null;
    notes: string | null;
  } | null;
}

export const useClients = (filters?: { status?: ClientStatus; search?: string }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let query = supabase
        .from("client_assignments")
        .select(`
          client_id,
          status,
          start_date,
          end_date,
          notes,
          profiles!client_assignments_client_id_fkey (
            id,
            full_name,
            avatar_url,
            birth_date,
            gender,
            phone,
            emergency_contact,
            emergency_phone,
            medical_conditions,
            goals,
            notes
          )
        `)
        .eq("personal_id", user.id);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      let clients: Client[] = (data || []).map((assignment: any) => ({
        id: assignment.profiles.id,
        full_name: assignment.profiles.full_name,
        avatar_url: assignment.profiles.avatar_url,
        birth_date: assignment.profiles.birth_date,
        gender: assignment.profiles.gender,
        phone: assignment.profiles.phone,
        emergency_contact: assignment.profiles.emergency_contact,
        emergency_phone: assignment.profiles.emergency_phone,
        medical_conditions: assignment.profiles.medical_conditions,
        goals: assignment.profiles.goals,
        notes: assignment.profiles.notes,
        assignment: {
          status: assignment.status,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          notes: assignment.notes,
        },
      }));

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        clients = clients.filter((client) =>
          client.full_name.toLowerCase().includes(searchLower)
        );
      }

      return clients;
    },
    enabled: !!user,
  });
};

export const useClientDetails = (clientId: string) => {
  return useQuery({
    queryKey: ["client-details", clientId],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientId)
        .single();

      if (profileError) throw profileError;

      const { data: assignment, error: assignmentError } = await supabase
        .from("client_assignments")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (assignmentError && assignmentError.code !== "PGRST116") {
        throw assignmentError;
      }

      const { data: latestAssessment } = await supabase
        .from("physical_assessments")
        .select("*")
        .eq("client_id", clientId)
        .order("assessment_date", { ascending: false })
        .limit(1)
        .single();

      const { data: activeWorkouts } = await supabase
        .from("client_workouts")
        .select(`
          *,
          workouts (
            id,
            name,
            training_type,
            level
          )
        `)
        .eq("client_id", clientId)
        .eq("status", "Ativo");

      return {
        profile,
        assignment,
        latestAssessment,
        activeWorkouts: activeWorkouts || [],
      };
    },
    enabled: !!clientId,
  });
};

export const useAddClient = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddClient) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: "client",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const clientId = authData.user.id;

      // 2. Atualizar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          phone: data.phone || null,
          emergency_contact: data.emergency_contact || null,
          emergency_phone: data.emergency_phone || null,
          medical_conditions: data.medical_conditions || null,
          goals: data.goals || null,
        })
        .eq("id", clientId);

      if (profileError) throw profileError;

      // 3. Criar assignment
      const { error: assignmentError } = await supabase
        .from("client_assignments")
        .insert({
          personal_id: user.id,
          client_id: clientId,
          status: "Ativo",
          start_date: data.start_date,
        });

      if (assignmentError) throw assignmentError;

      // 4. Atribuir role de client
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: clientId,
        role: "client",
      });

      if (roleError) throw roleError;

      return { clientId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente adicionado com sucesso!",
        description: "O novo cliente foi criado e pode fazer login no sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: Partial<Client> }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-details", variables.clientId] });
      toast({
        title: "Perfil atualizado!",
        description: "As informações do cliente foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      data,
    }: {
      clientId: string;
      data: { status?: ClientStatus; end_date?: string; notes?: string };
    }) => {
      const { error } = await supabase
        .from("client_assignments")
        .update(data)
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-details", variables.clientId] });
      toast({
        title: "Status atualizado!",
        description: "O status do cliente foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
