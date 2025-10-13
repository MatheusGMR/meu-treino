import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  exercise_group: z.enum([
    "Abdômen",
    "Peito",
    "Costas",
    "Pernas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Glúteos",
    "Panturrilha",
    "Outro"
  ], { required_error: "Selecione um grupo muscular" }),
  intensity: z.enum(["Fácil", "Intermediário", "Difícil"], {
    required_error: "Selecione a intensidade",
  }),
  print_name: z.string().max(100).optional(),
  equipment: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  media_type: z.enum(["image", "video"]).optional(),
  media_url: z.string().url().optional().or(z.literal("")),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;
