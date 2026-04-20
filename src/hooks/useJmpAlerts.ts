import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AlertType =
  | "frequencia_zero"
  | "frequencia_baixa"
  | "dor_persistente"
  | "sessao_sem_feedback"
  | "revisao_nivel_I3"
  | "alerta_medico"
  | "condicao_cardiaca"
  | "inconsistencia_checkin"
  | "divergencia_conduta";

export type AlertSeverity = "baixa" | "media" | "alta" | "critica";
export type AlertStatus = "aberto" | "em_revisao" | "resolvido";

export interface AgentAlert {
  id: string;
  client_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  payload: any;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  client_name?: string;
}

interface Filters {
  status?: AlertStatus | "todos";
  severity?: AlertSeverity | "todas";
  alert_type?: AlertType | "todos";
}

export const useJmpAlerts = (filters: Filters = {}) => {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["jmp-alerts", filters],
    queryFn: async () => {
      let query = supabase
        .from("agent_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.status && filters.status !== "todos") query = query.eq("status", filters.status);
      if (filters.severity && filters.severity !== "todas") query = query.eq("severity", filters.severity);
      if (filters.alert_type && filters.alert_type !== "todos") query = query.eq("alert_type", filters.alert_type);

      const { data, error } = await query;
      if (error) throw error;

      // Buscar nomes dos clientes
      const clientIds = [...new Set((data || []).map((a) => a.client_id))];
      if (clientIds.length === 0) return data as AgentAlert[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", clientIds);

      const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
      return (data || []).map((a) => ({
        ...a,
        client_name: nameMap.get(a.client_id) || "Cliente",
      })) as AgentAlert[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("jmp-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_alerts" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["jmp-alerts"] });
          if (payload.eventType === "INSERT") {
            const newAlert = payload.new as any;
            toast.warning(`Novo alerta: ${newAlert.title}`, {
              description: newAlert.description,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agent_alerts")
        .update({
          status: "resolvido",
          resolution_note: note,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta resolvido");
      queryClient.invalidateQueries({ queryKey: ["jmp-alerts"] });
    },
    onError: (e: any) => toast.error("Erro ao resolver: " + e.message),
  });

  const setReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_alerts")
        .update({ status: "em_revisao" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jmp-alerts"] }),
  });

  return { alerts, isLoading, resolveAlert: resolveMutation.mutate, setInReview: setReviewMutation.mutate };
};
