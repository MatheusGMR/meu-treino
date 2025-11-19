import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Trash2, GripVertical } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface TempSession {
  id?: string;
  name: string;
  description: string;
  exercises: SessionExerciseData[];
  isNew?: boolean;
  isEdited?: boolean;
}

interface SessionEditorInlineProps {
  session: TempSession;
  onUpdate: (session: TempSession) => void;
  onRemove: () => void;
}

export const SessionEditorInline = ({
  session,
  onUpdate,
  onRemove,
}: SessionEditorInlineProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: exercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  const handleUpdateExercise = (
    index: number,
    field: keyof SessionExerciseData,
    value: any
  ) => {
    const updatedExercises = [...session.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    onUpdate({ ...session, exercises: updatedExercises });
  };

  const handleRemoveExercise = (index: number) => {
    const updatedExercises = session.exercises.filter((_, i) => i !== index);
    // Reorder
    const reordered = updatedExercises.map((ex, i) => ({ ...ex, order_index: i }));
    onUpdate({ ...session, exercises: reordered });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{session.name}</h4>
              {session.isNew && <Badge variant="secondary">Nova</Badge>}
              {session.isEdited && <Badge variant="outline">Editada</Badge>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {session.exercises.length} exercício{session.exercises.length !== 1 ? "s" : ""}
          </p>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Input
                  value={session.name}
                  onChange={(e) => onUpdate({ ...session, name: e.target.value })}
                  placeholder="Nome da sessão"
                />
                <Textarea
                  value={session.description}
                  onChange={(e) =>
                    onUpdate({ ...session, description: e.target.value })
                  }
                  placeholder="Descrição (opcional)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Exercícios:</div>
                {session.exercises.map((exercise, idx) => {
                  const exerciseInfo = exercises?.find(
                    (e) => e.id === exercise.exercise_id
                  );
                  const volumeInfo = volumes?.find(
                    (v) => v.id === exercise.volume_id
                  );
                  const methodInfo = methods?.find(
                    (m) => m.id === exercise.method_id
                  );

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {exerciseInfo?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {volumeInfo?.name} • {methodInfo?.name || "Método padrão"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={exercise.volume_id}
                          onValueChange={(value) =>
                            handleUpdateExercise(idx, "volume_id", value)
                          }
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {volumes?.map((vol) => (
                              <SelectItem key={vol.id} value={vol.id}>
                                {vol.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
