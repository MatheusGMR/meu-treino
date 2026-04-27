import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  agentVideoSchema,
  type AgentVideoForm,
  PILAR_OPTIONS,
  PILAR_LABELS,
  MOMENTO_OPTIONS,
  MOMENTO_LABELS,
  INS_CAT_OPTIONS,
  DOR_CAT_OPTIONS,
} from "@/lib/schemas/agentVideoSchema";
import { useAgentVideos, type AgentVideoRow } from "@/hooks/useAgentVideos";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  video: AgentVideoRow | null;
}

const youtubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
};

export const AgentVideoDialog = ({ open, onOpenChange, video }: Props) => {
  const { create, update } = useAgentVideos();

  const { data: exercises = [] } = useQuery({
    queryKey: ["protocol-exercises-min"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("id, name, exercise_id")
        .eq("protocol_only", true)
        .order("name");
      return data ?? [];
    },
    enabled: open,
  });

  const form = useForm<AgentVideoForm>({
    resolver: zodResolver(agentVideoSchema),
    defaultValues: {
      video_code: "",
      title: "",
      description: "",
      pilar: "mobilidade",
      momento: "abertura",
      youtube_url: "",
      duration_seconds: undefined,
      recommended_for_ins_cat: undefined,
      recommended_for_dor_cat: undefined,
      obrigatorio: false,
      gatilho: "",
      sessoes_alvo: undefined,
      bloco_alvo: undefined,
      exercise_id: undefined,
      mandatory_at_session: undefined,
      ordem_sequencia: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (open && video) {
      form.reset({
        video_code: video.video_code,
        title: video.title,
        description: video.description ?? "",
        pilar: (video.pilar as any) ?? "mobilidade",
        momento: (video.momento as any) ?? "abertura",
        youtube_url: video.youtube_url ?? "",
        duration_seconds: video.duration_seconds ?? undefined,
        recommended_for_ins_cat: (video.recommended_for_ins_cat as any) ?? undefined,
        recommended_for_dor_cat: (video.recommended_for_dor_cat as any) ?? undefined,
        obrigatorio: video.obrigatorio,
        gatilho: video.gatilho ?? "",
        sessoes_alvo: video.sessoes_alvo ?? undefined,
        bloco_alvo: video.bloco_alvo ?? undefined,
        exercise_id: video.exercise_id ?? undefined,
        mandatory_at_session: video.mandatory_at_session ?? undefined,
        ordem_sequencia: video.ordem_sequencia ?? 0,
        active: video.active,
      });
    } else if (open) {
      form.reset();
    }
  }, [open, video, form]);

  const ytId = youtubeId(form.watch("youtube_url"));

  const sessoesAlvoString = useMemo(() => {
    const s = form.watch("sessoes_alvo");
    return Array.isArray(s) ? s.join(", ") : "";
  }, [form.watch("sessoes_alvo")]);

  const onSubmit = async (data: AgentVideoForm) => {
    if (video) {
      await update.mutateAsync({ id: video.id, payload: data });
    } else {
      await create.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{video ? "Editar vídeo" : "Novo vídeo do agente"}</DialogTitle>
          <DialogDescription>
            Configure metadados do mapeamento JMP. O motor usa pilar, nível e momento para decidir quando exibir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="video_code">Código *</Label>
              <Input id="video_code" placeholder="VID-MOB-I1-01" {...form.register("video_code")} />
              {form.formState.errors.video_code && (
                <p className="text-xs text-destructive">{form.formState.errors.video_code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" {...form.register("title")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pilar *</Label>
              <Select
                value={form.watch("pilar")}
                onValueChange={(v) => form.setValue("pilar", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PILAR_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{PILAR_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Momento *</Label>
              <Select
                value={form.watch("momento")}
                onValueChange={(v) => form.setValue("momento", v as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOMENTO_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>{MOMENTO_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Insegurança alvo</Label>
              <Select
                value={form.watch("recommended_for_ins_cat") ?? "any"}
                onValueChange={(v) =>
                  form.setValue("recommended_for_ins_cat", v === "any" ? null : (v as any))
                }
              >
                <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  {INS_CAT_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dor alvo</Label>
              <Select
                value={form.watch("recommended_for_dor_cat") ?? "any"}
                onValueChange={(v) =>
                  form.setValue("recommended_for_dor_cat", v === "any" ? null : (v as any))
                }
              >
                <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  {DOR_CAT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="youtube_url">URL do YouTube</Label>
            <Input
              id="youtube_url"
              placeholder="https://youtu.be/... (deixe vazio se ainda em produção)"
              {...form.register("youtube_url")}
            />
            {ytId && (
              <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border border-border mt-2">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Sessões-alvo</Label>
              <Input
                placeholder="ex: 6, 12, 24"
                defaultValue={sessoesAlvoString}
                onBlur={(e) => {
                  const arr = e.target.value
                    .split(/[,\s]+/)
                    .map((s) => parseInt(s, 10))
                    .filter((n) => Number.isFinite(n) && n > 0);
                  form.setValue("sessoes_alvo", arr.length ? arr : null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bloco (1/2/3)</Label>
              <Input
                type="number"
                min={1}
                max={3}
                {...form.register("bloco_alvo")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem na sequência</Label>
              <Input type="number" min={0} {...form.register("ordem_sequencia")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sessão obrigatória (legado)</Label>
              <Input type="number" min={1} {...form.register("mandatory_at_session")} />
            </div>
            <div className="space-y-1.5">
              <Label>Duração (segundos)</Label>
              <Input type="number" min={1} {...form.register("duration_seconds")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Exercício vinculado (opcional)</Label>
            <Select
              value={form.watch("exercise_id") ?? "none"}
              onValueChange={(v) => form.setValue("exercise_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {exercises.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.exercise_id ? `${e.exercise_id} — ` : ""}{e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.exercise_id && (
              <p className="text-xs text-destructive">{form.formState.errors.exercise_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Gatilho (descrição humana)</Label>
            <Textarea
              rows={2}
              placeholder='ex: "Toda sessão — I3 — até a sessão 6"'
              {...form.register("gatilho")}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("obrigatorio")}
                onCheckedChange={(v) => form.setValue("obrigatorio", v)}
              />
              <Label className="cursor-pointer">Obrigatório</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(v) => form.setValue("active", v)}
              />
              <Label className="cursor-pointer">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {video ? "Salvar alterações" : "Criar vídeo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
