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
  "Quadríceps",
  "Posterior",
  "Lombar",
  "Outro",
];

const EXERCISE_TYPES = ["Musculação", "Mobilidade", "Cardio", "Alongamento"];
const EXERCISE_LEVELS = ["Iniciante", "Intermediário", "Avançado"];
const IMPACT_LEVELS = ["Baixo", "Médio", "Alto"];
const EQUIPMENT_OPTIONS = [
  "Peso livre",
  "Máquina",
  "Barra",
  "Halteres",
  "Elástico",
  "Cabo",
  "Sem equipamento",
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
      exercise_type: "Musculação",
      exercise_group: "Abdômen",
      video_url: "",
      contraindication: "",
      level: undefined,
      equipment: [],
      primary_muscle: "",
      secondary_muscle: "",
      impact_level: undefined,
      biomechanical_class: "",
      dominant_movement: "",
      thumbnail_url: "",
    },
  });

  useEffect(() => {
    if (exercise) {
      form.reset({
        name: exercise.name,
        exercise_type: exercise.exercise_type as any,
        exercise_group: exercise.exercise_group as any,
        video_url: exercise.video_url || "",
        contraindication: exercise.contraindication || "",
        level: (exercise as any).level || undefined,
        equipment: (exercise as any).equipment || [],
        primary_muscle: (exercise as any).primary_muscle || "",
        secondary_muscle: (exercise as any).secondary_muscle || "",
        impact_level: (exercise as any).impact_level || undefined,
        biomechanical_class: (exercise as any).biomechanical_class || "",
        dominant_movement: (exercise as any).dominant_movement || "",
        thumbnail_url: (exercise as any).thumbnail_url || "",
      });
    } else if (!open) {
      form.reset({
        name: "",
        exercise_type: "Musculação",
        exercise_group: "Abdômen",
        video_url: "",
        contraindication: "",
        level: undefined,
        equipment: [],
        primary_muscle: "",
        secondary_muscle: "",
        impact_level: undefined,
        biomechanical_class: "",
        dominant_movement: "",
        thumbnail_url: "",
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
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
                name="exercise_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
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
            </div>

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
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXERCISE_LEVELS.map((level) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_muscle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Músculo Primário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Peitoral maior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_muscle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Músculo Secundário</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tríceps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="impact_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Impacto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IMPACT_LEVELS.map((level) => (
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

              <FormField
                control={form.control}
                name="biomechanical_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe Biomecânica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cadeia cinética fechada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dominant_movement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movimento Dominante</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empurrar horizontal" {...field} />
                  </FormControl>
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
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Thumbnail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
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
