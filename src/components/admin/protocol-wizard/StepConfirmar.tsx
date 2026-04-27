import { Button } from "@/components/ui/button";
import { CheckCircle2, Save } from "lucide-react";
import { StepHeader } from "./WizardLayout";
import { ProtocolExercise } from "@/hooks/useProtocolBank";
import {
  BlockCode,
  EquipCode,
  LevelCode,
  SafetyCode,
  BLOCOS,
  EQUIP_MAP,
  NIVEIS,
  SEG_MAP,
} from "@/lib/protocol/exerciseTaxonomy";

interface Props {
  form: Partial<ProtocolExercise> & {
    movement_vector?: string | null;
    _block: BlockCode;
    _equip: EquipCode;
    _safety: SafetyCode;
    _level: LevelCode;
  };
  generatedId: string;
  onPrev: () => void;
  onSave: () => void;
  saving: boolean;
}

export const StepConfirmar = ({ form, generatedId, onPrev, onSave, saving }: Props) => {
  const blocoNome = BLOCOS.find((b) => b.cod === form._block)?.nome ?? form._block;
  const equipNome =
    (EQUIP_MAP[form._block] ?? []).find(([c]) => c === form._equip)?.[1] ?? form._equip;
  const segInfo = SEG_MAP[form._equip];
  const nivelNome = NIVEIS.find((n) => n.cod === form._level)?.nome ?? form._level;

  const items: { label: string; value: string; full?: boolean }[] = [
    { label: "Nome do Exercício", value: form.name ?? "—", full: true },
    { label: "Bloco", value: blocoNome },
    { label: "Equipamento", value: equipNome },
    { label: "Segurança", value: `${form._safety} — ${segInfo?.nome ?? ""}` },
    { label: "Nível JMP", value: `${form._level} — ${nivelNome}` },
    {
      label: "Nível do Cliente",
      value: ((form as any).level as string) ?? "—",
    },
    { label: "Impacto", value: ((form as any).impact_level as string) ?? "—" },
    { label: "Vetor", value: form.movement_vector ?? "—" },
    { label: "Tipo", value: form.kind ?? "—" },
    { label: "Região de dor", value: form.pain_region ?? "—" },
    { label: "Treino", value: form.treino_letra ?? "Ambos" },
    { label: "Bloco protocolo", value: String(form.bloco_protocolo ?? 1) },
    { label: "Grupo Muscular", value: form.primary_muscle ?? "—", full: true },
    {
      label: "Músculo secundário",
      value: ((form as any).secondary_muscle as string) || "—",
      full: true,
    },
  ];

  return (
    <div>
      <StepHeader
        icon={<CheckCircle2 className="w-5 h-5" />}
        title="Confirmar Cadastro"
        desc="Revise os dados antes de salvar. O ID foi gerado automaticamente."
      />

      <div className="rounded-2xl bg-foreground text-background p-6 text-center mb-5">
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5">
          ID gerado pelo sistema
        </div>
        <div className="font-mono text-2xl font-medium tracking-[3px]">{generatedId}</div>
        <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
          {[
            ["Bloco", form._block],
            ["Equip.", form._equip],
            ["Seg.", form._safety],
            ["Nível", form._level],
            ["Nº", generatedId.slice(-3)],
          ].map(([l, v]) => (
            <span
              key={l}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-background/10 opacity-70"
            >
              {l}: {v}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div
            key={it.label}
            className={`px-3 py-2.5 rounded-xl bg-muted/40 border border-border ${
              it.full ? "col-span-2" : ""
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
              {it.label}
            </div>
            <div className="text-sm font-semibold text-foreground break-words">{it.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button onClick={onSave} disabled={saving} className="w-full" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando…" : "Confirmar e Cadastrar Exercício"}
        </Button>
        <Button variant="outline" onClick={onPrev} disabled={saving}>
          Revisar dados
        </Button>
      </div>
    </div>
  );
};
