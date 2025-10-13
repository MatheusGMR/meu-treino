import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { physicalAssessmentSchema, type PhysicalAssessment } from "@/lib/schemas/assessmentSchema";
import { useCreateAssessment } from "@/hooks/usePhysicalAssessments";
import { format } from "date-fns";

interface PhysicalAssessmentDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PhysicalAssessmentDialog = ({
  clientId,
  open,
  onOpenChange,
}: PhysicalAssessmentDialogProps) => {
  const createAssessment = useCreateAssessment();

  const form = useForm<PhysicalAssessment>({
    resolver: zodResolver(physicalAssessmentSchema),
    defaultValues: {
      client_id: clientId,
      assessment_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = async (data: PhysicalAssessment) => {
    await createAssessment.mutateAsync(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação Física</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assessment_date">Data da Avaliação *</Label>
            <Input id="assessment_date" type="date" {...form.register("assessment_date")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                {...form.register("weight", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                {...form.register("height", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_fat_percentage">% Gordura Corporal</Label>
              <Input
                id="body_fat_percentage"
                type="number"
                step="0.1"
                {...form.register("body_fat_percentage", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="muscle_mass_percentage">% Massa Muscular</Label>
              <Input
                id="muscle_mass_percentage"
                type="number"
                step="0.1"
                {...form.register("muscle_mass_percentage", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Circunferências (cm)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chest_circumference">Peitoral</Label>
                <Input
                  id="chest_circumference"
                  type="number"
                  step="0.1"
                  {...form.register("chest_circumference", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waist_circumference">Cintura</Label>
                <Input
                  id="waist_circumference"
                  type="number"
                  step="0.1"
                  {...form.register("waist_circumference", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hip_circumference">Quadril</Label>
                <Input
                  id="hip_circumference"
                  type="number"
                  step="0.1"
                  {...form.register("hip_circumference", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arm_circumference">Braço</Label>
                <Input
                  id="arm_circumference"
                  type="number"
                  step="0.1"
                  {...form.register("arm_circumference", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thigh_circumference">Coxa</Label>
                <Input
                  id="thigh_circumference"
                  type="number"
                  step="0.1"
                  {...form.register("thigh_circumference", { valueAsNumber: true })}
                />
              </div>
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
            <Button type="submit" disabled={createAssessment.isPending}>
              {createAssessment.isPending ? "Salvando..." : "Salvar Avaliação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
