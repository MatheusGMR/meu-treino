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
    <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-50" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800')" 
        }}
      />
      
      <div className="relative p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">🔥 Treino do Dia</h2>
          {isCompleted && (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{session?.description}</h3>
          <p className="text-muted-foreground">
            {session?.session_type} • {exerciseCount} exercícios
          </p>
        </div>

        {!isCompleted && (
          <Button 
            size="lg" 
            className="w-full group-hover:scale-105 transition-transform"
            onClick={() => navigate(`/client/workout/session/${todayWorkout.session_id}`)}
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Treino
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-green-500">
              ✓ Treino concluído!
            </p>
            <p className="text-sm text-muted-foreground">
              Parabéns pelo treino de hoje!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
