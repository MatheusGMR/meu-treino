import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, GripVertical, RefreshCw, Sparkles } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useClientWorkoutBuilder } from "@/hooks/useClientWorkoutBuilder";
import { HealthAlertPanel } from "./HealthAlertPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionCard } from "./SessionCard";
import { ClientProfileCard } from "./cockpit/ClientProfileCard";
import { WeeklyVolumeCard } from "./cockpit/WeeklyVolumeCard";
import { MuscleDistributionCard } from "./cockpit/MuscleDistributionCard";
import { RestrictionsCard } from "./cockpit/RestrictionsCard";
import { QualityScoresCard } from "./cockpit/QualityScoresCard";
import { WorkoutProgressCard } from "./cockpit/WorkoutProgressCard";
import { AISuggestionsCard } from "./cockpit/AISuggestionsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardContent } from "@/components/ui/card";
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
  const [showWorkoutNameDialog, setShowWorkoutNameDialog] = useState(false);
  const [workoutNameInput, setWorkoutNameInput] = useState("");

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
    setWorkoutNameInput(builder.tempWorkout.name);
    setShowWorkoutNameDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!workoutNameInput.trim()) return;
    
    builder.setTempWorkout({
      ...builder.tempWorkout,
      name: workoutNameInput,
    });
    
    try {
      await builder.submit();
      setShowWorkoutNameDialog(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar treino:", error);
    }
  };

  const toggleSessionExpand = (index: number) => {
    setExpandedSessionIndex(expandedSessionIndex === index ? null : index);
  };

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
      <ResizablePanelGroup direction="horizontal" className="gap-6 h-[calc(100vh-280px)]">
        <ResizablePanel defaultSize={70} minSize={55} maxSize={80}>
          {/* Coluna Esquerda: Construtor */}
          <div className="h-full overflow-y-auto scrollarea-hidden pr-3">
            <div className="space-y-6">
            {/* Sessões do Treino */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Sessões do Treino</h3>
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
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground mb-2">
                        Nenhuma sessão adicionada ao treino
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Clique em "Nova Sessão" ou "Adicionar Sessão Existente" para começar
                      </p>
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
                      />
                    ))
                  )}
                </div>
              </SortableContext>
              </DndContext>
            </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          {/* Coluna Direita: Cockpit Sticky com Scroll Independente */}
          <div className="sticky top-0 h-[calc(100vh-280px)] overflow-y-auto scrollarea-hidden pl-3">
            <div className="space-y-4">
            {/* BLOCO 1: Perfil do Cliente */}
            <ClientProfileCard
              primaryGoal={builder.clientAnamnesis?.primary_goal || null}
              secondaryGoal={builder.clientAnamnesis?.secondary_goals?.[0] || null}
              level={builder.clientAnamnesis?.nivel_experiencia || 'Não definido'}
              timeAvailable={builder.clientAnamnesis?.tempo_disponivel || 'Não definido'}
              suggestedFrequency={builder.weeklyTimeEstimate.suggestedSessions}
              pains={builder.fatigueAlert?.pains || []}
              restrictions={builder.clientAnamnesis?.medical_restrictions_details || builder.clientProfile?.medical_conditions}
              stress={builder.clientAnamnesis?.estresse || null}
              sleep={builder.clientAnamnesis?.sono_horas || null}
              fatigueAlert={builder.fatigueAlert}
              clientAnamnesis={builder.clientAnamnesis}
            />

            {/* BLOCO 2: Volume Semanal */}
            <WeeklyVolumeCard
              currentSets={builder.weeklyVolume.totalSets}
              recommendedSets={{
                min: builder.weeklyVolume.benchmark?.min || 40,
                max: builder.weeklyVolume.benchmark?.max || 60,
                optimal: builder.weeklyVolume.benchmark?.optimal || 50
              }}
              currentSessions={builder.tempWorkout.sessions.length}
              suggestedSessions={builder.weeklyTimeEstimate.suggestedSessions}
              currentTime={builder.weeklyTimeEstimate.totalMinutes}
              recommendedTime={builder.weeklyTimeEstimate.recommended}
            />

            {/* BLOCO 3: Distribuição Muscular */}
            <MuscleDistributionCard goals={builder.muscleDistributionGoals} />

            {/* BLOCO 4: Riscos e Restrições */}
            <RestrictionsCard
              blocked={builder.exerciseRecommendations.blocked}
              recommended={builder.exerciseRecommendations.recommended}
              warnings={builder.exerciseRecommendations.warnings}
            />

            {/* BLOCO 5: Sugestão Automática (IA ChatGPT) */}
            {builder.loadingAI && (
              <Card className="border-primary/30">
                <CardContent className="py-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Gerando sugestões personalizadas...
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {builder.aiError && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{builder.aiError}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={builder.refreshAISuggestions}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {!builder.loadingAI && !builder.aiError && builder.aiSuggestions && (
              <div className="relative">
                <AISuggestionsCard suggestions={builder.aiSuggestions} />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={builder.refreshAISuggestions}
                  title="Gerar novas sugestões"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* BLOCO 6: Indicadores de Qualidade */}
            <QualityScoresCard 
              scores={builder.qualityScores}
              hasExercises={builder.muscleAnalysis.totalExercises > 0}
            />

            {/* BLOCO 7: Progresso do Treino */}
            <WorkoutProgressCard progress={builder.workoutProgress} />

            {/* Manter HealthAlertPanel se houver riscos críticos */}
            {builder.compatibility.riskLevel === 'critical' && (
              <HealthAlertPanel
                riskLevel={builder.compatibility.riskLevel}
                warnings={builder.compatibility.warnings}
                criticalIssues={builder.compatibility.criticalIssues}
                recommendations={builder.compatibility.recommendations}
                acknowledgeRisks={builder.acknowledgeRisks}
                onAcknowledgeChange={builder.setAcknowledgeRisks}
                profileRiskFactors={builder.profileRisks.factors}
              />
            )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Footer com ações */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!builder.canSubmit || builder.isSubmitting}
        >
          {builder.isSubmitting ? "Atribuindo..." : "Atribuir Treino"}
        </Button>
      </div>

      {/* Dialog de Nome do Treino */}
      <Dialog open={showWorkoutNameDialog} onOpenChange={setShowWorkoutNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nome do Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-workout-name">
                Digite o nome do treino antes de atribuir
              </Label>
              <Input
                id="dialog-workout-name"
                value={workoutNameInput}
                onChange={(e) => setWorkoutNameInput(e.target.value)}
                placeholder="Ex: Treino ABC, Hipertrofia Completo..."
                className="text-lg"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowWorkoutNameDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={!workoutNameInput.trim() || builder.isSubmitting}
            >
              {builder.isSubmitting ? "Atribuindo..." : "Confirmar e Atribuir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
