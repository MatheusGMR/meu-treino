import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Info, Sparkles } from "lucide-react";
import { StepHeader, StepFooter } from "./WizardLayout";
import { LevelCode, mapJmpLevelToClientLevel } from "@/lib/protocol/exerciseTaxonomy";

interface ContextValue {
  level?: string | null;
  impact_level?: string | null;
  contraindication?: string | null;
  short_description?: string | null;
  secondary_muscle?: string | null;
  coaching_cues?: string[] | null;
}

interface Props {
  value: ContextValue;
  jmpLevel: LevelCode | "";
  onChange: (patch: ContextValue) => void;
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

export const StepContexto = ({ value, jmpLevel, onChange, onPrev, onNext }: Props) => {
  // Nível visível do cliente — derivado automaticamente do código JMP do passo anterior,
  // mas permitindo ajuste manual se necessário.
  const derivedClientLevel = jmpLevel
    ? mapJmpLevelToClientLevel(jmpLevel as LevelCode)
    : "Iniciante";
  const effectiveLevel = value.level ?? derivedClientLevel;

  const cuesText = (value.coaching_cues ?? []).join("\n");

  return (
    <div>
      <StepHeader
        icon={<Sparkles className="w-5 h-5" />}
        title="Contexto para Cliente e Agente"
        desc="Esses campos garantem que o exercício apareça corretamente para o aluno e que os agentes da plataforma tenham contexto completo."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nível do cliente */}
        <div className="space-y-1.5">
          <HelpLabel hint="Nível visível para o cliente. Sugerido a partir do código JMP, mas pode ser ajustado.">
            Nível do Cliente *
          </HelpLabel>
          <Select
            value={effectiveLevel}
            onValueChange={(v) => onChange({ level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Iniciante">Iniciante</SelectItem>
              <SelectItem value="Intermediário">Intermediário</SelectItem>
              <SelectItem value="Avançado">Avançado</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Sugerido pelo código JMP <strong>{jmpLevel || "—"}</strong> →{" "}
            <strong>{derivedClientLevel}</strong>
          </p>
        </div>

        {/* Impacto */}
        <div className="space-y-1.5">
          <HelpLabel hint="Impacto biomecânico do exercício — usado pelo agente para evitar sobrecarga em clientes com dor.">
            Nível de impacto *
          </HelpLabel>
          <Select
            value={value.impact_level ?? "Baixo"}
            onValueChange={(v) => onChange({ impact_level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baixo">Baixo (sem impacto axial)</SelectItem>
              <SelectItem value="Médio">Médio (carga moderada)</SelectItem>
              <SelectItem value="Alto">Alto (impacto/saltos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Músculo secundário */}
        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Sinergistas e estabilizadores. Importante para a análise muscular do treino.">
            Músculo secundário
          </HelpLabel>
          <Input
            value={value.secondary_muscle ?? ""}
            onChange={(e) => onChange({ secondary_muscle: e.target.value })}
            placeholder="Ex: Tríceps, Deltóide Anterior, Core"
          />
        </div>

        {/* Descrição curta */}
        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Frase curta exibida ao cliente durante a execução do treino.">
            Descrição curta (cliente vê)
          </HelpLabel>
          <Textarea
            value={value.short_description ?? ""}
            onChange={(e) => onChange({ short_description: e.target.value })}
            placeholder="Ex: Empurra a barra do peito até estender os braços, controlando a descida."
            rows={2}
          />
        </div>

        {/* Cues do treinador */}
        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Pontos de atenção para o agente reforçar durante a execução. Um por linha.">
            Coaching cues (1 por linha)
          </HelpLabel>
          <Textarea
            value={cuesText}
            onChange={(e) =>
              onChange({
                coaching_cues: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"Ex:\nMantenha as escápulas retraídas\nNão trave os cotovelos no topo"}
            rows={3}
          />
        </div>

        {/* Contraindicação */}
        <div className="space-y-1.5 sm:col-span-2">
          <HelpLabel hint="Restrições médicas/condições para o agente evitar prescrever este exercício.">
            Contraindicação
          </HelpLabel>
          <Textarea
            value={value.contraindication ?? ""}
            onChange={(e) => onChange({ contraindication: e.target.value })}
            placeholder="Ex: Evitar em casos de dor lombar aguda ou hérnia discal não tratada."
            rows={2}
          />
        </div>
      </div>

      <StepFooter onPrev={onPrev} onNext={onNext} nextLabel="Ver Resumo" />
    </div>
  );
};
