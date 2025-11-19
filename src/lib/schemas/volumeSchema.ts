import { z } from "zod";

export const volumeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  num_series: z.number().int().min(1, "Mínimo 1 série"),
  num_exercises: z.number().int().min(1, "Mínimo 1 exercício"),
});

export type VolumeFormData = z.infer<typeof volumeSchema>;
