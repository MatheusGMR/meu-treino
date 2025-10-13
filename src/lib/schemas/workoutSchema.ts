import { z } from "zod";

export const workoutSessionSchema = z.object({
  session_id: z.string().uuid("Sessão inválida"),
  order_index: z.number().int().min(0),
});

export const workoutSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  training_type: z
    .enum(["Hipertrofia", "Emagrecimento", "Musculação", "Funcional", "Outro"])
    .optional(),
  level: z.enum(["Iniciante", "Avançado"]).optional(),
  gender: z.enum(["Masculino", "Feminino", "Unissex"]).optional(),
  age_range: z.string().max(50).optional(),
  sessions: z
    .array(workoutSessionSchema)
    .min(1, "Adicione pelo menos uma sessão ao treino"),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;
export type WorkoutSessionData = z.infer<typeof workoutSessionSchema>;
