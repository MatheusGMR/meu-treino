import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import { Badge } from "@/components/ui/badge";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface InlineExerciseRowProps {
  exercise: SessionExerciseData;
  onRemove: () => void;
}

export function InlineExerciseRow({ exercise, onRemove }: InlineExerciseRowProps) {
  const { data: exercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  const exerciseData = exercises?.find(e => e.id === exercise.exercise_id);
  const volumeData = volumes?.find(v => v.id === exercise.volume_id);
  const methodData = methods?.find(m => m.id === exercise.method_id);

  if (!exerciseData || !volumeData || !methodData) {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Musculação":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "Mobilidade":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "Cardio":
        return "bg-red-500/10 text-red-700 dark:text-red-300";
      case "Alongamento":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 border border-border rounded-md bg-card hover:bg-muted/50 transition-colors group">
      {/* Drag handle */}
      <div className="col-span-1 flex justify-center opacity-30 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Tipo */}
      <div className="col-span-2">
        <Badge variant="outline" className={`text-xs ${getTypeColor(exerciseData.exercise_type)}`}>
          {exerciseData.exercise_type}
        </Badge>
      </div>

      {/* Grupo */}
      <div className="col-span-2">
        <span className="text-xs text-muted-foreground">
          {exerciseData.exercise_group}
        </span>
      </div>

      {/* Exercício */}
      <div className="col-span-2">
        <span className="text-xs font-medium truncate block">
          {exerciseData.name}
        </span>
      </div>

      {/* Volume */}
      <div className="col-span-2">
        <span className="text-xs text-muted-foreground">
          {volumeData.name}
        </span>
      </div>

      {/* Método */}
      <div className="col-span-2">
        <span className="text-xs text-muted-foreground">
          {methodData.name || `${methodData.reps_min}-${methodData.reps_max}`}
        </span>
      </div>

      {/* Ações */}
      <div className="col-span-1 flex justify-center">
        <Button 
          onClick={onRemove} 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
}
