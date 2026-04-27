import { z } from "zod";

export const PILAR_OPTIONS = [
  "mobilidade",
  "fortalecimento",
  "resistido",
  "alongamento",
  "encerramento",
  "dor",
  "modo_seguro",
  "intro",
  "progressao",
  "fim",
] as const;

export const MOMENTO_OPTIONS = [
  "abertura",
  "antes_bloco",
  "antes_exercicio",
  "intervalo",
  "pos_sessao",
  "sessao_inteira",
] as const;

export const INS_CAT_OPTIONS = ["I1", "I2", "I3"] as const;
export const DOR_CAT_OPTIONS = ["D0", "D1", "D2", "D3"] as const;

export const agentVideoSchema = z
  .object({
    video_code: z
      .string()
      .min(3, "Código obrigatório (ex: VID-MOB-I1-01)")
      .regex(/^VID-[A-Z0-9-]+$/, "Use formato VID-AREA-NIVEL-NN"),
    title: z.string().min(3, "Título obrigatório"),
    description: z.string().optional().nullable(),
    pilar: z.enum(PILAR_OPTIONS),
    momento: z.enum(MOMENTO_OPTIONS),
    youtube_url: z
      .string()
      .url("URL inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    duration_seconds: z.coerce.number().int().positive().optional().nullable(),
    recommended_for_ins_cat: z.enum(INS_CAT_OPTIONS).optional().nullable(),
    recommended_for_dor_cat: z.enum(DOR_CAT_OPTIONS).optional().nullable(),
    obrigatorio: z.boolean().default(false),
    gatilho: z.string().optional().nullable(),
    sessoes_alvo: z.array(z.coerce.number().int().positive()).optional().nullable(),
    bloco_alvo: z.coerce.number().int().min(1).max(3).optional().nullable(),
    exercise_id: z.string().uuid().optional().nullable(),
    mandatory_at_session: z.coerce.number().int().positive().optional().nullable(),
    ordem_sequencia: z.coerce.number().int().min(0).default(0),
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.pilar === "resistido" && data.momento === "antes_exercicio") {
        return !!data.exercise_id;
      }
      return true;
    },
    {
      message: "Resistido + antes do exercício exige exercício vinculado",
      path: ["exercise_id"],
    }
  );

export type AgentVideoForm = z.infer<typeof agentVideoSchema>;

export const PILAR_LABELS: Record<(typeof PILAR_OPTIONS)[number], string> = {
  mobilidade: "Mobilidade",
  fortalecimento: "Fortalecimento",
  resistido: "Resistido",
  alongamento: "Alongamento",
  encerramento: "Encerramento",
  dor: "Dor",
  modo_seguro: "Modo Seguro",
  intro: "Introdução",
  progressao: "Progressão",
  fim: "Encerramento Final",
};

export const MOMENTO_LABELS: Record<(typeof MOMENTO_OPTIONS)[number], string> = {
  abertura: "Abertura da sessão",
  antes_bloco: "Antes do bloco",
  antes_exercicio: "Antes do exercício",
  intervalo: "Intervalo",
  pos_sessao: "Pós-sessão",
  sessao_inteira: "Sessão inteira",
};
