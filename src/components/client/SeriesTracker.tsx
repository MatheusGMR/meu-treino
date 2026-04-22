import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle } from "lucide-react";
import { useLastWeightForExercise } from "@/hooks/useSessionCompletion";
import { useAuth } from "@/hooks/useAuth";

interface SeriesTrackerProps {
  sets: number;
  reps: string;
  exerciseId: string;
  currentSet: number;
  completedSets: number[];
  showWeight?: boolean;
  weight: number;
  onWeightChange: (weight: number) => void;
  repsCompleted: string;
  onRepsChange: (reps: string) => void;
}

export const SeriesTracker = ({
  sets,
  reps,
  exerciseId,
  currentSet,
  completedSets,
  showWeight = true,
  weight,
  onWeightChange,
  repsCompleted,
  onRepsChange,
}: SeriesTrackerProps) => {
  const { user } = useAuth();
  const { data: lastWeight } = useLastWeightForExercise(user?.id, exerciseId);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Pré-preencher peso sugerido (apenas uma vez por exercício)
  useEffect(() => {
    if (!hasPrefilled && lastWeight && lastWeight > 0 && weight === 0) {
      onWeightChange(lastWeight);
      setHasPrefilled(true);
    }
  }, [lastWeight, hasPrefilled, weight, onWeightChange]);

  // Reset prefill quando muda exercício
  useEffect(() => {
    setHasPrefilled(false);
  }, [exerciseId]);

  const isSetCompleted = (setNum: number) => completedSets.includes(setNum);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm">
          Série {currentSet} de {sets}
        </h3>
        <div className="flex gap-1.5">
          {[...Array(sets)].map((_, i) => {
            const setNum = i + 1;
            return isSetCompleted(setNum) ? (
              <CheckCircle2 key={setNum} className="w-5 h-5 text-primary" />
            ) : (
              <Circle
                key={setNum}
                className={`w-5 h-5 ${
                  setNum === currentSet ? "text-primary" : "text-muted-foreground"
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className={`grid ${showWeight ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            Reps
          </label>
          <Input
            value={repsCompleted}
            onChange={(e) => onRepsChange(e.target.value)}
            placeholder={reps}
            className="mt-1 bg-muted border-border text-foreground focus:border-primary focus:ring-primary"
          />
        </div>
        {showWeight && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Carga (kg){lastWeight ? ` · sugerido ${lastWeight}` : ""}
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={weight || ""}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              placeholder="0"
              className="mt-1 bg-muted border-border text-foreground focus:border-primary focus:ring-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
};
