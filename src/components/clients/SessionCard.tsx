import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Trash2, GripVertical, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KanbanExerciseSelector } from "./KanbanExerciseSelector";
import { InlineExerciseRow } from "./InlineExerciseRow";
import { toast } from "@/hooks/use-toast";
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
  session_type?: string;
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
  onUpdateName?: (name: string) => void;
  onUpdateType?: (type: string) => void;
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
  onUpdateName,
  onUpdateType,
  dragHandleAttributes,
  dragHandleListeners,
  clientMedicalConditions,
}: SessionCardProps) => {
  const exerciseListRef = useRef<HTMLDivElement>(null);
  const prevExerciseCount = useRef(session.exercises.length);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-scroll + toast when exercise is added
  useEffect(() => {
    if (session.exercises.length > prevExerciseCount.current) {
      toast({
        title: "Exercício adicionado",
        description: `${session.exercises.length} exercício${session.exercises.length !== 1 ? 's' : ''} na sessão`,
      });
      setTimeout(() => {
        exerciseListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    prevExerciseCount.current = session.exercises.length;
  }, [session.exercises.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onReorderExercises) return;

    const oldIndex = parseInt(active.id.toString().split("-")[1]);
    const newIndex = parseInt(over.id.toString().split("-")[1]);

    onReorderExercises(oldIndex, newIndex);
  };

  const handleRemoveClick = () => {
    onRemove();
  };

  const removeButton = session.exercises.length > 0 ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover sessão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta sessão contém {session.exercises.length} exercício{session.exercises.length !== 1 ? 's' : ''}. 
            Ao removê-la, todos os exercícios serão perdidos. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemoveClick}>
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Button variant="ghost" size="icon" onClick={handleRemoveClick} className="shrink-0">
      <Trash2 className="w-4 h-4" />
    </Button>
  );

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
                {session.isNew && onUpdateName ? (
                  <Input
                    value={session.name}
                    onChange={(e) => onUpdateName(e.target.value)}
                    className="h-8 text-sm font-semibold max-w-[200px]"
                    placeholder="Nome da sessão"
                  />
                ) : (
                  <h4 className="font-semibold">{session.name}</h4>
                )}
                {session.isNew && onUpdateType ? (
                  <Select
                    value={session.session_type || ""}
                    onValueChange={(val) => onUpdateType(val)}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Musculação">Musculação</SelectItem>
                      <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                      <SelectItem value="Alongamento">Alongamento</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  !session.isNew && (
                    <Badge variant="secondary">Existente</Badge>
                  )
                )}
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
          {removeButton}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Kanban para adicionar mais exercícios - no topo */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-foreground">
              Adicionar mais exercícios
            </h5>
            <KanbanExerciseSelector
              onSave={onAddExercise}
              onComplete={() => {}}
              orderIndex={session.exercises.length}
              clientMedicalConditions={clientMedicalConditions}
            />
          </div>

          {/* Lista de exercícios - se existirem */}
          {session.exercises.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border/30" ref={exerciseListRef}>
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
