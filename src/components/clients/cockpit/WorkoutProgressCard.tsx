import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface WorkoutProgressCardProps {
  progress: {
    sessions: { current: number; target: number };
    sets: { current: number; target: number };
    time: { current: number; target: number };
    daysScheduled: number;
    completionPercentage: number;
  };
}

export const WorkoutProgressCard = ({ progress }: WorkoutProgressCardProps) => {
  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Progresso do Treino</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Sessões */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Sessões:</span>
          <span className="font-medium">
            {progress.sessions.current}/{progress.sessions.target}
          </span>
        </div>

        {/* Séries */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Séries:</span>
          <span className="font-medium">
            {progress.sets.current}/{progress.sets.target}
          </span>
        </div>

        {/* Tempo Total */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Tempo total:</span>
          <span className="font-medium">
            {progress.time.current}/{progress.time.target} min
          </span>
        </div>

        {/* Dias de Treino */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Dias de treino montados:</span>
          <span className="font-medium">{progress.daysScheduled}</span>
        </div>

        {/* % de Meta Atingida */}
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">% de meta atingida:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{progress.completionPercentage}%</span>
              {progress.completionPercentage === 100 && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
          </div>
          <Progress value={progress.completionPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
