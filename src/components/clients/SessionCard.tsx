import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanExerciseSelector } from "./KanbanExerciseSelector";
import { InlineExerciseRow } from "./InlineExerciseRow";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface TempSession {
  id?: string;
  name: string;
  description: string;
  exercises: SessionExerciseData[];
  isNew?: boolean;
}

interface SessionCardProps {
  session: TempSession;
  sessionIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onAddExercise: (exercise: SessionExerciseData) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
}

export const SessionCard = ({
  session,
  sessionIndex,
  isExpanded,
  onToggleExpand,
  onRemove,
  onAddExercise,
  onRemoveExercise,
}: SessionCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{session.name}</h4>
                <Badge variant={session.isNew ? "default" : "secondary"}>
                  {session.isNew ? "Nova" : "Existente"}
                </Badge>
                <Badge variant="outline">
                  {session.exercises.length} exercício{session.exercises.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              {session.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {session.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Kanban para adicionar mais exercícios */}
          <div>
            <h5 className="text-sm font-semibold mb-3">
              Adicionar mais exercícios
            </h5>
            <KanbanExerciseSelector
              onSave={onAddExercise}
              onComplete={() => {}}
              orderIndex={session.exercises.length}
            />
          </div>

          {/* Lista de exercícios */}
          {session.exercises.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h5 className="text-sm font-semibold">Exercícios</h5>
              <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                {session.exercises.map((ex, idx) => (
                  <InlineExerciseRow
                    key={idx}
                    exercise={ex}
                    onRemove={() => onRemoveExercise(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
