import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical } from "lucide-react";
import { InlineExerciseAdder } from "./InlineExerciseAdder";
import { InlineExerciseRow } from "./InlineExerciseRow";
import { SessionAnalysisPanel } from "./SessionAnalysisPanel";
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
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const handleAddExercise = (newExercise: SessionExerciseData) => {
    const updatedExercises = [...session.exercises, newExercise];
    onUpdate({ ...session, exercises: updatedExercises });
    setIsAddingExercise(false);
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

              {/* Split Layout: Exercises (70%) + Analysis (30%) */}
              <div className="grid grid-cols-[70%_30%] gap-4">
                {/* Exercises Section */}
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                    <div className="col-span-1"></div>
                    <div className="col-span-2">Tipo</div>
                    <div className="col-span-2">Grupo</div>
                    <div className="col-span-2">Exercício</div>
                    <div className="col-span-2">Volume</div>
                    <div className="col-span-2">Método</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Exercise Rows */}
                  <div className="space-y-1">
                    {session.exercises.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-4 text-center">
                        Nenhum exercício adicionado ainda
                      </p>
                    ) : (
                      session.exercises.map((exercise, idx) => (
                        exercise.exercise_id && exercise.volume_id && exercise.method_id && (
                          <InlineExerciseRow
                            key={idx}
                            exercise={{
                              exercise_id: exercise.exercise_id,
                              volume_id: exercise.volume_id,
                              method_id: exercise.method_id,
                              order_index: exercise.order_index || idx
                            }}
                            onRemove={() => handleRemoveExercise(idx)}
                          />
                        )
                      ))
                    )}

                    {/* Adding New Exercise */}
                    {isAddingExercise && (
                      <InlineExerciseAdder
                        onSave={handleAddExercise}
                        onCancel={() => setIsAddingExercise(false)}
                        orderIndex={session.exercises.length}
                      />
                    )}
                  </div>

                  {/* Add Exercise Button */}
                  {!isAddingExercise && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingExercise(true)}
                      className="w-full mt-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Exercício
                    </Button>
                  )}
                </div>

                {/* Analysis Panel - Side by side */}
                <div>
                  <SessionAnalysisPanel
                    exercises={session.exercises}
                    sessionName={session.name}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
