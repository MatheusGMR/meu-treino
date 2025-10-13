import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { workoutSchema, type WorkoutFormData } from "@/lib/schemas/workoutSchema";
import {
  useCreateWorkout,
  useUpdateWorkout,
  useWorkoutWithSessions,
} from "@/hooks/useWorkouts";
import { SessionSelector } from "./SessionSelector";

interface WorkoutDialogProps {
  workout?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRAINING_TYPES = ["Hipertrofia", "Emagrecimento", "Musculação", "Funcional", "Outro"];
const LEVELS = ["Iniciante", "Avançado"];
const GENDERS = ["Masculino", "Feminino", "Unissex"];

export const WorkoutDialog = ({
  workout,
  open,
  onOpenChange,
}: WorkoutDialogProps) => {
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();
  const { data: workoutData } = useWorkoutWithSessions(workout?.id || "");

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      training_type: undefined,
      level: undefined,
      gender: undefined,
      age_range: "",
      sessions: [],
    },
  });

  useEffect(() => {
    if (workoutData) {
      const sessions =
        workoutData.workout_sessions?.map((ws: any, index: number) => ({
          session_id: ws.session_id,
          order_index: index,
        })) || [];

      form.reset({
        name: workoutData.name,
        training_type: workoutData.training_type as any,
        level: workoutData.level as any,
        gender: workoutData.gender as any,
        age_range: workoutData.age_range || "",
        sessions,
      });
    } else if (!workout) {
      form.reset();
    }
  }, [workoutData, workout, form]);

  const onSubmit = (data: WorkoutFormData) => {
    if (workout) {
      updateMutation.mutate(
        { id: workout.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? "Editar Treino" : "Novo Treino"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Hipertrofia Iniciante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="training_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Treino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRAINING_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sessions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sessões *</FormLabel>
                  <FormControl>
                    <SessionSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {workout ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
