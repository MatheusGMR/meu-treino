import { z } from "zod";

export const sessionExerciseSchema = z.object({
  exercise_id: z.string().uuid("Exercício inválido"),
  order_index: z.number().int().min(0),
  sets: z.number().int().min(1).max(50).optional(),
  reps: z.string().max(50).optional(),
  rest_time: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});

export const sessionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(200),
  session_type: z.enum(["Mobilidade", "Alongamento", "Musculação"], {
    required_error: "Selecione o tipo de sessão",
  }),
  exercises: z
    .array(sessionExerciseSchema)
    .min(1, "Adicione pelo menos um exercício à sessão"),
});

export type SessionFormData = z.infer<typeof sessionSchema>;
export type SessionExerciseData = z.infer<typeof sessionExerciseSchema>;
