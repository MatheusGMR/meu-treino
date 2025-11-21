import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus } from "lucide-react";
import { useClientWorkoutBuilder } from "@/hooks/useClientWorkoutBuilder";
import { MuscleImpactMeter } from "./MuscleImpactMeter";
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

interface WorkoutBuilderProps {
  clientId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const WorkoutBuilder = ({
  clientId,
  onCancel,
  onSuccess,
}: WorkoutBuilderProps) => {
  const builder = useClientWorkoutBuilder(clientId);
  const [showExistingSelector, setShowExistingSelector] = useState(false);
  const [expandedSessionIndex, setExpandedSessionIndex] = useState<number | null>(null);

  // Criar sessão padrão ao montar se não houver nenhuma
  useEffect(() => {
    if (builder.tempWorkout.sessions.length === 0) {
      builder.addNewSession({
        name: "Sessão 1",
        description: "",
        exercises: [],
        isNew: true,
      });
      setExpandedSessionIndex(0);
    }
  }, []);

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

      {/* Grid: Construtor (esquerda) + Análise (direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Coluna Esquerda: Construtor */}
        <div className="space-y-6">
          {/* Nome do Treino - SEMPRE VISÍVEL */}
          <div className="space-y-2">
            <Label htmlFor="workout-name">Nome do Treino</Label>
            <Input
              id="workout-name"
              value={builder.tempWorkout.name}
              onChange={(e) =>
                builder.setTempWorkout({
                  ...builder.tempWorkout,
                  name: e.target.value,
                })
              }
              placeholder="Ex: Treino ABC, Hipertrofia Completo..."
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Sessões do Treino */}
          <Card className="p-6 space-y-6 border-0 shadow-none bg-transparent">
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
                  onClick={() => setShowExistingSelector(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Existente
                </Button>
                <Button onClick={handleAddNewSession}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Sessão
                </Button>
              </div>
            </div>

            {/* Lista de sessões */}
            <div className="space-y-4">
              {builder.tempWorkout.sessions.map((session, idx) => (
                <SessionCard
                  key={idx}
                  session={session}
                  sessionIndex={idx}
                  isExpanded={expandedSessionIndex === idx}
                  onToggleExpand={() => toggleSessionExpand(idx)}
                  onRemove={() => builder.removeSession(idx)}
                  onAddExercise={(exercise) => handleAddExerciseToSession(idx, exercise)}
                  onRemoveExercise={(exerciseIndex) =>
                    handleRemoveExerciseFromSession(idx, exerciseIndex)
                  }
                />
              ))}

              {builder.tempWorkout.sessions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-3">
                    Nenhuma sessão adicionada ainda
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setShowExistingSelector(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Existente
                    </Button>
                    <Button onClick={handleAddNewSession}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Sessão
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Coluna Direita: Análise em Tempo Real */}
        <div className="space-y-4">
          <MuscleImpactMeter
            muscleGroups={builder.muscleAnalysis.muscleGroups}
            totalExercises={builder.muscleAnalysis.totalExercises}
            warnings={builder.muscleAnalysis.warnings}
            isBalanced={builder.muscleAnalysis.isBalanced}
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
            </div>
          </Card>

          <ClientHealthSummary
            medicalConditions={builder.clientProfile?.medical_conditions}
            goals={builder.clientProfile?.goals}
            primaryGoal={builder.clientAnamnesis?.primary_goal}
            secondaryGoals={builder.clientAnamnesis?.secondary_goals}
            activityLevel={builder.clientAnamnesis?.activity_level}
          />
        </div>
      </div>

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
