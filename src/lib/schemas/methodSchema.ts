import { z } from "zod";

export const methodSchema = z.object({
  name: z.string().max(100).optional(),
  reps_min: z.number().int().min(1, "Mínimo 1 repetição"),
  reps_max: z.number().int().min(1, "Mínimo 1 repetição"),
  rest_seconds: z.number().int().min(0, "Não pode ser negativo"),
  load_level: z.enum(["Alta", "Média", "Baixa"], {
    required_error: "Selecione a carga",
  }),
  cadence_contraction: z.number().int().min(0, "Não pode ser negativo"),
  cadence_pause: z.number().int().min(0, "Não pode ser negativo"),
  cadence_stretch: z.number().int().min(0, "Não pode ser negativo"),
}).refine(data => data.reps_max >= data.reps_min, {
  message: "Máximo deve ser maior ou igual ao mínimo",
  path: ["reps_max"],
});

export type MethodFormData = z.infer<typeof methodSchema>;
