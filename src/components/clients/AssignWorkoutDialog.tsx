import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useAssignWorkout } from "@/hooks/useClientWorkouts";
import { useWorkouts } from "@/hooks/useWorkouts";
import { format } from "date-fns";
import { useState } from "react";

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

  const form = useForm({
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      notes: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (!selectedWorkout) return;

    await assignWorkout.mutateAsync({
      clientId,
      workoutId: selectedWorkout,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      notes: data.notes || undefined,
    });
    onOpenChange(false);
    form.reset();
    setSelectedWorkout("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Treino</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout">Treino *</Label>
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
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
            <Button type="submit" disabled={assignWorkout.isPending || !selectedWorkout}>
              {assignWorkout.isPending ? "Atribuindo..." : "Atribuir Treino"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
