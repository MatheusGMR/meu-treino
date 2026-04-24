import { z } from "zod";

export const SUPPORT_VIDEO_CATEGORIES = [
  { value: "educacional", label: "Educacional" },
  { value: "motivacional", label: "Motivacional" },
  { value: "tecnica", label: "Técnica" },
  { value: "recuperacao", label: "Recuperação" },
  { value: "nutricao", label: "Nutrição" },
  { value: "protocolo", label: "Protocolo" },
] as const;

export const SUPPORT_VIDEO_SOURCES = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
  { value: "upload", label: "Upload direto" },
] as const;

export const SUPPORT_VIDEO_MOMENTS = [
  { value: "pre_workout", label: "Antes do treino" },
  { value: "post_workout", label: "Após o treino" },
  { value: "rest_day", label: "Dia de descanso" },
  { value: "pain_relief", label: "Alívio de dor" },
  { value: "education", label: "Aprendizado" },
] as const;

export const supportVideoSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum([
    "educacional",
    "motivacional",
    "tecnica",
    "recuperacao",
    "nutricao",
    "protocolo",
  ]),
  source: z.enum(["youtube", "vimeo", "upload"]),
  video_url: z.string().min(1, "URL ou arquivo obrigatório"),
  thumbnail_url: z.string().url().optional().nullable().or(z.literal("")),
  duration_seconds: z.coerce.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).default([]),
  suggested_for_dor_cat: z.string().nullable().optional(),
  suggested_for_ins_cat: z.string().nullable().optional(),
  suggested_for_exercise_group: z.string().nullable().optional(),
  suggested_when: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type SupportVideoFormValues = z.input<typeof supportVideoSchema>;
export type SupportVideoFormParsed = z.output<typeof supportVideoSchema>;
