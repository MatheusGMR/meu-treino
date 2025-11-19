import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useAssignWorkout } from "@/hooks/useClientWorkouts";
import { useWorkouts } from "@/hooks/useWorkouts";
import { format } from "date-fns";
import { useState } from "react";
import { MuscleGroupVisualizer } from "@/components/workouts/MuscleGroupVisualizer";
import { HealthCompatibilityAlert } from "@/components/workouts/HealthCompatibilityAlert";
import { useWorkoutMuscleAnalysis } from "@/hooks/useWorkoutMuscleAnalysis";
import { useHealthCompatibilityCheck } from "@/hooks/useHealthCompatibilityCheck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssignWorkoutDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssignWorkoutDialog = ({
  clientId,
  open,
  onOpenChange,
}: AssignWorkoutDialogProps) => {
  const assignWorkout = useAssignWorkout();
  const { data: workouts = [] } = useWorkouts();
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  // Análise muscular e compatibilidade
  const muscleAnalysis = useWorkoutMuscleAnalysis(selectedWorkout);
  const healthCheck = useHealthCompatibilityCheck(clientId, selectedWorkout);

  const form = useForm({
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      notes: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!selectedWorkout) return;

    // Validação de compatibilidade
    if (healthCheck.data && !healthCheck.data.compatible && !riskAcknowledged) {
      return; // Bloqueia se houver issues críticos e não foi reconhecido
    }

    const validationResult = healthCheck.data || null;
    const overrideReason = riskAcknowledged ? "Personal reconheceu os riscos e decidiu atribuir" : null;

    await assignWorkout.mutateAsync({
      clientId,
      workoutId: selectedWorkout,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      notes: data.notes || undefined,
      validationResult,
      overrideReason,
    });
    onOpenChange(false);
    form.reset();
    setSelectedWorkout("");
    setRiskAcknowledged(false);
  };

  const canSubmit = selectedWorkout && 
    (!healthCheck.data || 
     healthCheck.data.compatible || 
     (healthCheck.data.riskLevel !== "critical" && riskAcknowledged));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Treino ao Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout">Treino *</Label>
            <Select value={selectedWorkout} onValueChange={(value) => {
              setSelectedWorkout(value);
              setRiskAcknowledged(false);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um treino..." />
              </SelectTrigger>
              <SelectContent>
                {workouts.map((workout: any) => (
                  <SelectItem key={workout.id} value={workout.id}>
                    {workout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkout && (
            <Tabs defaultValue="compatibility" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compatibility">Compatibilidade</TabsTrigger>
                <TabsTrigger value="analysis">Análise Muscular</TabsTrigger>
              </TabsList>
              
              <TabsContent value="compatibility" className="space-y-4">
                {healthCheck.data && (
                  <>
                    <HealthCompatibilityAlert
                      compatible={healthCheck.data.compatible}
                      warnings={healthCheck.data.warnings}
                      criticalIssues={healthCheck.data.criticalIssues}
                      recommendations={healthCheck.data.recommendations}
                      riskLevel={healthCheck.data.riskLevel}
                    />

                    {healthCheck.data.riskLevel === "critical" && (
                      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                        <p className="text-sm font-semibold text-destructive">
                          ⛔ Atribuição Bloqueada
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Este treino possui contraindicações críticas para o cliente. 
                          É necessário liberação médica antes de prosseguir.
                        </p>
                      </div>
                    )}

                    {healthCheck.data.riskLevel !== "critical" && 
                     healthCheck.data.riskLevel !== "safe" && (
                      <div className="flex items-center space-x-2 p-4 border rounded-lg">
                        <Checkbox
                          id="risk-acknowledgment"
                          checked={riskAcknowledged}
                          onCheckedChange={(checked) => setRiskAcknowledged(!!checked)}
                        />
                        <label
                          htmlFor="risk-acknowledgment"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Estou ciente dos riscos e decido atribuir este treino
                        </label>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                {muscleAnalysis.data && (
                  <MuscleGroupVisualizer
                    muscleGroups={muscleAnalysis.data.muscleGroups}
                    totalExercises={muscleAnalysis.data.totalExercises}
                    warnings={muscleAnalysis.data.warnings}
                    isBalanced={muscleAnalysis.data.isBalanced}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input id="startDate" type="date" {...form.register("startDate")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término</Label>
              <Input id="endDate" type="date" {...form.register("endDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...form.register("notes")} rows={3} />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={assignWorkout.isPending || !canSubmit}>
              {assignWorkout.isPending ? "Atribuindo..." : "Atribuir Treino"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
