import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAnamnesisStatus = () => {
  const { user } = useAuth();
  const [anamnesisCompleted, setAnamnesisCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("anamnesis_completed")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setAnamnesisCompleted(data.anamnesis_completed);
      }
      setLoading(false);
    };

    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('anamnesis-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newCompleted = (payload.new as any).anamnesis_completed;
          setAnamnesisCompleted(newCompleted);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { anamnesisCompleted, loading };
};
