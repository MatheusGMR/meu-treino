import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Trash2, GripVertical, X, Copy } from "lucide-react";
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
import { useMethods } from "@/hooks/useMethods";
import { useVolumes } from "@/hooks/useVolumes";
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
  onDuplicate: () => void;
  onAddExercise: (exercise: SessionExerciseData) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onUpdateExerciseNotes?: (exerciseIndex: number, notes: string) => void;
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
  onUpdateNotes?: (notes: string) => void;
}

const SortableExercise = ({ exercise, index, onRemove, onUpdateNotes }: SortableExerciseProps) => {
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
        <InlineExerciseRow exercise={exercise} onRemove={onRemove} onUpdateNotes={onUpdateNotes} />
      </div>
    </div>
  );
};

// Component for session-level default method/volume
const SessionDefaults = ({ onDefaultsChange }: { onDefaultsChange: (methodId: string | null, volumeId: string | null) => void }) => {
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
  const [defaultVolumeId, setDefaultVolumeId] = useState<string | null>(null);
  const { data: methods } = useMethods();
  const { data: volumes } = useVolumes();

  const selectedMethodData = useMemo(() => 
    methods?.find(m => m.id === defaultMethodId), [methods, defaultMethodId]
  );

  const handleMethodChange = (val: string) => {
    const newVal = val === "none" ? null : val;
    setDefaultMethodId(newVal);
    onDefaultsChange(newVal, defaultVolumeId);
  };

  const handleVolumeChange = (val: string) => {
    const newVal = val === "none" ? null : val;
    setDefaultVolumeId(newVal);
    onDefaultsChange(defaultMethodId, newVal);
  };

  const clearDefaults = () => {
    setDefaultMethodId(null);
    setDefaultVolumeId(null);
    onDefaultsChange(null, null);
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Padrões da Sessão
        </h5>
        {(defaultMethodId || defaultVolumeId) && (
          <Button variant="ghost" size="sm" onClick={clearDefaults} className="h-6 px-2 text-xs gap-1">
            <X className="w-3 h-3" /> Limpar
          </Button>
        )}
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground mb-1 block">Método padrão</label>
          <Select value={defaultMethodId || "none"} onValueChange={handleMethodChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum (selecionar por exercício)</SelectItem>
              {methods?.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name || `${m.reps_min}-${m.reps_max} reps`} • {m.objective || m.load_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground mb-1 block">Volume padrão</label>
          <Select value={defaultVolumeId || "none"} onValueChange={handleVolumeChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum (selecionar por exercício)</SelectItem>
              {volumes?.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} • {v.num_series}x{v.num_exercises}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Resumo do método selecionado */}
      {selectedMethodData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground bg-background/50 rounded p-2">
          <span>Reps: {selectedMethodData.reps_min}-{selectedMethodData.reps_max}</span>
          <span>Pausa: {selectedMethodData.rest_seconds}s</span>
          <span>Carga: {selectedMethodData.load_level}</span>
          <span>Cadência: {selectedMethodData.cadence_contraction}-{selectedMethodData.cadence_pause}-{selectedMethodData.cadence_stretch}</span>
          <span>Risco: {selectedMethodData.risk_level}</span>
          <span>Energia: {selectedMethodData.energy_cost}</span>
        </div>
      )}
    </div>
  );
};

export const SessionCard = ({
  session,
  sessionIndex,
  isExpanded,
  onToggleExpand,
  onRemove,
  onDuplicate,
  onAddExercise,
  onRemoveExercise,
  onUpdateExerciseNotes,
  onReorderExercises,
  onUpdateName,
  onUpdateType,
  dragHandleAttributes,
  dragHandleListeners,
  clientMedicalConditions,
}: SessionCardProps) => {
  const exerciseListRef = useRef<HTMLDivElement>(null);
  const prevExerciseCount = useRef(session.exercises.length);
  const sessionDefaultsRef = useRef<{ methodId: string | null; volumeId: string | null }>({ methodId: null, volumeId: null });

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
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onDuplicate} className="shrink-0" title="Duplicar sessão">
              <Copy className="w-4 h-4" />
            </Button>
            {removeButton}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Seletores de método e volume padrão */}
          <SessionDefaults
            onDefaultsChange={(methodId, volumeId) => {
              sessionDefaultsRef.current = { methodId, volumeId };
            }}
          />

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
              defaultMethodId={sessionDefaultsRef.current.methodId}
              defaultVolumeId={sessionDefaultsRef.current.volumeId}
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
