import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Target } from "lucide-react";
import { StepHeader, StepFooter } from "./WizardLayout";
import { VETORES, REGIOES_DOR } from "@/lib/protocol/exerciseTaxonomy";
import { ProtocolExercise } from "@/hooks/useProtocolBank";
import { cn } from "@/lib/utils";

interface Props {
  form: Partial<ProtocolExercise> & { movement_vector?: string | null };
  onChange: (patch: Partial<ProtocolExercise> & { movement_vector?: string | null }) => void;
  possibleParents: ProtocolExercise[];
  onPrev: () => void;
  onNext: () => void;
}

const HelpLabel = ({ children, hint }: { children: React.ReactNode; hint: string }) => (
  <div className="flex items-center gap-1.5">
    <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </Label>
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3 h-3 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export const StepDetalhes = ({ form, onChange, possibleParents, onPrev, onNext }: Props) => {
  const valid =
    (form.primary_muscle ?? "").trim().length >= 3 &&
    !!form.movement_vector &&
    !!form.kind &&
    !!form.pain_region;

  const isSub = form.kind === "SUB";

  return (
    <div>
      <StepHeader
        icon={<Target className="w-5 h-5" />}
        title="Detalhes do Exercício"
        desc="Grupo muscular, vetor de movimento e parâmetros do agente do protocolo."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Motor primário + sinergistas separados por /. Ex.: Peitoral / Tríceps / Deltóide Anterior">
            Grupo Muscular *
          </HelpLabel>
          <Input
            value={form.primary_muscle ?? ""}
            onChange={(e) => onChange({ primary_muscle: e.target.value })}
            placeholder="Ex: Peitoral / Tríceps / Deltóide Anterior"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Vetor de movimento — como o agente classifica e encontra esse exercício na seleção determinística.">
            Vetor de Movimento *
          </HelpLabel>
          <Select
            value={form.movement_vector ?? ""}
            onValueChange={(v) => onChange({ movement_vector: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="— Selecione o vetor —" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {VETORES.map((g) => (
                <div key={g.grupo}>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wide">
                    {g.grupo}
                  </div>
                  {g.opts.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <HelpLabel hint="PAI = padrão. SUB = substituto que entra quando há dor (D1/D2) ou D3.">
            Tipo *
          </HelpLabel>
          <div className="flex gap-2">
            {(["PAI", "SUB"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onChange({ kind: k })}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-semibold transition",
                  form.kind === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <HelpLabel hint="Região anatômica de dor que esse exercício ATENDE (SUB) ou EVITA (PAI quando D2/D3).">
            Região de dor *
          </HelpLabel>
          <Select
            value={form.pain_region ?? "L0"}
            onValueChange={(v) => onChange({ pain_region: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIOES_DOR.map((r) => (
                <SelectItem key={r.cod} value={r.cod}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isSub && (
          <div className="space-y-1.5 sm:col-span-2">
            <HelpLabel hint="Vincule o SUB ao PAI que ele substitui no mesmo bloco/sessão.">
              Exercício PAI vinculado
            </HelpLabel>
            <Select
              value={form.parent_exercise_id ?? "none"}
              onValueChange={(v) =>
                onChange({ parent_exercise_id: v === "none" ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem vínculo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem vínculo —</SelectItem>
                {possibleParents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <HelpLabel hint="A=ímpar, B=par. Vazio = elegível em qualquer treino.">
            Treino (A/B)
          </HelpLabel>
          <Select
            value={form.treino_letra ?? "any"}
            onValueChange={(v) =>
              onChange({ treino_letra: v === "any" ? null : (v as any) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">— Ambos —</SelectItem>
              <SelectItem value="A">Treino A</SelectItem>
              <SelectItem value="B">Treino B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <HelpLabel hint="Bloco do protocolo (1, 2, 3, 4). Define progressão temporal.">
            Bloco do protocolo
          </HelpLabel>
          <Input
            type="number"
            min={1}
            max={4}
            value={form.bloco_protocolo ?? 1}
            onChange={(e) =>
              onChange({ bloco_protocolo: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
          <Switch
            checked={!!form.is_primary}
            onCheckedChange={(v) => onChange({ is_primary: v })}
          />
          <div>
            <Label className="text-sm">Exercício primário</Label>
            <p className="text-[11px] text-muted-foreground">
              Supino, Remada, Leg, Cadeira (entra cedo na ordem).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
          <Switch
            checked={!!form.is_fixed_base}
            onCheckedChange={(v) => onChange({ is_fixed_base: v })}
          />
          <div>
            <Label className="text-sm">Base fixa (MOB/FORT)</Label>
            <p className="text-[11px] text-muted-foreground">
              Sempre incluído na base de mobilidade ou fortalecimento iniciante.
            </p>
          </div>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Use sempre links do YouTube Shorts para demonstração rápida.">
            Vídeo (YouTube Shorts)
          </HelpLabel>
          <Input
            value={form.video_url ?? ""}
            onChange={(e) => onChange({ video_url: e.target.value })}
            placeholder="https://youtube.com/shorts/..."
          />
        </div>
      </div>

      <StepFooter
        onPrev={onPrev}
        onNext={onNext}
        nextDisabled={!valid}
        nextLabel="Ver Resumo"
      />
    </div>
  );
};
