import { StepHeader, StepFooter } from "./WizardLayout";
import {
  BlockCode,
  EQUIP_MAP,
  EquipCode,
  SEG_MAP,
  SafetyCode,
} from "@/lib/protocol/exerciseTaxonomy";
import { cn } from "@/lib/utils";
import { Dumbbell, ShieldCheck } from "lucide-react";

interface Props {
  block: BlockCode;
  equip: EquipCode | "";
  onChange: (equip: EquipCode, safety: SafetyCode) => void;
  onPrev: () => void;
  onNext: () => void;
}

const SAFETY_TONE: Record<SafetyCode, string> = {
  S1: "bg-green-500/15 text-green-400 border-green-500/30",
  S2: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  S3: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  S4: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  S5: "bg-red-500/15 text-red-400 border-red-500/30",
};

export const StepEquipamento = ({ block, equip, onChange, onPrev, onNext }: Props) => {
  const opts = EQUIP_MAP[block] ?? [];
  const segInfo = equip ? SEG_MAP[equip] : null;

  return (
    <div>
      <StepHeader
        icon={<Dumbbell className="w-5 h-5" />}
        title="Equipamento"
        desc="O nível de segurança é definido automaticamente a partir do equipamento escolhido."
      />

      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Selecione o equipamento *
        </p>
        <div className="flex flex-wrap gap-2">
          {opts.map(([cod, nome]) => {
            const selected = equip === cod;
            return (
              <button
                key={cod}
                type="button"
                onClick={() => onChange(cod, SEG_MAP[cod].seg)}
                className={cn(
                  "px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {nome}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Segurança — preenchido automaticamente
        </p>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all",
            segInfo ? SAFETY_TONE[segInfo.seg] : "border-border bg-muted/40 text-muted-foreground"
          )}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-current shrink-0" />
          <span className={cn("text-sm flex-1", !segInfo && "italic")}>
            {segInfo ? segInfo.desc : "Selecione o equipamento acima"}
          </span>
          {segInfo && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-current/20">
              {segInfo.seg} — {segInfo.nome}
            </span>
          )}
        </div>
      </div>

      <StepFooter onPrev={onPrev} onNext={onNext} nextDisabled={!equip} />
    </div>
  );
};
