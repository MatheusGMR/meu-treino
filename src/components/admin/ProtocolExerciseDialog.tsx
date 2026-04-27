import { useEffect, useState } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  ProtocolExercise,
  useProtocolBank,
  useUpsertProtocolExercise,
} from "@/hooks/useProtocolBank";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exercise?: ProtocolExercise | null;
}

const BLOCKS = [
  { value: "MOB", label: "MOB · Mobilidade" },
  { value: "FORT", label: "FORT · Fortalecimento" },
  { value: "RESIST", label: "RESIST · Resistido (PAI/SUB)" },
  { value: "ALONG", label: "ALONG · Alongamento" },
];
const KINDS = [
  { value: "PAI", label: "PAI · Padrão (use por default)" },
  { value: "SUB", label: "SUB · Substituto (entra quando há dor)" },
];
const REGIONS = [
  { value: "L0", label: "L0 · Sem dor" },
  { value: "L1", label: "L1 · Lombar/Coluna" },
  { value: "L2", label: "L2 · Joelho" },
  { value: "L3", label: "L3 · Ombro" },
  { value: "L_MULTI", label: "L_MULTI · Multi-região" },
];
const SAFETY = ["S1", "S2", "S3", "S4", "S5"] as const;
const TREINOS = [
  { value: "A", label: "Treino A" },
  { value: "B", label: "Treino B" },
];

const HelpLabel = ({ children, hint }: { children: React.ReactNode; hint: string }) => (
  <div className="flex items-center gap-1.5">
    <Label>{children}</Label>
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export const ProtocolExerciseDialog = ({ open, onOpenChange, exercise }: Props) => {
  const upsert = useUpsertProtocolExercise();
  const { data: allBank } = useProtocolBank();

  const [form, setForm] = useState<Partial<ProtocolExercise>>({});

  useEffect(() => {
    if (open) {
      setForm(
        exercise ?? {
          name: "",
          block: null,
          kind: "PAI",
          pain_region: "L0",
          treino_letra: null,
          bloco_protocolo: 1,
          is_primary: false,
          is_fixed_base: false,
          safety_level: "S2",
          protocol_only: true,
          exercise_group: "Outros",
          exercise_type: "Musculação",
          parent_exercise_id: null,
          video_url: null,
        }
      );
    }
  }, [open, exercise]);

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    await upsert.mutateAsync({ ...form, name: form.name.trim() } as any);
    onOpenChange(false);
  };

  const isSub = form.kind === "SUB";
  const possibleParents = (allBank ?? []).filter(
    (e) => e.kind === "PAI" && e.bloco_protocolo === form.bloco_protocolo && e.id !== form.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise ? "Editar exercício do Protocolo" : "Novo exercício do Protocolo"}</DialogTitle>
          <DialogDescription>
            Cadastre exercícios PAI/SUB com IDs JMP. Os campos abaixo alimentam a seleção determinística por
            sessão (D3 cirúrgico {">"} D2 SUB obrigatório {">"} D1 SUB prioritário {">"} D0 PAI padrão).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Nome *</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Supino reto com halteres"
            />
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="Identificador interno usado pela equipe técnica (ex.: MIMACS1BI003).">
              ID JMP (external_id)
            </HelpLabel>
            <Input
              value={form.external_id ?? ""}
              onChange={(e) => setForm({ ...form, external_id: e.target.value })}
              placeholder="MIMACS1BI003"
            />
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="Sufixo padrão do banco (ex.: MIMACS1BI003a).">Exercise ID legível</HelpLabel>
            <Input
              value={form.exercise_id ?? ""}
              onChange={(e) => setForm({ ...form, exercise_id: e.target.value })}
              placeholder="MIMACS1BI003a"
            />
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="Bloco didático: MOB, FORT, RESIST ou ALONG.">Bloco *</HelpLabel>
            <Select
              value={form.block ?? ""}
              onValueChange={(v) => setForm({ ...form, block: v as any })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {BLOCKS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="PAI = padrão. SUB = substituto que entra quando há dor (D1/D2) ou D3.">
              Tipo (kind) *
            </HelpLabel>
            <Select
              value={form.kind ?? "PAI"}
              onValueChange={(v) => setForm({ ...form, kind: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSub && (
            <div className="space-y-1.5 md:col-span-2">
              <HelpLabel hint="Vincule o SUB ao PAI que ele substitui no mesmo bloco/sessão.">
                Exercício PAI vinculado
              </HelpLabel>
              <Select
                value={form.parent_exercise_id ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, parent_exercise_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger><SelectValue placeholder="Sem vínculo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem vínculo —</SelectItem>
                  {possibleParents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <HelpLabel hint="Região anatômica de dor que esse exercício ATENDE (SUB) ou EVITA (PAI quando D2/D3).">
              Região de dor
            </HelpLabel>
            <Select
              value={form.pain_region ?? "L0"}
              onValueChange={(v) => setForm({ ...form, pain_region: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="A=ímpar, B=par. Vazio = elegível em qualquer treino.">Treino (A/B)</HelpLabel>
            <Select
              value={form.treino_letra ?? "any"}
              onValueChange={(v) =>
                setForm({ ...form, treino_letra: v === "any" ? null : (v as any) })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">— Ambos —</SelectItem>
                {TREINOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="Bloco do protocolo (1, 2, 3…). Define progressão temporal.">Bloco do protocolo</HelpLabel>
            <Input
              type="number"
              min={1}
              value={form.bloco_protocolo ?? 1}
              onChange={(e) =>
                setForm({ ...form, bloco_protocolo: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </div>

          <div className="space-y-1.5">
            <HelpLabel hint="S1 mais seguro, S5 mais avançado. I3 só vê até S3, I2 até S4, I1 até S5.">
              Safety level
            </HelpLabel>
            <Select
              value={form.safety_level ?? "S2"}
              onValueChange={(v) => setForm({ ...form, safety_level: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SAFETY.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={!!form.is_primary}
              onCheckedChange={(v) => setForm({ ...form, is_primary: v })}
            />
            <div>
              <Label>Exercício primário</Label>
              <p className="text-xs text-muted-foreground">
                Supino, Remada, Leg e Cadeira (entra cedo na ordem do treino).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={!!form.is_fixed_base}
              onCheckedChange={(v) => setForm({ ...form, is_fixed_base: v })}
            />
            <div>
              <Label>Base fixa (MOB/FORT)</Label>
              <p className="text-xs text-muted-foreground">
                Sempre incluído na base de mobilidade ou fortalecimento iniciante.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Vídeo (YouTube Shorts)</Label>
            <Input
              value={form.video_url ?? ""}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/shorts/..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsert.isPending || !form.name?.trim()}>
            {upsert.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
