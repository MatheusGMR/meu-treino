import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const RecentHistoryTimeline = () => {
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ["recent-history", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("daily_workout_schedule")
        .select(`
          *,
          sessions (description, session_type)
        `)
        .eq("client_id", user.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Nenhum treino concluído ainda</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Histórico Recente</h3>
      <div className="space-y-3">
        {history.map((item: any) => (
          <div key={item.id} className="flex items-start gap-3 border-l-2 border-primary pl-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{item.sessions?.description}</p>
              <p className="text-sm text-muted-foreground">
                {item.completed_at && format(new Date(item.completed_at), "PPP", { locale: ptBR })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
