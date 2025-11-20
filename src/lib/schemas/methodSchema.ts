import { z } from "zod";

export const methodSchema = z.object({
  name: z.string().max(100).optional(),
  reps_min: z.number().int().min(1, "Mínimo 1 repetição"),
  reps_max: z.number().int().min(1, "Mínimo 1 repetição"),
  reps_description: z.string().max(200).optional(),
  rest_seconds: z.number().int().min(0, "Não pode ser negativo"),
  load_level: z.enum(["Alta", "Média", "Baixa"], {
    required_error: "Selecione a carga",
  }),
  cadence_contraction: z.number().int().min(0, "Não pode ser negativo"),
  cadence_pause: z.number().int().min(0, "Não pode ser negativo"),
  cadence_stretch: z.number().int().min(0, "Não pode ser negativo"),
  objective: z.enum([
    "Hipertrofia",
    "Força",
    "Resistência",
    "Potência",
    "Hipertrofia + Força",
    "Força + Hipertrofia",
    "Equilíbrio / Hipertrofia",
    "Hipertrofia pesada",
    "Força + Potência",
  ]).optional(),
  risk_level: z.enum([
    "Baixo risco",
    "Médio risco",
    "Alto risco",
    "Alto risco de fadiga",
  ], {
    required_error: "Selecione o nível de risco",
  }),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  energy_cost: z.enum(["Alto", "Médio", "Baixo"], {
    required_error: "Selecione o custo energético",
  }),
  recommended_combination: z.string().max(500).optional(),
}).refine(data => data.reps_max >= data.reps_min, {
  message: "Máximo deve ser maior ou igual ao mínimo",
  path: ["reps_max"],
});

export type MethodFormData = z.infer<typeof methodSchema>;
