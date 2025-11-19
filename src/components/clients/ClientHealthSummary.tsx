import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Heart, Target, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientHealthSummaryProps {
  medicalConditions?: string | null;
  goals?: string | null;
  primaryGoal?: string | null;
  secondaryGoals?: string[] | null;
  activityLevel?: string | null;
}

export const ClientHealthSummary = ({
  medicalConditions,
  goals,
  primaryGoal,
  secondaryGoals,
  activityLevel,
}: ClientHealthSummaryProps) => {
  const displayGoals = goals || primaryGoal;
  const hasHealthInfo = medicalConditions || displayGoals || activityLevel;

  if (!hasHealthInfo) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Perfil do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Condições de Saúde */}
        {medicalConditions && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              Condições de Saúde
            </Label>
            <p className="text-sm leading-relaxed bg-red-50 dark:bg-red-950/20 p-2 rounded-md border border-red-200 dark:border-red-900/30">
              {medicalConditions}
            </p>
          </div>
        )}

        {/* Objetivos */}
        {displayGoals && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              Objetivos
            </Label>
            <p className="text-sm leading-relaxed bg-blue-50 dark:bg-blue-950/20 p-2 rounded-md border border-blue-200 dark:border-blue-900/30">
              {displayGoals}
            </p>
            {secondaryGoals && secondaryGoals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {secondaryGoals.map((goal, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs font-normal"
                  >
                    {goal}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recomendações da Anamnese */}
        {activityLevel && (
          <div className="space-y-1.5 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">
              Nível de Atividade
            </Label>
            <Badge variant="outline" className="text-xs">
              {activityLevel}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
