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
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  contraindication: z.string().max(500).optional(),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;
