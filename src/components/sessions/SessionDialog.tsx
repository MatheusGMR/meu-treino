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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ExerciseSelector } from "./ExerciseSelector";
import { sessionSchema, type SessionFormData } from "@/lib/schemas/sessionSchema";
import {
  useCreateSession,
  useUpdateSession,
  useSessionWithExercises,
} from "@/hooks/useSessions";
import { MuscleGroupVisualizer } from "@/components/workouts/MuscleGroupVisualizer";
import { useSessionMuscleAnalysis } from "@/hooks/useWorkoutMuscleAnalysis";
import { FormLabelWithTooltip } from "@/components/shared/FormLabelWithTooltip";
import { FIELD_DESCRIPTIONS } from "@/lib/fieldDescriptions";

interface SessionDialogProps {
  session?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionDialog = ({
  session,
  open,
  onOpenChange,
}: SessionDialogProps) => {
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const { data: sessionData } = useSessionWithExercises(session?.id || "");
  const muscleAnalysis = useSessionMuscleAnalysis(session?.id);

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      description: "",
      session_type: "Musculação",
      exercises: [],
    },
  });

  useEffect(() => {
    if (sessionData) {
      const exercises =
        sessionData.session_exercises?.map((se: any, index: number) => ({
          exercise_id: se.exercise_id,
          volume_id: se.volume_id,
          method_id: se.method_id,
          order_index: index,
        })) || [];

      form.reset({
        name: sessionData.name,
        description: sessionData.description,
        session_type: sessionData.session_type || "Musculação",
        exercises,
      });
    } else if (!session) {
      form.reset({
        name: "",
        description: "",
        session_type: "Musculação",
        exercises: [],
      });
    }
  }, [sessionData, session, form]);

  const onSubmit = (data: SessionFormData) => {
    if (session) {
      updateMutation.mutate(
        { id: session.id, data },
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
          <DialogTitle>
            {session ? "Editar Sessão" : "Nova Sessão"}
          </DialogTitle>
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
                    <Input placeholder="Ex: Peito A, Pernas B..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="session_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabelWithTooltip tooltip={FIELD_DESCRIPTIONS.session.session_type[field.value as keyof typeof FIELD_DESCRIPTIONS.session.session_type] || "Selecione um tipo para ver a descrição"} required>
                    Tipo de Sessão
                  </FormLabelWithTooltip>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mobilidade">Mobilidade</SelectItem>
                      <SelectItem value="Alongamento">Alongamento</SelectItem>
                      <SelectItem value="Musculação">Musculação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exercises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercícios *</FormLabel>
                  <FormControl>
                    <ExerciseSelector
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {session && muscleAnalysis.data && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Análise de Distribuição Muscular</h3>
                <MuscleGroupVisualizer
                  muscleGroups={muscleAnalysis.data.muscleGroups}
                  totalExercises={muscleAnalysis.data.totalExercises}
                  warnings={muscleAnalysis.data.warnings}
                  isBalanced={muscleAnalysis.data.isBalanced}
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {session ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
