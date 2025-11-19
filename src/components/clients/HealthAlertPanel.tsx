import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Info,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface HealthWarning {
  severity: "warning" | "danger" | "critical";
  condition: string;
  message: string;
  affectedExercises: Array<{ id: string; name: string; group: string }>;
  recommendation: string;
}

interface HealthAlertPanelProps {
  riskLevel: "safe" | "caution" | "high-risk" | "critical";
  warnings: HealthWarning[];
  criticalIssues: HealthWarning[];
  recommendations: string[];
  acknowledgeRisks: boolean;
  onAcknowledgeChange: (value: boolean) => void;
}

const RISK_LEVEL_CONFIG = {
  safe: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    title: "Compatível",
  },
  caution: {
    icon: Info,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    title: "Atenção",
  },
  "high-risk": {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    title: "Alto Risco",
  },
  critical: {
    icon: ShieldAlert,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    title: "Crítico",
  },
};

export const HealthAlertPanel = ({
  riskLevel,
  warnings,
  criticalIssues,
  recommendations,
  acknowledgeRisks,
  onAcknowledgeChange,
}: HealthAlertPanelProps) => {
  const config = RISK_LEVEL_CONFIG[riskLevel];
  const Icon = config.icon;
  const allIssues = [...criticalIssues, ...warnings];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="p-4 space-y-4">
        <motion.div 
          className="flex items-center justify-between"
          layout
        >
          <h4 className="font-semibold">Compatibilidade</h4>
          <motion.div
            key={riskLevel}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Badge variant={riskLevel === "safe" ? "default" : "destructive"}>
              {config.title}
            </Badge>
          </motion.div>
        </motion.div>

        <motion.div
          key={riskLevel}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className={config.bgColor}>
            <motion.div
              animate={
                riskLevel === "critical" || riskLevel === "high-risk"
                  ? { rotate: [0, -10, 10, -10, 0] }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
            </motion.div>
            <AlertDescription className="text-sm">
              {riskLevel === "safe" && "Nenhuma restrição detectada"}
              {riskLevel === "caution" && `${allIssues.length} restrição(ões) leve(s)`}
              {riskLevel === "high-risk" &&
                `${allIssues.length} restrição(ões) importante(s)`}
              {riskLevel === "critical" && "Treino contraindicado"}
            </AlertDescription>
          </Alert>
        </motion.div>

      <AnimatePresence>
        {allIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="text-sm font-medium">Alertas:</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {allIssues.slice(0, 3).map((issue, idx) => (
                  <motion.div
                    key={`${issue.condition}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50"
                  >
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-destructive" />
                    <div className="flex-1">
                      <p className="font-medium">{issue.condition}</p>
                      <p className="text-muted-foreground">{issue.message}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {allIssues.length > 3 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground text-center"
                >
                  +{allIssues.length - 3} alertas adicionais
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="text-sm font-medium">Recomendações:</div>
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {recommendations.slice(0, 2).map((rec, idx) => (
                  <motion.p
                    key={`${rec}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="text-xs text-muted-foreground pl-4 relative"
                  >
                    <span className="absolute left-0">•</span>
                    {rec}
                  </motion.p>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(riskLevel === "high-risk" || riskLevel === "critical") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-2 border-t overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledgeRisks}
                onCheckedChange={onAcknowledgeChange}
              />
              <Label
                htmlFor="acknowledge"
                className="text-xs leading-tight cursor-pointer"
              >
                Estou ciente dos riscos e assumo responsabilidade pela atribuição deste
                treino
              </Label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </Card>
    </motion.div>
  );
};
