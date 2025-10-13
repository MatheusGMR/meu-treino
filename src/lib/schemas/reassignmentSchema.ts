import { z } from "zod";

export const reassignClientSchema = z.object({
  client_id: z.string().uuid("ID do cliente inválido"),
  new_personal_id: z.string().uuid("ID do profissional inválido"),
  change_reason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
});

export type ReassignClient = z.infer<typeof reassignClientSchema>;
