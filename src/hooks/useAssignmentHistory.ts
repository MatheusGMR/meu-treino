import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAssignmentHistory = (clientId?: string) => {
  return useQuery({
    queryKey: ["assignment-history", clientId],
    queryFn: async () => {
      let query = supabase
        .from("assignment_history")
        .select("*")
        .order("changed_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar informações dos perfis separadamente
      const enrichedData = await Promise.all(
        (data || []).map(async (item) => {
          const [oldPersonal, newPersonal, client, changedBy] = await Promise.all([
            item.old_personal_id
              ? supabase.from("profiles").select("full_name").eq("id", item.old_personal_id).single()
              : Promise.resolve({ data: null }),
            item.new_personal_id
              ? supabase.from("profiles").select("full_name").eq("id", item.new_personal_id).single()
              : Promise.resolve({ data: null }),
            supabase.from("profiles").select("full_name").eq("id", item.client_id).single(),
            supabase.from("profiles").select("full_name").eq("id", item.changed_by).single(),
          ]);

          return {
            ...item,
            old_personal: oldPersonal.data,
            new_personal: newPersonal.data,
            client: client.data,
            changed_by_user: changedBy.data,
          };
        })
      );

      return enrichedData;
    },
    enabled: !clientId || !!clientId,
  });
};
