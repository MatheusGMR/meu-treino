import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TodayWorkoutCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: todayWorkout, isLoading } = useTodayWorkout();

  // Check if current workout is experimental (trial)
  const { data: clientWorkout } = useQuery({
    queryKey: ["client-workout-notes", todayWorkout?.client_workout_id],
    queryFn: async () => {
      if (!todayWorkout?.client_workout_id) return null;
      const { data } = await supabase
        .from("client_workouts")
        .select("notes")
        .eq("id", todayWorkout.client_workout_id)
        .maybeSingle();
      return data;
    },
    enabled: !!todayWorkout?.client_workout_id,
  });

  const isTrialWorkout = clientWorkout?.notes?.includes("Treino experimental");

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!todayWorkout) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum treino agendado para hoje. Entre em contato com seu personal!
        </p>
      </Card>
    );
  }

  const session = todayWorkout.sessions;
  const exerciseCount = session?.session_exercises?.length || 0;
  const isCompleted = todayWorkout.completed;

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Trial workout banner */}
        {isTrialWorkout && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">
                Treino Experimental
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este é um treino de teste baseado na sua anamnese. Seu treino personalizado será criado pelo profissional em até 24 horas.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">Treino do Dia</h2>
          {isCompleted && (
            <CheckCircle2 className="w-8 h-8 text-success" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">{session?.name}</h3>
          <p className="text-lg text-muted-foreground">
            {exerciseCount} exercícios
          </p>
        </div>

        {!isCompleted && (
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate(`/client/workout/session/${todayWorkout.session_id}`)}
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Treino
          </Button>
        )}
        
        {isCompleted && (
          <div className="flex items-center justify-center gap-3 py-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
            <div>
              <p className="text-xl font-bold text-success">
                Treino concluído!
              </p>
              <p className="text-sm text-muted-foreground">
                Parabéns pelo treino de hoje!
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
