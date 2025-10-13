import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useExercisesByType } from "@/hooks/useSessions";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface ExerciseSelectorProps {
  sessionType: string;
  value: SessionExerciseData[];
  onChange: (exercises: SessionExerciseData[]) => void;
}

export const ExerciseSelector = ({
  sessionType,
  value,
  onChange,
}: ExerciseSelectorProps) => {
  const { data: availableExercises } = useExercisesByType(sessionType);

  const addExercise = (exerciseId: string) => {
    const newExercise: SessionExerciseData = {
      exercise_id: exerciseId,
      order_index: value.length,
      sets: 3,
      reps: "12",
      rest_time: 60,
      notes: "",
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Séries
                    </label>
                    <Input
                      type="number"
                      value={exercise.sets || ""}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          "sets",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="3"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Repetições
                    </label>
                    <Input
                      value={exercise.reps || ""}
                      onChange={(e) =>
                        updateExercise(index, "reps", e.target.value)
                      }
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Descanso (s)
                    </label>
                    <Input
                      type="number"
                      value={exercise.rest_time || ""}
                      onChange={(e) =>
                        updateExercise(
                          index,
                          "rest_time",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="60"
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Notas</label>
                  <Textarea
                    value={exercise.notes || ""}
                    onChange={(e) =>
                      updateExercise(index, "notes", e.target.value)
                    }
                    placeholder="Notas específicas..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
