import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminClients = () => {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_clients_overview")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });
};

export const useAdminClientsByProfessional = (professionalId?: string) => {
  return useQuery({
    queryKey: ["admin-clients-by-professional", professionalId],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from("admin_clients_overview")
        .select("*")
        .eq("personal_id", professionalId)
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });
};

export const useAdminUnassignedClients = () => {
  return useQuery({
    queryKey: ["admin-unassigned-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_clients_overview")
        .select("*")
        .is("personal_id", null)
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });
};
