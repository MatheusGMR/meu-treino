import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  exercise_type: z.enum([
    "Musculação",
    "Mobilidade",
    "Cardio",
    "Alongamento"
  ], { required_error: "Selecione o tipo de exercício" }),
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
    "Outro",
    "Superior",
    "Inferior",
    "Tronco",
    "Completo",
    "Baixo Impacto",
    "Alto Impacto",
    "HIIT",
    "Contínuo"
  ], { required_error: "Selecione um grupo" }),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  contraindication: z.string().max(500).optional(),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;
