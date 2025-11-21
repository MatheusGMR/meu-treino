import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface WeeklyVolumeCardProps {
  currentSets: number;
  recommendedSets: { min: number; max: number; optimal: number };
  currentSessions: number;
  suggestedSessions: string;
  currentTime: number;
  recommendedTime: { min: number; max: number };
}

export const WeeklyVolumeCard = ({
  currentSets,
  recommendedSets,
  currentSessions,
  suggestedSessions,
  currentTime,
  recommendedTime
}: WeeklyVolumeCardProps) => {
  const setsPercentage = (currentSets / recommendedSets.optimal) * 100;
  const timePercentage = (currentTime / recommendedTime.min) * 100;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Volume Semanal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tabela */}
        <div className="text-xs space-y-2">
          {/* Séries */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Séries totais</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{currentSets}</span>
              <span className="text-muted-foreground">/ {recommendedSets.min}–{recommendedSets.max}</span>
              {currentSets >= recommendedSets.min && currentSets <= recommendedSets.max ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Sessões */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sessões</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{currentSessions}</span>
              <span className="text-muted-foreground">/ {suggestedSessions}</span>
            </div>
          </div>

          {/* Tempo Semanal */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tempo semanal</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{currentTime} min</span>
              <span className="text-muted-foreground">/ {recommendedTime.min}–{recommendedTime.max} min</span>
              {currentTime >= recommendedTime.min && currentTime <= recommendedTime.max ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-1 pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso de volume</span>
            <span>{Math.round(setsPercentage)}%</span>
          </div>
          <Progress value={Math.min(setsPercentage, 100)} />
        </div>
      </CardContent>
    </Card>
  );
};
