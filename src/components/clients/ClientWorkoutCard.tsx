import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Target, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUnassignWorkout } from "@/hooks/useClientWorkouts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClientWorkoutCardProps {
  workout: any;
}

export const ClientWorkoutCard = ({ workout }: ClientWorkoutCardProps) => {
  const unassignWorkout = useUnassignWorkout();

  const progress = workout.total_sessions > 0
    ? (workout.completed_sessions / workout.total_sessions) * 100
    : 0;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo":
        return "default";
      case "Concluído":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{workout.workouts.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{workout.workouts.training_type}</Badge>
              <Badge variant="outline">{workout.workouts.level}</Badge>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover treino?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover este treino do cliente? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => unassignWorkout.mutate({
                  workoutAssignmentId: workout.id,
                  clientId: workout.client_id
                })}>
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {workout.completed_sessions}/{workout.total_sessions} sessões
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(workout.start_date), "dd/MM/yyyy", { locale: ptBR })}
            {workout.end_date && ` - ${format(new Date(workout.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={getStatusVariant(workout.status)}>{workout.status}</Badge>
        </div>

        {workout.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Observações:</strong> {workout.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
