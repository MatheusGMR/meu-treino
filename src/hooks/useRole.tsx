import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "personal" | "client";

export const useRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!error && data) {
        const fetchedRoles = data.map((r) => r.role as AppRole);
        setRoles(fetchedRoles);
        
        // Se não encontrou roles e ainda não tentou 3 vezes, tentar novamente
        if (fetchedRoles.length === 0 && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, retryCount]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isPersonal = hasRole("personal");
  const isClient = hasRole("client");

  return { roles, hasRole, isAdmin, isPersonal, isClient, loading };
};
