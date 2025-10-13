import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ClientHistory = () => {
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ["workout-history", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("daily_workout_schedule")
        .select(`
          *,
          sessions (
            description,
            session_type
          )
        `)
        .eq("client_id", user.id)
        .order("scheduled_for", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Histórico de Treinos</h1>

      <div className="space-y-4">
        {history?.map((item: any) => (
          <Card 
            key={item.id} 
            className={`p-6 ${item.completed ? 'border-green-500/50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                {item.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Calendar className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {item.sessions?.description}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.sessions?.session_type}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(item.scheduled_for), "PPP", { locale: ptBR })}
                  </p>
                  {item.completed && item.completed_at && (
                    <p className="text-sm text-green-600 mt-1">
                      Concluído em {format(new Date(item.completed_at), "PPp", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
              {item.completed ? (
                <span className="text-sm font-semibold text-green-500">Concluído</span>
              ) : (
                <span className="text-sm text-muted-foreground">Agendado</span>
              )}
            </div>
          </Card>
        ))}

        {(!history || history.length === 0) && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum treino encontrado</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientHistory;
