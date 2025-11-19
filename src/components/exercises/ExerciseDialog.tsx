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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { exerciseSchema, type ExerciseFormData } from "@/lib/schemas/exerciseSchema";
import { useCreateExercise, useUpdateExercise } from "@/hooks/useExercises";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExerciseDialogProps {
  exercise?: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXERCISE_GROUPS = [
  "Abdômen",
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Glúteos",
  "Panturrilha",
  "Outro",
];

export const ExerciseDialog = ({
  exercise,
  open,
  onOpenChange,
}: ExerciseDialogProps) => {
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      exercise_group: "Abdômen",
      video_url: "",
      contraindication: "",
    },
  });

  useEffect(() => {
    if (exercise) {
      form.reset({
        name: exercise.name,
        exercise_group: exercise.exercise_group as any,
        video_url: exercise.video_url || "",
        contraindication: exercise.contraindication || "",
      });
    } else if (!open) {
      form.reset({
        name: "",
        exercise_group: "Abdômen",
        video_url: "",
        contraindication: "",
      });
    }
  }, [exercise, open, form]);

  const onSubmit = (data: ExerciseFormData) => {
    if (exercise) {
      updateMutation.mutate(
        { id: exercise.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "Editar Exercício" : "Novo Exercício"}
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
                    <Input placeholder="Ex: Supino reto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exercise_group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Muscular *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISE_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
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
              name="video_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contraindication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraindicação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Não recomendado para pessoas com problemas na coluna..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {exercise ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
