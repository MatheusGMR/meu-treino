import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { Skeleton } from "@/components/ui/skeleton";

export const TodayWorkoutCard = () => {
  const navigate = useNavigate();
  const { data: todayWorkout, isLoading } = useTodayWorkout();

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
