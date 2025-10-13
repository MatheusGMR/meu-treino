import { useEffect, useState } from "react";
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
import { MediaUpload } from "@/components/shared/MediaUpload";
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

const INTENSITIES = ["Fácil", "Intermediário", "Difícil"];

export const ExerciseDialog = ({
  exercise,
  open,
  onOpenChange,
}: ExerciseDialogProps) => {
  const [file, setFile] = useState<File>();
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: "",
      exercise_group: "Abdômen",
      intensity: "Intermediário",
      print_name: "",
      equipment: "",
      description: "",
      media_type: "image",
      media_url: "",
    },
  });

  useEffect(() => {
    if (exercise) {
      form.reset({
        name: exercise.name,
        exercise_group: exercise.exercise_group as any,
        intensity: exercise.intensity as any,
        print_name: exercise.print_name || "",
        equipment: exercise.equipment || "",
        description: exercise.description || "",
        media_type: (exercise.media_type as "image" | "video") || "image",
        media_url: exercise.media_url || "",
      });
    } else {
      form.reset();
      setFile(undefined);
    }
  }, [exercise, form]);

  const onSubmit = (data: ExerciseFormData) => {
    if (exercise) {
      updateMutation.mutate(
        {
          id: exercise.id,
          data,
          file,
          oldMediaUrl: exercise.media_url || undefined,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            setFile(undefined);
          },
        }
      );
    } else {
      createMutation.mutate(
        { data, file },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
            setFile(undefined);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exercise_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo Muscular *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="intensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensidade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTENSITIES.map((intensity) => (
                          <SelectItem key={intensity} value={intensity}>
                            {intensity}
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
              name="print_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Impressão</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome alternativo para impressão" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Barra, Halteres" {...field} />
                  </FormControl>
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
                      placeholder="Descrição detalhada do exercício..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <MediaUpload
              value={form.watch("media_url")}
              mediaType={form.watch("media_type")}
              onMediaTypeChange={(type) => form.setValue("media_type", type)}
              onFileSelect={setFile}
              onUrlChange={(url) => form.setValue("media_url", url)}
            />

            <div className="flex justify-end gap-2 pt-4">
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
