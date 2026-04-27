import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Grid3x3, Pencil, ShieldAlert } from "lucide-react";
import {
  VolumeOutput,
  useUpdateVolumeOutput,
  useVolumeOutputs,
} from "@/hooks/useVolumeOutputs";

const TEMPOS = ["T1", "T2", "T3"] as const;
const DORES = ["D0", "D1", "D2", "D3"] as const;
const DISPS = ["OK", "Moderada", "Comprometida"] as const;

const tempoLabel: Record<string, string> = {
  T1: "T1 — Curto",
  T2: "T2 — Médio",
  T3: "T3 — Longo",
};

export const VolumeMatrixTab = () => {
  const { data, isLoading } = useVolumeOutputs();
  const update = useUpdateVolumeOutput();
  const [editing, setEditing] = useState<VolumeOutput | null>(null);

  const map = useMemo(() => {
    const m = new Map<string, VolumeOutput>();
    (data ?? []).forEach((o) => {
      const k = `${o.tempo_cat}|${o.dor_cat}|${o.disposicao ?? ""}`;
      m.set(k, o);
    });
    return m;
  }, [data]);

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-primary" /> Matriz de Volume — 30 saídas (OUT-001 a OUT-030)
          </CardTitle>
          <CardDescription>
            Cada célula é uma combinação de Tempo × Dor × Disposição que define quantos exercícios,
            séries e repetições o motor usa em cada bloco (MOB / FORT / RESIST / ALONG).
            <br />
            <span className="text-xs">
              D3 ignora disposição (modo cirúrgico). Clique em uma saída para editar regras (mob/fort/resist/along).
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {TEMPOS.map((t) => (
        <Card key={t}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{tempoLabel[t]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 w-32">Dor / Disp.</th>
                    {DISPS.map((d) => (
                      <th key={d} className="text-left p-2">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DORES.map((dor) => (
                    <tr key={dor} className="border-b">
                      <td className="p-2 font-medium">{dor}</td>
                      {DISPS.map((disp) => {
                        // D3 ignora disposição: pega a única linha D3 daquele tempo
                        const key =
                          dor === "D3"
                            ? `${t}|D3|${disp}`
                            : `${t}|${dor}|${disp}`;
                        let out = map.get(key);
                        if (!out && dor === "D3") {
                          out = (data ?? []).find(
                            (o) => o.tempo_cat === t && o.dor_cat === "D3"
                          );
                        }

                        if (!out) {
                          return (
                            <td key={disp} className="p-2">
                              <span className="text-muted-foreground">—</span>
                            </td>
                          );
                        }

                        return (
                          <td key={disp} className="p-2 align-top">
                            <button
                              onClick={() => setEditing(out!)}
                              className="w-full text-left rounded-md border bg-card hover:bg-accent/40 transition p-2 space-y-1"
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                  {out.output_id}
                                </Badge>
                                {out.modo_d3 && (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="destructive" className="text-[10px] gap-1">
                                          <ShieldAlert className="w-3 h-3" /> D3
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>Modo cirúrgico: remove tudo do local de dor.</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {out.n_ex_min}-{out.n_ex_max} ex · {out.series_min}-{out.series_max}×{out.reps}
                              </p>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {editing && (
        <EditOutputDialog
          output={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            await update.mutateAsync({ output_id: editing.output_id, ...patch });
            setEditing(null);
          }}
          saving={update.isPending}
        />
      )}
    </div>
  );
};

const EditOutputDialog = ({
  output,
  onClose,
  onSave,
  saving,
}: {
  output: VolumeOutput;
  onClose: () => void;
  onSave: (patch: Partial<VolumeOutput>) => void;
  saving: boolean;
}) => {
  const [form, setForm] = useState<VolumeOutput>(output);

  const updateRule = (key: "mob_rule" | "fort_rule" | "resist_rule" | "along_rule", value: string) => {
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      setForm({ ...form, [key]: parsed });
    } catch {
      // ignora parse error em digitação parcial
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Editar {output.output_id}
          </DialogTitle>
          <DialogDescription>
            Tempo {output.tempo_cat} · Dor {output.dor_cat} · Disposição {output.disposicao ?? "—"}
            {output.modo_d3 && " · Modo D3 cirúrgico"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label>n_ex_min</Label>
            <Input type="number" value={form.n_ex_min} onChange={(e) => setForm({ ...form, n_ex_min: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>n_ex_max</Label>
            <Input type="number" value={form.n_ex_max} onChange={(e) => setForm({ ...form, n_ex_max: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>series_min</Label>
            <Input type="number" value={form.series_min} onChange={(e) => setForm({ ...form, series_min: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>series_max</Label>
            <Input type="number" value={form.series_max} onChange={(e) => setForm({ ...form, series_max: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>reps</Label>
            <Input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })} />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-md border p-3">
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          <Label>Ativo</Label>
          <div className="ml-auto flex items-center gap-2">
            <Switch checked={form.modo_d3} onCheckedChange={(v) => setForm({ ...form, modo_d3: v })} />
            <Label>Modo D3 (cirúrgico)</Label>
          </div>
        </div>

        <RuleField
          label="Regra MOB (JSON)"
          hint='Ex.: {"base_fixos":3,"local_qty":1}'
          value={form.mob_rule}
          onChange={(v) => updateRule("mob_rule", v)}
        />
        <RuleField
          label="Regra FORT (JSON)"
          hint='Ex.: {"iniciante_fixos":3,"local_qty":1}'
          value={form.fort_rule}
          onChange={(v) => updateRule("fort_rule", v)}
        />
        <RuleField
          label="Regra RESIST (JSON)"
          hint='strategy: PAI | SUB_PRIORITY | SUB_MANDATORY | REMOVE_LOCAL'
          value={form.resist_rule}
          onChange={(v) => updateRule("resist_rule", v)}
        />
        <RuleField
          label="Regra ALONG (JSON)"
          hint='Ex.: {"dor_qty":1,"musculatura_treinada":2}'
          value={form.along_rule}
          onChange={(v) => updateRule("along_rule", v)}
        />

        <div className="space-y-1">
          <Label>Notas</Label>
          <Textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RuleField = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: any;
  onChange: (v: string) => void;
}) => {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        rows={3}
        className="font-mono text-xs"
      />
    </div>
  );
};
