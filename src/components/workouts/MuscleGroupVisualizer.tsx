import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface MuscleGroupDistribution {
  group: string;
  count: number;
  percentage: number;
  exercises: string[];
}

interface MuscleGroupVisualizerProps {
  muscleGroups: MuscleGroupDistribution[];
  totalExercises: number;
  warnings?: string[];
  isBalanced?: boolean;
}

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  "Peito": "bg-red-500",
  "Costas": "bg-blue-500",
  "Pernas": "bg-green-500",
  "Ombros": "bg-yellow-500",
  "Bíceps": "bg-purple-500",
  "Tríceps": "bg-pink-500",
  "Abdômen": "bg-orange-500",
  "Glúteos": "bg-teal-500",
  "Panturrilha": "bg-cyan-500",
  "Outro": "bg-gray-500",
};

export const MuscleGroupVisualizer = ({
  muscleGroups,
  totalExercises,
  warnings = [],
  isBalanced = true,
}: MuscleGroupVisualizerProps) => {
  if (totalExercises === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Adicione exercícios para ver a distribuição muscular
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Impacto Muscular</h3>
        <Badge variant={isBalanced ? "default" : "destructive"}>
          {isBalanced ? "Balanceado" : "Atenção"}
        </Badge>
      </div>

      {/* Silhueta do corpo - versão simplificada */}
      <div className="relative h-64 bg-muted/30 rounded-lg flex items-center justify-center">
        <svg viewBox="0 0 200 300" className="h-full w-auto">
          {/* Cabeça */}
          <circle cx="100" cy="30" r="20" className="fill-muted stroke-border" strokeWidth="2" />
          
          {/* Tronco */}
          <rect x="70" y="50" width="60" height="80" rx="10" className="fill-muted stroke-border" strokeWidth="2" />
          
          {/* Ombros */}
          <circle cx="60" cy="60" r="15" className={muscleGroups.find(mg => mg.group === "Ombros") ? MUSCLE_GROUP_COLORS["Ombros"] : "fill-muted"} opacity="0.7" />
          <circle cx="140" cy="60" r="15" className={muscleGroups.find(mg => mg.group === "Ombros") ? MUSCLE_GROUP_COLORS["Ombros"] : "fill-muted"} opacity="0.7" />
          
          {/* Peito */}
          <rect x="80" y="60" width="40" height="30" rx="5" className={muscleGroups.find(mg => mg.group === "Peito") ? MUSCLE_GROUP_COLORS["Peito"] : "fill-muted"} opacity="0.7" />
          
          {/* Abdômen */}
          <rect x="85" y="95" width="30" height="30" rx="3" className={muscleGroups.find(mg => mg.group === "Abdômen") ? MUSCLE_GROUP_COLORS["Abdômen"] : "fill-muted"} opacity="0.7" />
          
          {/* Braços */}
          <rect x="50" y="70" width="15" height="60" rx="7" className={muscleGroups.find(mg => mg.group === "Bíceps" || mg.group === "Tríceps") ? MUSCLE_GROUP_COLORS["Bíceps"] : "fill-muted"} opacity="0.7" />
          <rect x="135" y="70" width="15" height="60" rx="7" className={muscleGroups.find(mg => mg.group === "Bíceps" || mg.group === "Tríceps") ? MUSCLE_GROUP_COLORS["Bíceps"] : "fill-muted"} opacity="0.7" />
          
          {/* Pernas */}
          <rect x="75" y="135" width="20" height="70" rx="10" className={muscleGroups.find(mg => mg.group === "Pernas" || mg.group === "Glúteos") ? MUSCLE_GROUP_COLORS["Pernas"] : "fill-muted"} opacity="0.7" />
          <rect x="105" y="135" width="20" height="70" rx="10" className={muscleGroups.find(mg => mg.group === "Pernas" || mg.group === "Glúteos") ? MUSCLE_GROUP_COLORS["Pernas"] : "fill-muted"} opacity="0.7" />
          
          {/* Panturrilhas */}
          <rect x="77" y="210" width="16" height="40" rx="8" className={muscleGroups.find(mg => mg.group === "Panturrilha") ? MUSCLE_GROUP_COLORS["Panturrilha"] : "fill-muted"} opacity="0.7" />
          <rect x="107" y="210" width="16" height="40" rx="8" className={muscleGroups.find(mg => mg.group === "Panturrilha") ? MUSCLE_GROUP_COLORS["Panturrilha"] : "fill-muted"} opacity="0.7" />
        </svg>
      </div>

      {/* Distribuição por grupo muscular */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Distribuição por Grupo Muscular</p>
        {muscleGroups.map((mg) => (
          <TooltipProvider key={mg.group}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-pointer">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${MUSCLE_GROUP_COLORS[mg.group]}`} />
                      <span>{mg.group}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {mg.count} ex. ({mg.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={mg.percentage} className="h-2" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-semibold">{mg.group}</p>
                  <ul className="text-xs space-y-0.5">
                    {mg.exercises.map((ex, idx) => (
                      <li key={idx}>• {ex}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Alertas de Balanceamento</span>
          </div>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resumo */}
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Total: {totalExercises} exercícios em {muscleGroups.length} grupos musculares
        </p>
      </div>
    </Card>
  );
};
