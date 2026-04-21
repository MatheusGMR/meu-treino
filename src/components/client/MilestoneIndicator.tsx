import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Sparkles } from "lucide-react";
import { useProtocolProgress } from "@/hooks/useProtocolProgress";

interface MilestoneIndicatorProps {
  clientId?: string;
  compact?: boolean;
}

const blockLabel = (n: number) => {
  if (n === 1) return "Bloco 1 — Mobilidade";
  if (n === 2) return "Bloco 2 — Fortalecimento";
  if (n === 3) return "Bloco 3 — Maturidade";
  return `Bloco ${n}`;
};

export const MilestoneIndicator = ({ clientId, compact = false }: MilestoneIndicatorProps) => {
  const { data, isLoading } = useProtocolProgress(clientId);

  if (isLoading || !data) return null;

  const { progress, nextMilestone } = data;
  const total = progress.total_sessoes ?? 36;
  const current = progress.sessao_atual ?? 0;
  const percent = Math.round((current / total) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">
          Sessão {current} de {total}
        </span>
        <span className="text-muted-foreground">· {blockLabel(progress.bloco_atual)}</span>
      </div>
    );
  }

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Protocolo Destravamento</p>
            <p className="text-xs text-muted-foreground">{blockLabel(progress.bloco_atual)}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {current}/{total}
        </Badge>
      </div>

      <Progress value={percent} className="h-2 mb-3" />

      {nextMilestone && (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-background/60">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-medium">Próximo marco (sessão {nextMilestone.session_number}):</span>{" "}
            {nextMilestone.title}
          </p>
        </div>
      )}
    </Card>
  );
};
