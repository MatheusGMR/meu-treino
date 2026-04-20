import { Heart, Clock, Frown, Sparkles, Brain, Compass } from "lucide-react";

export type PerfilComportamental = "01" | "02" | "03" | "04" | "05" | "06";

interface ProfileOption {
  code: PerfilComportamental;
  title: string;
  description: string;
  icon: typeof Heart;
}

const PROFILES: ProfileOption[] = [
  { code: "01", title: "Empurrado pela dor", description: "Quero aliviar dores ou desconfortos que me incomodam.", icon: Heart },
  { code: "02", title: "Sem tempo", description: "Tenho rotina apertada e preciso treinar de forma eficiente.", icon: Clock },
  { code: "03", title: "Frustrado", description: "Já tentei várias vezes e não vi resultado — quero algo diferente.", icon: Frown },
  { code: "04", title: "Estreante", description: "Nunca treinei de verdade — quero começar com calma.", icon: Sparkles },
  { code: "05", title: "Sobrecarregado", description: "Trabalho/família/cabeça pesados — preciso de um respiro.", icon: Brain },
  { code: "06", title: "Deslocado", description: "Não me encaixo nos treinos comuns — quero algo do meu jeito.", icon: Compass },
];

interface Props {
  value: PerfilComportamental | "";
  onChange: (v: PerfilComportamental) => void;
}

export const BehavioralProfileSelector = ({ value, onChange }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {PROFILES.map((p) => {
      const Icon = p.icon;
      const selected = value === p.code;
      return (
        <button
          key={p.code}
          type="button"
          onClick={() => onChange(p.code)}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected
              ? "border-primary bg-primary/10 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
              : "border-border bg-card hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${selected ? "bg-primary/20" : "bg-muted"}`}>
              <Icon className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{p.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
);
