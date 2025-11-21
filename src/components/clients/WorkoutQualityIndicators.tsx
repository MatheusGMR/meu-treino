import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface WorkoutQualityIndicatorsProps {
  totalExercises: number;
  muscleGroupsCount: number;
  isBalanced: boolean;
  overallIntensity?: 'light' | 'balanced' | 'intense';
  profileAligned?: boolean;
  profileName?: string | null;
}

export const WorkoutQualityIndicators = ({
  totalExercises,
  muscleGroupsCount,
  isBalanced,
  overallIntensity,
  profileAligned,
  profileName,
}: WorkoutQualityIndicatorsProps) => {
  const indicators = [
    {
      label: "Volume adequado",
      status: totalExercises >= 6 && totalExercises <= 12 ? "good" : "warning",
      icon: totalExercises >= 6 && totalExercises <= 12 ? CheckCircle2 : AlertTriangle,
      message: totalExercises >= 6 && totalExercises <= 12 
        ? "Quantidade ideal de exercícios" 
        : totalExercises < 6 
          ? "Considere adicionar mais exercícios" 
          : "Treino pode ser muito longo",
    },
    {
      label: "Variedade muscular",
      status: muscleGroupsCount >= 3 ? "good" : "info",
      icon: muscleGroupsCount >= 3 ? CheckCircle2 : Info,
      message: muscleGroupsCount >= 3
        ? `${muscleGroupsCount} grupos trabalhados`
        : "Considere trabalhar mais grupos musculares",
    },
    {
      label: "Equilíbrio",
      status: isBalanced ? "good" : "warning",
      icon: isBalanced ? CheckCircle2 : AlertTriangle,
      message: isBalanced 
        ? "Distribuição equilibrada" 
        : "Alguns grupos estão sobrecarregados",
    },
    ...(overallIntensity ? [{
      label: "Intensidade",
      status: overallIntensity === 'balanced' ? "good" : "info",
      icon: overallIntensity === 'balanced' ? CheckCircle2 : Info,
      message: 
        overallIntensity === 'balanced' ? "Intensidade equilibrada" :
        overallIntensity === 'light' ? "Treino leve - considere aumentar intensidade" :
        "Treino intenso - monitore recuperação",
    }] : []),
    ...(profileName ? [{
      label: "Alinhamento com Perfil",
      status: profileAligned ? "good" : "warning",
      icon: profileAligned ? CheckCircle2 : AlertTriangle,
      message: profileAligned 
        ? `✅ Adequado para ${profileName}`
        : `⚠️ Revisar adequação para ${profileName}`,
    }] : []),
  ];

  return (
    <Card className="p-4">
      <h4 className="font-semibold text-sm mb-3">Indicadores de Qualidade</h4>
      <div className="space-y-2">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          return (
            <div key={indicator.label} className="flex items-start gap-2 text-xs">
              <Icon
                className={`w-4 h-4 mt-0.5 ${
                  indicator.status === "good"
                    ? "text-green-500"
                    : indicator.status === "warning"
                    ? "text-yellow-500"
                    : "text-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="font-medium">{indicator.label}</p>
                <p className="text-muted-foreground">{indicator.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
