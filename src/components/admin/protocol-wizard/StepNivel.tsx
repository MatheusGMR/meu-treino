import { StepHeader, StepFooter } from "./WizardLayout";
import { NIVEIS, LevelCode } from "@/lib/protocol/exerciseTaxonomy";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface Props {
  value: LevelCode | "";
  onChange: (l: LevelCode) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const StepNivel = ({ value, onChange, onPrev, onNext }: Props) => {
  return (
    <div>
      <StepHeader
        icon={<BarChart3 className="w-5 h-5" />}
        title="Nível de Dificuldade"
        desc="Define quando esse exercício pode ser prescrito. IN3 e AV exigem liberação manual do treinador."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {NIVEIS.map((n) => {
          const selected = value === n.cod;
          return (
            <button
              key={n.cod}
              type="button"
              onClick={() => onChange(n.cod)}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all",
                selected
                  ? "border-primary bg-primary/10 -translate-y-0.5 shadow-md shadow-primary/20"
                  : "border-border bg-muted/30 hover:border-primary/40"
              )}
            >
              <div className="font-mono text-base font-bold text-primary">{n.cod}</div>
              <div className="text-xs font-semibold text-foreground">{n.nome}</div>
              <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{n.desc}</div>
            </button>
          );
        })}
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} nextDisabled={!value} />
    </div>
  );
};
