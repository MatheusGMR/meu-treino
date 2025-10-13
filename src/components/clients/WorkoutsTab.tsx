import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AssignWorkoutDialog } from "./AssignWorkoutDialog";
import { ClientWorkoutCard } from "./ClientWorkoutCard";
import { useClientWorkouts } from "@/hooks/useClientWorkouts";
import { Plus, Dumbbell } from "lucide-react";

interface WorkoutsTabProps {
  clientId: string;
}

export const WorkoutsTab = ({ clientId }: WorkoutsTabProps) => {
  const { data: workouts = [], isLoading } = useClientWorkouts(clientId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-muted rounded" />
      ))}
    </div>;
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Dumbbell className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum treino atribuído</h3>
        <p className="text-muted-foreground mb-4">Atribua o primeiro treino para este cliente</p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Atribuir Treino
        </Button>
        <AssignWorkoutDialog
          clientId={clientId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Treinos Atribuídos</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Atribuir Treino
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workouts.map((workout: any) => (
          <ClientWorkoutCard key={workout.id} workout={workout} />
        ))}
      </div>

      <AssignWorkoutDialog
        clientId={clientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
