import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface MuscleGroupDistribution {
  group: string;
  count: number;
  percentage: number;
  exercises: string[];
}

interface MuscleImpactMeterProps {
  muscleGroups: MuscleGroupDistribution[];
  totalExercises: number;
  warnings: string[];
  isBalanced: boolean;
}

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Peito: "hsl(var(--chart-1))",
  Costas: "hsl(var(--chart-2))",
  Pernas: "hsl(var(--chart-3))",
  Ombros: "hsl(var(--chart-4))",
  Bíceps: "hsl(var(--chart-5))",
  Tríceps: "hsl(var(--destructive))",
  Abdômen: "hsl(var(--primary))",
  Glúteos: "hsl(var(--secondary))",
  Panturrilha: "hsl(var(--accent))",
  Outro: "hsl(var(--muted))",
};

export const MuscleImpactMeter = ({
  muscleGroups,
  totalExercises,
  warnings,
  isBalanced,
}: MuscleImpactMeterProps) => {
  if (totalExercises === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Adicione exercícios para ver o impacto muscular
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Grupos Musculares</h4>
        <Badge variant={isBalanced ? "default" : "destructive"}>
          {isBalanced ? "Balanceado" : "Atenção"}
        </Badge>
      </div>

      <div className="space-y-3">
        {muscleGroups.map((mg) => (
          <div key={mg.group} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{mg.group}</span>
              <span className="text-muted-foreground">
                {mg.count} ex · {mg.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={mg.percentage}
              className="h-2"
              style={{
                // @ts-ignore
                "--progress-background": MUSCLE_GROUP_COLORS[mg.group],
              }}
            />
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="w-4 h-4" />
            Avisos de Desequilíbrio
          </div>
          {warnings.map((warning, idx) => (
            <p key={idx} className="text-xs text-muted-foreground pl-6">
              {warning}
            </p>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-2 border-t">
        Total: {totalExercises} exercício{totalExercises !== 1 ? "s" : ""}
      </div>
    </Card>
  );
};
