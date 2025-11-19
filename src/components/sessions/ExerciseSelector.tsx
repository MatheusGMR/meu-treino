import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface ExerciseSelectorProps {
  value: SessionExerciseData[];
  onChange: (exercises: SessionExerciseData[]) => void;
}

export const ExerciseSelector = ({
  value,
  onChange,
}: ExerciseSelectorProps) => {
  const { data: availableExercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  const addExercise = (exerciseId: string) => {
    const defaultVolume = volumes?.[0]?.id;
    const defaultMethod = methods?.[0]?.id;

    if (!defaultVolume || !defaultMethod) return;

    const newExercise: SessionExerciseData = {
      exercise_id: exerciseId,
      volume_id: defaultVolume,
      method_id: defaultMethod,
      order_index: value.length,
    };
    onChange([...value, newExercise]);
  };

  const removeExercise = (index: number) => {
    const newExercises = value.filter((_, i) => i !== index);
    onChange(newExercises.map((ex, i) => ({ ...ex, order_index: i })));
  };

  const updateExercise = (
    index: number,
    field: keyof SessionExerciseData,
    val: any
  ) => {
    const newExercises = [...value];
    newExercises[index] = { ...newExercises[index], [field]: val };
    onChange(newExercises);
  };

  const selectedIds = value.map((ex) => ex.exercise_id);
  const unselectedExercises = availableExercises?.filter(
    (ex) => !selectedIds.includes(ex.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select onValueChange={addExercise}>
          <SelectTrigger>
            <SelectValue placeholder="Adicionar exercício..." />
          </SelectTrigger>
          <SelectContent>
            {unselectedExercises?.map((exercise) => (
              <SelectItem key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.exercise_group})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="icon" disabled>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum exercício adicionado
        </p>
      )}

      {value.map((exercise, index) => {
        const exerciseInfo = availableExercises?.find(
          (e) => e.id === exercise.exercise_id
        );

        return (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exerciseInfo?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exerciseInfo?.exercise_group}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Volume
                    </label>
                    <Select
                      value={exercise.volume_id}
                      onValueChange={(val) =>
                        updateExercise(index, "volume_id", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {volumes?.map((volume) => (
                          <SelectItem key={volume.id} value={volume.id}>
                            {volume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">
                      Método
                    </label>
                    <Select
                      value={exercise.method_id}
                      onValueChange={(val) =>
                        updateExercise(index, "method_id", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {methods?.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name || `${method.reps_min}-${method.reps_max} reps`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
