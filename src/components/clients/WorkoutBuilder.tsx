import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useClientWorkoutBuilder } from "@/hooks/useClientWorkoutBuilder";
import { MuscleImpactMeter } from "./MuscleImpactMeter";
import { HealthAlertPanel } from "./HealthAlertPanel";
import { ClientHealthSummary } from "./ClientHealthSummary";
import { Card } from "@/components/ui/card";
import { KanbanExerciseSelector } from "./KanbanExerciseSelector";
import { InlineExerciseRow } from "./InlineExerciseRow";
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

  // Criar sessão padrão ao montar
  useEffect(() => {
    if (builder.tempWorkout.sessions.length === 0) {
      builder.addNewSession({
        name: "Sessão 1",
        description: "",
        exercises: [],
        isNew: true,
      });
    }
  }, []);

  const currentSession = builder.tempWorkout.sessions[0];

  const handleAddExercise = (exercise: SessionExerciseData) => {
    if (!currentSession) return;
    
    // Garantir que todos os campos obrigatórios estão presentes
    const validExercise: SessionExerciseData = {
      exercise_id: exercise.exercise_id,
      volume_id: exercise.volume_id,
      method_id: exercise.method_id,
      order_index: exercise.order_index,
    };
    
    const updatedSession = {
      ...currentSession,
      exercises: [...currentSession.exercises, validExercise],
    };
    builder.updateSession(0, updatedSession);
  };

  const handleRemoveExercise = (index: number) => {
    if (!currentSession) return;
    
    const updatedExercises = currentSession.exercises.filter((_, i) => i !== index);
    const reorderedExercises = updatedExercises.map((ex, idx) => ({
      ...ex,
      order_index: idx,
    }));
    
    builder.updateSession(0, {
      ...currentSession,
      exercises: reorderedExercises,
    });
  };

  const handleSubmit = async () => {
    await builder.submit();
    onSuccess();
  };

  if (!currentSession) {
    return <div>Carregando...</div>;
  }

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

          {/* Kanban + Lista de Exercícios */}
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">Adicionar Exercícios</h3>
              <p className="text-sm text-muted-foreground">
                Selecione exercícios progressivamente através das colunas
              </p>
            </div>

            {/* Lista de exercícios já adicionados */}
            {currentSession.exercises.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Exercícios Adicionados
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {currentSession.exercises.length} exercício{currentSession.exercises.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                  {currentSession.exercises.map((ex, idx) => (
                    <InlineExerciseRow
                      key={idx}
                      exercise={ex}
                      onRemove={() => handleRemoveExercise(idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Kanban Selector */}
            <div className="pt-4 border-t">
              <KanbanExerciseSelector
                onSave={handleAddExercise}
                onComplete={() => {}}
                orderIndex={currentSession.exercises.length}
              />
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

          <ClientHealthSummary
            medicalConditions={builder.clientProfile?.medical_conditions}
            goals={builder.clientProfile?.goals}
            primaryGoal={builder.clientAnamnesis?.primary_goal}
            secondaryGoals={builder.clientAnamnesis?.secondary_goals}
            activityLevel={builder.clientAnamnesis?.activity_level}
          />

          {/* Resumo */}
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3">Resumo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exercícios:</span>
                <span className="font-medium">{builder.muscleAnalysis.totalExercises}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo estimado:</span>
                <span className="font-medium">{builder.estimatedTime}</span>
              </div>
            </div>
          </Card>
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
    </div>
  );
};
