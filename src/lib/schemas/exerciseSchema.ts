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
    "Quadríceps",
    "Posterior",
    "Lombar",
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
  level: z.enum(["Iniciante", "Intermediário", "Avançado"]).optional(),
  equipment: z.array(z.string()).optional(),
  primary_muscle: z.string().max(100).optional(),
  secondary_muscle: z.string().max(100).optional(),
  impact_level: z.enum(["Baixo", "Médio", "Alto"]).optional(),
  biomechanical_class: z.string().max(100).optional(),
  dominant_movement: z.string().max(100).optional(),
  thumbnail_url: z.string().url("URL inválida").optional().or(z.literal("")),
  external_id: z.string().max(50).optional().or(z.literal("")),
  safety_level: z.enum(["S1", "S2", "S3", "S4", "S5"]).optional(),
  difficulty_code: z.string().max(10).optional().or(z.literal("")),
  block: z.enum(["MOB", "FORT", "MS", "MI", "CARD", "ALONG"]).optional(),
  equipment_code: z.enum(["PC", "ELAS", "MAC", "DIV", "CONV", "CAB", "HAL", "BAR"]).optional(),
  movement: z.string().max(100).optional().or(z.literal("")),
  variation: z.string().max(100).optional().or(z.literal("")),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;
