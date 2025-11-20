import { z } from "zod";

export const volumeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  num_series: z.number().int().min(1, "Mínimo 1 série"),
  num_exercises: z.number().int().min(1, "Mínimo 1 exercício"),
  series_min: z.number().int().min(1).optional(),
  series_max: z.number().int().min(1).optional(),
  exercise_min: z.number().int().min(1).optional(),
  exercise_max: z.number().int().min(1).optional(),
  weekly_volume_description: z.string().max(100).optional(),
  movement_pattern: z.string().max(100).optional(),
  goal: z.string().max(100).optional(),
  min_weekly_sets: z.number().int().min(0).optional(),
  optimal_weekly_sets: z.number().int().min(0).optional(),
  max_weekly_sets: z.number().int().min(0).optional(),
}).refine(data => !data.series_max || !data.series_min || data.series_max >= data.series_min, {
  message: "Série máxima deve ser maior ou igual à mínima",
  path: ["series_max"],
}).refine(data => !data.exercise_max || !data.exercise_min || data.exercise_max >= data.exercise_min, {
  message: "Exercício máximo deve ser maior ou igual ao mínimo",
  path: ["exercise_max"],
});

export type VolumeFormData = z.infer<typeof volumeSchema>;
