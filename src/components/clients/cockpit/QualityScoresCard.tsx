import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface QualityScoresCardProps {
  scores: {
    volume: number;
    variety: number;
    balance: number;
    intensity: number;
    goalAlignment: number;
    overall: number;
  };
  hasExercises: boolean;
}

export const QualityScoresCard = ({ scores, hasExercises }: QualityScoresCardProps) => {
  const getColorClass = (score: number, hasExercises: boolean) => {
    if (!hasExercises) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, hasExercises: boolean) => {
    if (!hasExercises) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Indicadores de Qualidade</span>
          <span className={cn("text-2xl font-bold", getColorClass(scores.overall, hasExercises))}>
            {scores.overall}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {!hasExercises && (
          <Alert className="mb-3">
            <AlertDescription className="text-xs">
              Os indicadores serão calculados conforme você adicionar exercícios ao treino
            </AlertDescription>
          </Alert>
        )}

        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume</span>
            <span className={cn("font-medium", getColorClass(scores.volume, hasExercises))}>
              {scores.volume}/100
            </span>
          </div>
          <Progress value={scores.volume} className={getProgressColor(scores.volume, hasExercises)} />
        </div>

        {/* Variedade */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Variedade Muscular</span>
            <span className={cn("font-medium", getColorClass(scores.variety, hasExercises))}>
              {scores.variety}/100
            </span>
          </div>
          <Progress value={scores.variety} className={getProgressColor(scores.variety, hasExercises)} />
        </div>

        {/* Equilíbrio */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equilíbrio</span>
            <span className={cn("font-medium", getColorClass(scores.balance, hasExercises))}>
              {scores.balance}/100
            </span>
          </div>
          <Progress value={scores.balance} className={getProgressColor(scores.balance, hasExercises)} />
        </div>

        {/* Intensidade */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Intensidade</span>
            <span className={cn("font-medium", getColorClass(scores.intensity, hasExercises))}>
              {scores.intensity}/100
            </span>
          </div>
          <Progress value={scores.intensity} className={getProgressColor(scores.intensity, hasExercises)} />
        </div>

        {/* Alinhamento com Objetivo */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Alinhamento</span>
            <span className={cn("font-medium", getColorClass(scores.goalAlignment, hasExercises))}>
              {scores.goalAlignment}/100
            </span>
          </div>
          <Progress value={scores.goalAlignment} className={getProgressColor(scores.goalAlignment, hasExercises)} />
        </div>
      </CardContent>
    </Card>
  );
};
