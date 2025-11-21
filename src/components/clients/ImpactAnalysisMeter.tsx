import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Activity, Moon, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImpactAnalysisMeterProps {
  distribution: {
    Baixo: number;
    Médio: number;
    Alto: number;
  };
  overallIntensity: 'light' | 'balanced' | 'intense';
  warnings: string[];
  score: number;
  totalExercises: number;
}

const INTENSITY_CONFIG = {
  light: {
    icon: Moon,
    label: "Leve",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Treino de baixa intensidade",
  },
  balanced: {
    icon: Activity,
    label: "Balanceado",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "Intensidade adequada",
  },
  intense: {
    icon: Zap,
    label: "Intenso",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Treino de alta intensidade",
  },
};

export const ImpactAnalysisMeter = ({
  distribution,
  overallIntensity,
  warnings,
  score,
  totalExercises,
}: ImpactAnalysisMeterProps) => {
  if (totalExercises === 0) {
    return (
      <Card className="p-4">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Análise de Intensidade
        </h4>
        <p className="text-xs text-muted-foreground">
          Adicione exercícios para ver a análise de impacto
        </p>
      </Card>
    );
  }

  const intensityConfig = INTENSITY_CONFIG[overallIntensity];
  const IntensityIcon = intensityConfig.icon;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Análise de Intensidade
        </h4>
        <Badge 
          variant="secondary" 
          className={`${intensityConfig.color} ${intensityConfig.bgColor}`}
        >
          <IntensityIcon className="h-3 w-3 mr-1" />
          {intensityConfig.label}
        </Badge>
      </div>

      {/* Score de intensidade */}
      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Score de Intensidade</span>
          <span className="text-lg font-bold">{score.toFixed(1)}/3.0</span>
        </div>
        <Progress value={(score / 3) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {intensityConfig.description}
        </p>
      </div>

      {/* Distribuição por nível de impacto */}
      <div className="space-y-3">
        {Object.entries(distribution).map(([level, percentage]) => {
          return (
            <motion.div
              key={level}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{level} Impacto</span>
                <span className="text-muted-foreground">
                  {Math.round(percentage)}%
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    level === 'Baixo' ? 'bg-blue-500' :
                    level === 'Médio' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t space-y-2"
          >
            {warnings.map((warning, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500"
              >
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
