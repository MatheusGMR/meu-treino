import { z } from "zod";

export const physicalAssessmentSchema = z.object({
  client_id: z.string().uuid("ID do cliente inválido"),
  assessment_date: z.string(),
  weight: z.number().positive("Peso deve ser positivo").optional(),
  height: z.number().positive("Altura deve ser positiva").optional(),
  body_fat_percentage: z
    .number()
    .min(0, "Percentual deve ser entre 0 e 100")
    .max(100, "Percentual deve ser entre 0 e 100")
    .optional(),
  muscle_mass_percentage: z
    .number()
    .min(0, "Percentual deve ser entre 0 e 100")
    .max(100, "Percentual deve ser entre 0 e 100")
    .optional(),
  chest_circumference: z.number().positive().optional(),
  waist_circumference: z.number().positive().optional(),
  hip_circumference: z.number().positive().optional(),
  arm_circumference: z.number().positive().optional(),
  thigh_circumference: z.number().positive().optional(),
  notes: z.string().optional(),
});

export type PhysicalAssessment = z.infer<typeof physicalAssessmentSchema>;
