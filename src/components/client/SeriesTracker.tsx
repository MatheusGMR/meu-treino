import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { useCompleteSet } from "@/hooks/useSessionCompletion";

interface SeriesTrackerProps {
  sets: number;
  reps: string;
  clientWorkoutId: string;
  sessionId: string;
  exerciseId: string;
}

export const SeriesTracker = ({ 
  sets, 
  reps, 
  clientWorkoutId,
  sessionId,
  exerciseId 
}: SeriesTrackerProps) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<number[]>([]);
  const [repsCompleted, setRepsCompleted] = useState(reps);
  const [weight, setWeight] = useState(0);
  
  const completeSetMutation = useCompleteSet();

  const handleCompleteSet = () => {
    completeSetMutation.mutate({
      clientWorkoutId,
      sessionId,
      exerciseId,
      setNumber: currentSet,
      reps: repsCompleted,
      weight,
    });

    setCompletedSets([...completedSets, currentSet]);
    
    if (currentSet < sets) {
      setCurrentSet(currentSet + 1);
    }
  };

  const isSetCompleted = (setNum: number) => completedSets.includes(setNum);
  const allSetsCompleted = completedSets.length === sets;

  return (
    <div className="space-y-4">
      <Card className="p-6 border-border">
        <h3 className="font-semibold mb-4 text-foreground">
          Série {currentSet} de {sets}
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label>Sets</Label>
            <Input value={sets} disabled />
          </div>
          <div>
            <Label>Reps</Label>
            <Input 
              value={repsCompleted}
              onChange={(e) => setRepsCompleted(e.target.value)}
              placeholder={reps}
            />
          </div>
          <div>
            <Label>Carga (kg)</Label>
            <Input 
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[...Array(sets)].map((_, i) => {
            const setNum = i + 1;
            return (
              <div key={setNum} className="flex items-center gap-1">
                {isSetCompleted(setNum) ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
                <span className="text-sm">{setNum}</span>
              </div>
            );
          })}
        </div>

        {!allSetsCompleted && (
          <Button 
            onClick={handleCompleteSet}
            disabled={completeSetMutation.isPending}
            className="w-full"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Concluir Série {currentSet}
          </Button>
        )}

        {allSetsCompleted && (
          <div className="text-center py-2 text-green-500 font-semibold">
            ✓ Todas as séries concluídas!
          </div>
        )}
      </Card>
    </div>
  );
};
