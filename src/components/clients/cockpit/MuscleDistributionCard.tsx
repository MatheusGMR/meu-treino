import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface MuscleGoal {
  group: string;
  current: number;
  ideal: { min: number; max: number } | undefined;
  status: 'optimal' | 'below' | 'above' | 'restricted';
  isPriority: boolean;
  isRestricted: boolean;
}

interface MuscleDistributionCardProps {
  goals: MuscleGoal[];
}

export const MuscleDistributionCard = ({ goals }: MuscleDistributionCardProps) => {
  const hasGoals = goals && goals.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Distribuição Muscular</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasGoals ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Adicione exercícios para ver a distribuição muscular
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {goals.map((goal) => (
              <div key={goal.group} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{goal.group}</span>
                    {goal.isPriority && <span className="text-xs text-primary">⭐</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{goal.current}</span>
                    {goal.ideal && (
                      <span className="text-muted-foreground">
                        / {goal.ideal.min}–{goal.ideal.max}
                      </span>
                    )}
                    {goal.status === 'optimal' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {goal.status === 'below' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    {goal.status === 'above' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    {goal.status === 'restricted' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                {goal.ideal && (
                  <Progress 
                    value={Math.min((goal.current / goal.ideal.max) * 100, 100)} 
                    className="h-1.5"
                  />
                )}
                {goal.isRestricted && (
                  <p className="text-xs text-destructive">⚠️ Carga leve recomendada</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
