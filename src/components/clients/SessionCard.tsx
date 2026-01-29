import { useState } from "react";
import { ChevronDown, ChevronRight, Edit, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KanbanExerciseSelector } from "./KanbanExerciseSelector";
import { InlineExerciseRow } from "./InlineExerciseRow";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

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
  onReorderExercises?: (startIndex: number, endIndex: number) => void;
  dragHandleAttributes?: any;
  dragHandleListeners?: any;
  clientMedicalConditions?: string | null;
}

// Componente sortable para exercício individual
interface SortableExerciseProps {
  exercise: SessionExerciseData;
  index: number;
  onRemove: () => void;
}

const SortableExercise = ({ exercise, index, onRemove }: SortableExerciseProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `exercise-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <InlineExerciseRow exercise={exercise} onRemove={onRemove} />
      </div>
    </div>
  );
};

export const SessionCard = ({
  session,
  sessionIndex,
  isExpanded,
  onToggleExpand,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
  dragHandleAttributes,
  dragHandleListeners,
  clientMedicalConditions,
}: SessionCardProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onReorderExercises) return;

    const oldIndex = parseInt(active.id.toString().split("-")[1]);
    const newIndex = parseInt(over.id.toString().split("-")[1]);

    onReorderExercises(oldIndex, newIndex);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {dragHandleListeners && (
              <button
                {...dragHandleAttributes}
                {...dragHandleListeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
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
        <CardContent className="space-y-6">
          {/* Kanban para adicionar mais exercícios - no topo */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-foreground">
              Adicionar mais exercícios
            </h5>
            <div className="overflow-x-auto -mx-6 px-6 pb-2">
              <div className="min-w-[900px]">
                <KanbanExerciseSelector
                  onSave={onAddExercise}
                  onComplete={() => {}}
                  orderIndex={session.exercises.length}
                  clientMedicalConditions={clientMedicalConditions}
                />
              </div>
            </div>
          </div>

          {/* Lista de exercícios - se existirem */}
          {session.exercises.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border/30">
              <h5 className="text-sm font-semibold text-muted-foreground">
                Exercícios adicionados
              </h5>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={session.exercises.map((_, idx) => `exercise-${idx}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {session.exercises.map((ex, idx) => (
                      <SortableExercise
                        key={`exercise-${idx}`}
                        exercise={ex}
                        index={idx}
                        onRemove={() => onRemoveExercise(idx)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
