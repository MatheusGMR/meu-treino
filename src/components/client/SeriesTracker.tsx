import { useState } from "react";
import { Input } from "@/components/ui/input";
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
  exerciseId,
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
    if (currentSet < sets) setCurrentSet(currentSet + 1);
  };

  const isSetCompleted = (setNum: number) => completedSets.includes(setNum);
  const allSetsCompleted = completedSets.length === sets;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-bold mb-4 text-foreground text-sm">
        Série {currentSet} de {sets}
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sets</label>
          <Input value={sets} disabled className="mt-1 bg-muted border-border text-foreground" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Reps</label>
          <Input
            value={repsCompleted}
            onChange={(e) => setRepsCompleted(e.target.value)}
            placeholder={reps}
            className="mt-1 bg-muted border-border text-foreground focus:border-primary focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Carga (kg)</label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            placeholder="0"
            className="mt-1 bg-muted border-border text-foreground focus:border-primary focus:ring-primary"
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
                <Circle className={`w-6 h-6 ${setNum === currentSet ? 'text-primary' : 'text-muted-foreground'}`} />
              )}
              <span className="text-sm font-medium text-foreground">{setNum}</span>
            </div>
          );
        })}
      </div>

      {!allSetsCompleted ? (
        <button
          onClick={handleCompleteSet}
          disabled={completeSetMutation.isPending}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          Concluir Série {currentSet}
        </button>
      ) : (
        <div className="text-center py-3 text-green-500 font-bold bg-green-900/20 rounded-lg border border-green-500/30">
          ✓ Todas as séries concluídas!
        </div>
      )}
    </div>
  );
};
