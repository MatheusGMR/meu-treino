import { z } from "zod";

export const sessionExerciseSchema = z.object({
  exercise_id: z.string().uuid("Exercício inválido"),
  volume_id: z.string().uuid("Volume inválido"),
  method_id: z.string().uuid("Método inválido"),
  order_index: z.number().int().min(0),
});

export const sessionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  description: z.string().max(500).optional(),
  exercises: z
    .array(sessionExerciseSchema)
    .min(1, "Adicione pelo menos um exercício à sessão"),
});

export type SessionFormData = z.infer<typeof sessionSchema>;
export type SessionExerciseData = z.infer<typeof sessionExerciseSchema>;
