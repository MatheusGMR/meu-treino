import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 space-y-4">
        <motion.div 
          className="flex items-center justify-between"
          layout
        >
          <h4 className="font-semibold">Grupos Musculares</h4>
          <motion.div
            key={isBalanced ? "balanced" : "warning"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant={isBalanced ? "default" : "destructive"}>
              {isBalanced ? "Balanceado" : "Atenção"}
            </Badge>
          </motion.div>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {muscleGroups.map((mg, index) => (
              <motion.div
                key={mg.group}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{mg.group}</span>
                  <motion.span 
                    className="text-muted-foreground"
                    key={`${mg.group}-${mg.count}-${mg.percentage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {mg.count} ex · {mg.percentage.toFixed(0)}%
                  </motion.span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="origin-left"
                >
                  <Progress
                    value={mg.percentage}
                    className="h-2"
                    style={{
                      // @ts-ignore
                      "--progress-background": MUSCLE_GROUP_COLORS[mg.group],
                    }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 pt-2 border-t overflow-hidden"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertCircle className="w-4 h-4" />
                </motion.div>
                Avisos de Desequilíbrio
              </div>
              <AnimatePresence mode="popLayout">
                {warnings.map((warning, idx) => (
                  <motion.p
                    key={`${warning}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="text-xs text-muted-foreground pl-6"
                  >
                    {warning}
                  </motion.p>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="text-xs text-muted-foreground pt-2 border-t"
          key={totalExercises}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Total: {totalExercises} exercício{totalExercises !== 1 ? "s" : ""}
        </motion.div>
      </Card>
    </motion.div>
  );
};
