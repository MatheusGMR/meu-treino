import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Dumbbell, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClientWorkoutBuilder } from "@/hooks/useClientWorkoutBuilder";
import { useWorkouts } from "@/hooks/useWorkouts";
import { MuscleImpactMeter } from "./MuscleImpactMeter";
import { HealthAlertPanel } from "./HealthAlertPanel";
import { SessionEditorInline } from "./SessionEditorInline";
import { ExercisePickerWithAnalysis } from "./ExercisePickerWithAnalysis";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkoutBuilderProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkoutBuilder = ({
  clientId,
  open,
  onOpenChange,
}: WorkoutBuilderProps) => {
  const builder = useClientWorkoutBuilder(clientId);
  const { data: workouts } = useWorkouts();

  const handleSubmit = async () => {
    await builder.submit();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Construtor de Treino
          </DialogTitle>
          <DialogDescription>
            Monte ou escolha um treino e veja o impacto em tempo real
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-[1fr_360px] h-full">
            {/* Construtor (70%) */}
            <div className="border-r overflow-y-auto p-6">
              <Tabs
                value={builder.mode}
                onValueChange={(v) => builder.setMode(v as "existing" | "new")}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="existing">Usar Existente</TabsTrigger>
                  <TabsTrigger value="new">Criar Novo</TabsTrigger>
                </TabsList>

                {/* Tab: Usar Treino Existente */}
                <TabsContent value="existing" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Selecionar Treino</Label>
                    <ScrollArea className="h-96 rounded-md border p-4">
                      <div className="space-y-2">
                        {workouts?.map((workout) => (
                          <Card
                            key={workout.id}
                            className={cn(
                              "p-4 cursor-pointer transition-all hover:shadow-md",
                              builder.selectedWorkoutId === workout.id &&
                                "border-primary shadow-md"
                            )}
                            onClick={() => builder.setSelectedWorkoutId(workout.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{workout.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {workout.training_type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {workout.training_type}
                                    </Badge>
                                  )}
                                  {workout.level && (
                                    <Badge variant="outline" className="text-xs">
                                      {workout.level}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Datas e Notas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !builder.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {builder.startDate ? (
                              format(builder.startDate, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={builder.startDate}
                            onSelect={(date) => date && builder.setStartDate(date)}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Fim (Opcional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !builder.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {builder.endDate ? (
                              format(builder.endDate, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione...</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={builder.endDate}
                            onSelect={(date) => builder.setEndDate(date)}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={builder.notes}
                      onChange={(e) => builder.setNotes(e.target.value)}
                      placeholder="Adicione observações sobre o treino..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Tab: Criar Treino Novo */}
                <TabsContent value="new" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Treino</Label>
                    <Input
                      value={builder.tempWorkout.name}
                      onChange={(e) =>
                        builder.setTempWorkout({
                          ...builder.tempWorkout,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ex: Treino ABC"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sessões</Label>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Sessão
                      </Button>
                    </div>

                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {builder.tempWorkout.sessions.map((session, idx) => (
                          <SessionEditorInline
                            key={idx}
                            session={session}
                            onUpdate={(updated) => builder.updateSession(idx, updated)}
                            onRemove={() => builder.removeSession(idx)}
                          />
                        ))}
                        {builder.tempWorkout.sessions.length === 0 && (
                          <Card className="p-8">
                            <p className="text-sm text-muted-foreground text-center">
                              Nenhuma sessão adicionada ainda
                            </p>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <ExercisePickerWithAnalysis
                    onAddExercise={(exercise) => {
                      // TODO: Adicionar exercício à sessão atual ou criar nova sessão
                      console.log("Add exercise:", exercise);
                    }}
                    selectedExerciseIds={[]}
                    contraindications={builder.compatibility.warnings.map(
                      (w) => w.condition
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Painel de Análise (30%) */}
            <div className="bg-muted/30 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Análise em Tempo Real</h3>

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

                <Card className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Resumo</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Sessões:{" "}
                      {builder.mode === "existing" ? "—" : builder.tempWorkout.sessions.length}
                    </p>
                    <p>Exercícios: {builder.muscleAnalysis.totalExercises}</p>
                    <p>Tempo estimado: {builder.estimatedTime}</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!builder.canSubmit || builder.isSubmitting}
          >
            {builder.isSubmitting ? "Atribuindo..." : "Atribuir Treino"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
