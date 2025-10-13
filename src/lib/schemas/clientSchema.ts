import { z } from "zod";

export const clientProfileSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_conditions: z.string().optional(),
  goals: z.string().optional(),
  notes: z.string().optional(),
  avatar_url: z.string().optional(),
});

export const clientAssignmentSchema = z.object({
  client_id: z.string().uuid("ID do cliente inválido"),
  status: z.enum(["Ativo", "Inativo", "Suspenso"]),
  start_date: z.string(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export const addClientSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  birth_date: z.string().optional(),
  gender: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_conditions: z.string().optional(),
  goals: z.string().optional(),
  start_date: z.string(),
});

export type ClientProfile = z.infer<typeof clientProfileSchema>;
export type ClientAssignment = z.infer<typeof clientAssignmentSchema>;
export type AddClient = z.infer<typeof addClientSchema>;
