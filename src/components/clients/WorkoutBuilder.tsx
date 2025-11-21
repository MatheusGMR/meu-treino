import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, GripVertical, AlertCircle, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useClientWorkoutBuilder } from "@/hooks/useClientWorkoutBuilder";
import { MuscleImpactMeter } from "./MuscleImpactMeter";
import { ImpactAnalysisMeter } from "./ImpactAnalysisMeter";
import { HealthAlertPanel } from "./HealthAlertPanel";
import { ClientHealthSummary } from "./ClientHealthSummary";
import { WorkoutQualityIndicators } from "./WorkoutQualityIndicators";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionCard } from "./SessionCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExistingSessionSelector } from "./ExistingSessionSelector";
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

interface WorkoutBuilderProps {
  clientId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

// Componente sortable para sessão individual
interface SortableSessionProps {
  session: any;
  sessionIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onAddExercise: (exercise: SessionExerciseData) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onReorderExercises: (startIndex: number, endIndex: number) => void;
  clientMedicalConditions?: string | null;
  showValidation?: boolean;
  isFirstSession?: boolean;
}

const SortableSession = ({
  session,
  sessionIndex,
  isExpanded,
  onToggleExpand,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
  clientMedicalConditions,
  showValidation,
  isFirstSession,
}: SortableSessionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `session-${sessionIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50")}
    >
      <SessionCard
        session={session}
        sessionIndex={sessionIndex}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onRemove={onRemove}
        onAddExercise={onAddExercise}
        onRemoveExercise={onRemoveExercise}
        onReorderExercises={onReorderExercises}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
        clientMedicalConditions={clientMedicalConditions}
        showValidation={showValidation}
        isFirstSession={isFirstSession}
      />
    </div>
  );
};

export const WorkoutBuilder = ({
  clientId,
  onCancel,
  onSuccess,
}: WorkoutBuilderProps) => {
  const builder = useClientWorkoutBuilder(clientId);
  const [showExistingSelector, setShowExistingSelector] = useState(false);
  const [expandedSessionIndex, setExpandedSessionIndex] = useState<number | null>(null);
  const [nameFieldTouched, setNameFieldTouched] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSessionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = parseInt(active.id.toString().split("-")[1]);
    const newIndex = parseInt(over.id.toString().split("-")[1]);

    builder.reorderSessions(oldIndex, newIndex);

    // Ajustar o índice expandido se necessário
    if (expandedSessionIndex === oldIndex) {
      setExpandedSessionIndex(newIndex);
    } else if (expandedSessionIndex !== null) {
      if (oldIndex < expandedSessionIndex && newIndex >= expandedSessionIndex) {
        setExpandedSessionIndex(expandedSessionIndex - 1);
      } else if (oldIndex > expandedSessionIndex && newIndex <= expandedSessionIndex) {
        setExpandedSessionIndex(expandedSessionIndex + 1);
      }
    }
  };

  // Session creation is now explicit - no auto-creation

  const handleAddNewSession = () => {
    const sessionNumber = builder.tempWorkout.sessions.length + 1;
    builder.addNewSession({
      name: `Sessão ${sessionNumber}`,
      description: "",
      exercises: [],
      isNew: true,
    });
    setExpandedSessionIndex(builder.tempWorkout.sessions.length);
  };

  const handleAddExistingSession = async (sessionId: string) => {
    await builder.addExistingSession(sessionId);
    setShowExistingSelector(false);
  };

  const handleAddExerciseToSession = (sessionIndex: number, exercise: SessionExerciseData) => {
    const session = builder.tempWorkout.sessions[sessionIndex];
    if (!session) return;

    const validExercise: SessionExerciseData = {
      exercise_id: exercise.exercise_id,
      volume_id: exercise.volume_id,
      method_id: exercise.method_id,
      order_index: exercise.order_index,
    };

    const updatedSession = {
      ...session,
      exercises: [...session.exercises, validExercise],
    };
    builder.updateSession(sessionIndex, updatedSession);
  };

  const handleRemoveExerciseFromSession = (sessionIndex: number, exerciseIndex: number) => {
    const session = builder.tempWorkout.sessions[sessionIndex];
    if (!session) return;

    const updatedExercises = session.exercises.filter((_, i) => i !== exerciseIndex);
    const reorderedExercises = updatedExercises.map((ex, idx) => ({
      ...ex,
      order_index: idx,
    }));

    builder.updateSession(sessionIndex, {
      ...session,
      exercises: reorderedExercises,
    });
  };

  const handleSubmit = async () => {
    try {
      await builder.submit();
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar treino:", error);
    }
  };

  const toggleSessionExpand = (index: number) => {
    setExpandedSessionIndex(expandedSessionIndex === index ? null : index);
  };

  const isNameInvalid = nameFieldTouched && !builder.tempWorkout.name.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Construtor de Treino</h2>
          <p className="text-sm text-muted-foreground">
            Monte um treino personalizado e veja o impacto em tempo real
          </p>
        </div>
      </div>

      {/* Painel Redimensionável: Construtor (esquerda) + Análise (direita) */}
      <ResizablePanelGroup direction="horizontal" className="gap-6 min-h-[600px]">
        <ResizablePanel defaultSize={65} minSize={50} maxSize={75}>
          {/* Coluna Esquerda: Construtor */}
          <div className="space-y-6 pr-3">
            {/* Nome do Treino - SEMPRE VISÍVEL */}
            <div className="space-y-2">
              <Label htmlFor="workout-name" className={cn(isNameInvalid && "text-destructive")}>
                Nome do Treino *
              </Label>
              <Input
                id="workout-name"
                value={builder.tempWorkout.name}
                onChange={(e) =>
                  builder.setTempWorkout({
                    ...builder.tempWorkout,
                    name: e.target.value,
                  })
                }
                onBlur={() => setNameFieldTouched(true)}
                placeholder="Ex: Treino ABC, Hipertrofia Completo..."
                className={cn(
                  "text-lg",
                  isNameInvalid && "border-destructive focus-visible:ring-destructive"
                )}
                autoFocus
              />
              {isNameInvalid && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  O nome do treino é obrigatório
                </p>
              )}
            </div>

            {/* Sessões do Treino */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Sessões do Treino</h3>
                    {builder.tempWorkout.sessions.length === 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Crie novas sessões ou adicione sessões existentes
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewSession}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Sessão
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExistingSelector(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Sessão Existente
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSessionDragEnd}
              >
              <SortableContext
                items={builder.tempWorkout.sessions.map((_, i) => `session-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {builder.tempWorkout.sessions.length === 0 ? (
                    <Card className="p-8 text-center border-dashed border-2 border-destructive/50 bg-destructive/5">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                      <p className="text-destructive font-semibold mb-2">
                        Nenhuma sessão adicionada ao treino
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione pelo menos uma sessão para continuar
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="destructive" size="sm" onClick={handleAddNewSession}>
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Sessão
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowExistingSelector(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Sessão Existente
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    builder.tempWorkout.sessions.map((session, index) => (
                      <SortableSession
                        key={`session-${index}`}
                        session={session}
                        sessionIndex={index}
                        isExpanded={expandedSessionIndex === index}
                        onToggleExpand={() => toggleSessionExpand(index)}
                        onRemove={() => builder.removeSession(index)}
                        onAddExercise={(exercise) => handleAddExerciseToSession(index, exercise)}
                        onRemoveExercise={(exerciseIndex) =>
                          handleRemoveExerciseFromSession(index, exerciseIndex)
                        }
                        onReorderExercises={(startIndex, endIndex) => {
                          builder.reorderExercisesInSession(index, startIndex, endIndex);
                        }}
                        clientMedicalConditions={builder.clientProfile?.medical_conditions}
                        showValidation={true}
                        isFirstSession={index === 0}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              </DndContext>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          {/* Coluna Direita: Análise em Tempo Real */}
          <div className="space-y-4 pl-3">
            <ClientHealthSummary
              medicalConditions={builder.clientProfile?.medical_conditions}
              goals={builder.clientProfile?.goals}
              primaryGoal={builder.clientAnamnesis?.primary_goal}
              secondaryGoals={builder.clientAnamnesis?.secondary_goals}
              activityLevel={builder.clientAnamnesis?.activity_level}
            />

            <MuscleImpactMeter
              muscleGroups={builder.muscleAnalysis.muscleGroups}
              totalExercises={builder.muscleAnalysis.totalExercises}
              warnings={builder.muscleAnalysis.warnings}
              isBalanced={builder.muscleAnalysis.isBalanced}
            />

            <ImpactAnalysisMeter
              distribution={builder.impactAnalysis.distribution}
              overallIntensity={builder.impactAnalysis.overallIntensity}
              warnings={builder.impactAnalysis.warnings}
              score={builder.impactAnalysis.score}
              totalExercises={builder.impactAnalysis.totalExercises}
            />

            <HealthAlertPanel
              riskLevel={builder.compatibility.riskLevel}
              warnings={builder.compatibility.warnings}
              criticalIssues={builder.compatibility.criticalIssues}
              recommendations={builder.compatibility.recommendations}
              acknowledgeRisks={builder.acknowledgeRisks}
              onAcknowledgeChange={builder.setAcknowledgeRisks}
            />

            <WorkoutQualityIndicators
              totalExercises={builder.muscleAnalysis.totalExercises}
              muscleGroupsCount={builder.muscleAnalysis.muscleGroups.length}
              isBalanced={builder.muscleAnalysis.isBalanced}
              overallIntensity={builder.impactAnalysis.overallIntensity}
            />

            {/* Volume Semanal */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Volume Semanal</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de séries:</span>
                  <span className="font-medium">{builder.weeklyVolume.totalSets}</span>
                </div>
                {builder.weeklyVolume.setsPerMuscle.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Por grupo muscular:</p>
                    {builder.weeklyVolume.setsPerMuscle.map((item) => (
                      <div key={item.group} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.group}:</span>
                        <span>{item.sets} séries</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Resumo Enriquecido */}
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-3">Resumo do Treino</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessões:</span>
                  <span className="font-medium">{builder.tempWorkout.sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exercícios:</span>
                  <span className="font-medium">{builder.muscleAnalysis.totalExercises}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grupos musculares:</span>
                  <span className="font-medium">{builder.muscleAnalysis.muscleGroups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="font-medium">{builder.estimatedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={builder.muscleAnalysis.isBalanced ? "default" : "destructive"}>
                    {builder.muscleAnalysis.isBalanced ? "Balanceado" : "Requer atenção"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intensidade:</span>
                  <Badge 
                    variant={
                      builder.impactAnalysis.overallIntensity === 'balanced' ? 'default' :
                      builder.impactAnalysis.overallIntensity === 'light' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {builder.impactAnalysis.overallIntensity === 'light' ? '💤 Leve' :
                     builder.impactAnalysis.overallIntensity === 'balanced' ? '✓ Balanceado' :
                     '⚡ Intenso'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Resumo de Validação */}
      {!builder.canSubmit && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-2">
                Complete os campos obrigatórios para atribuir o treino
              </h4>
              <ul className="space-y-1.5 text-sm">
                {!builder.tempWorkout.name.trim() ? (
                  <li className="flex items-center gap-2 text-destructive">
                    <X className="w-4 h-4" />
                    <span>Preencha o nome do treino</span>
                  </li>
                ) : (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="line-through">Nome do treino</span>
                  </li>
                )}
                
                {builder.tempWorkout.sessions.length === 0 ? (
                  <li className="flex items-center gap-2 text-destructive">
                    <X className="w-4 h-4" />
                    <span>Adicione pelo menos uma sessão</span>
                  </li>
                ) : (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="line-through">Sessões adicionadas ({builder.tempWorkout.sessions.length})</span>
                  </li>
                )}
                
                {builder.tempWorkout.sessions.length > 0 && builder.tempWorkout.sessions[0].exercises.length === 0 ? (
                  <li className="flex items-center gap-2 text-destructive">
                    <X className="w-4 h-4" />
                    <span>Adicione exercícios à primeira sessão</span>
                  </li>
                ) : builder.tempWorkout.sessions.length > 0 ? (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="line-through">Exercícios na primeira sessão ({builder.tempWorkout.sessions[0]?.exercises.length || 0})</span>
                  </li>
                ) : null}
                
                {builder.compatibility.riskLevel === "critical" && (
                  builder.acknowledgeRisks ? (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="line-through">Riscos de saúde reconhecidos</span>
                    </li>
                  ) : (
                    <li className="flex items-center gap-2 text-destructive">
                      <X className="w-4 h-4" />
                      <span>Reconheça os riscos de saúde no painel de alertas</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Footer com ações */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={handleSubmit}
                  disabled={!builder.canSubmit || builder.isSubmitting}
                >
                  {builder.isSubmitting ? "Atribuindo..." : "Atribuir Treino"}
                </Button>
              </span>
            </TooltipTrigger>
            {!builder.canSubmit && (
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-semibold mb-2">Requisitos pendentes:</p>
                <ul className="text-sm space-y-1">
                  {!builder.tempWorkout.name.trim() && (
                    <li className="flex items-center gap-1">
                      <X className="w-3 h-3 text-destructive" /> Nome do treino
                    </li>
                  )}
                  {builder.tempWorkout.sessions.length === 0 && (
                    <li className="flex items-center gap-1">
                      <X className="w-3 h-3 text-destructive" /> Adicionar pelo menos uma sessão
                    </li>
                  )}
                  {builder.tempWorkout.sessions.length > 0 && 
                   builder.tempWorkout.sessions[0].exercises.length === 0 && (
                    <li className="flex items-center gap-1">
                      <X className="w-3 h-3 text-destructive" /> Adicionar exercícios à primeira sessão
                    </li>
                  )}
                  {builder.compatibility.riskLevel === "critical" && !builder.acknowledgeRisks && (
                    <li className="flex items-center gap-1">
                      <X className="w-3 h-3 text-destructive" /> Reconhecer riscos de saúde
                    </li>
                  )}
                </ul>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Dialog de Seleção de Sessões Existentes */}
      <Dialog open={showExistingSelector} onOpenChange={setShowExistingSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Sessão Existente</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <ExistingSessionSelector
              onSelectSession={handleAddExistingSession}
              selectedSessionIds={builder.getExistingSessionIds()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
