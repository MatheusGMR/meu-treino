import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClientActiveWorkouts, useNextScheduledSession } from "@/hooks/useClientAvailableWorkouts";
import { Skeleton } from "@/components/ui/skeleton";

const WorkoutCard = ({ workout }: { workout: any }) => {
  const navigate = useNavigate();
  const { data: nextSession } = useNextScheduledSession(workout.id);
  
  const workoutData = workout.workouts;
  const totalExercises = workoutData?.workout_sessions?.reduce(
    (sum: number, ws: any) => sum + (ws.sessions?.session_exercises?.length || 0),
    0
  ) || 0;

  const getScheduleBadge = () => {
    if (!nextSession) {
      return <Badge variant="secondary">Sem agendamento</Badge>;
    }

    const scheduledDate = new Date(nextSession.scheduled_for);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    if (scheduledDate.toDateString() === today.toDateString()) {
      return <Badge className="bg-primary text-primary-foreground">📅 Hoje</Badge>;
    } else if (scheduledDate.toDateString() === tomorrow.toDateString()) {
      return <Badge className="bg-accent text-accent-foreground">📅 Amanhã</Badge>;
    } else if (scheduledDate <= nextWeek) {
      return <Badge variant="outline">📅 Esta semana</Badge>;
    } else {
      return <Badge variant="secondary">📅 Próxima</Badge>;
    }
  };

  const handleStart = () => {
    if (nextSession?.session_id) {
      navigate(`/client/workout/session/${nextSession.session_id}`);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {workoutData?.name}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {workoutData?.training_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {workoutData?.level}
              </Badge>
            </div>
          </div>
          {getScheduleBadge()}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-4 h-4" />
            <span>{totalExercises} exercícios</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{workoutData?.workout_sessions?.length || 0} sessões</span>
          </div>
        </div>

        {nextSession && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-3">
              Próxima: <span className="font-medium text-foreground">{nextSession.sessions?.description}</span>
            </p>
            <Button 
              onClick={handleStart}
              className="w-full group-hover:scale-105 transition-transform"
              size="sm"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Iniciar Treino
            </Button>
          </div>
        )}

        {!nextSession && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            Nenhuma sessão agendada
          </div>
        )}
      </div>
    </Card>
  );
};

export const WorkoutSelector = () => {
  const { data: workouts, isLoading } = useClientActiveWorkouts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">💪 Seus Treinos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhum treino ativo</h3>
        <p className="text-muted-foreground">
          Seu personal ainda não atribuiu treinos. Entre em contato!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">💪 Seus Treinos Disponíveis</h2>
        <Badge variant="secondary" className="text-sm">
          {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>
    </div>
  );
};