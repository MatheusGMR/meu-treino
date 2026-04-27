import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepHeader, StepFooter } from "./WizardLayout";
import { Pencil } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export const StepNome = ({ value, onChange, onNext }: Props) => {
  const valid = value.trim().length >= 3;
  return (
    <div>
      <StepHeader
        icon={<Pencil className="w-5 h-5" />}
        title="Nome do Exercício"
        desc="Escreva o nome em português. Evite nomes em inglês — a plataforma fala a língua do aluno."
      />
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Nome *
        </Label>
        <Input
          autoFocus
          value={value}
          maxLength={100}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valid && onNext()}
          placeholder="Ex: Supino Máquina Inclinado"
        />
        <div className="flex justify-between text-xs">
          <span className={valid ? "text-primary" : "text-muted-foreground"}>
            {valid ? "✓ Nome válido" : "Mínimo 3 caracteres"}
          </span>
          <span className="text-muted-foreground">{value.length}/100</span>
        </div>
      </div>
      <StepFooter onNext={onNext} nextDisabled={!valid} />
    </div>
  );
};
