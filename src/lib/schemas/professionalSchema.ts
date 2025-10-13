import { z } from "zod";

export const addProfessionalSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  specializations: z.string().optional(),
});

export const editProfessionalSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  specializations: z.string().optional(),
});

export type AddProfessional = z.infer<typeof addProfessionalSchema>;
export type EditProfessional = z.infer<typeof editProfessionalSchema>;
