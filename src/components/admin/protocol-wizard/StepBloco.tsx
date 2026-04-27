import { StepHeader, StepFooter } from "./WizardLayout";
import { BLOCOS, BlockCode } from "@/lib/protocol/exerciseTaxonomy";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

interface Props {
  value: BlockCode | "";
  onChange: (b: BlockCode) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const StepBloco = ({ value, onChange, onPrev, onNext }: Props) => {
  return (
    <div>
      <StepHeader
        icon={<LayoutGrid className="w-5 h-5" />}
        title="Bloco do Exercício"
        desc="Em qual bloco da sessão esse exercício será usado?"
      />
      <div className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Selecione o bloco *
        </p>
        <div className="flex flex-wrap gap-2">
          {BLOCOS.map((b) => {
            const selected = value === b.cod;
            return (
              <button
                key={b.cod}
                type="button"
                onClick={() => onChange(b.cod)}
                className={cn(
                  "px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                    : "bg-muted/40 text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                <span className="mr-1.5">{b.emoji}</span>
                {b.nome}
              </button>
            );
          })}
        </div>
        {value && (
          <p className="text-xs text-primary">
            ✓ {BLOCOS.find((b) => b.cod === value)?.nome} selecionado
          </p>
        )}
      </div>
      <StepFooter onPrev={onPrev} onNext={onNext} nextDisabled={!value} />
    </div>
  );
};
