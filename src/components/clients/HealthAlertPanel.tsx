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
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Compatibilidade</h4>
        <Badge variant={riskLevel === "safe" ? "default" : "destructive"}>
          {config.title}
        </Badge>
      </div>

      <Alert className={config.bgColor}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertDescription className="text-sm">
          {riskLevel === "safe" && "Nenhuma restrição detectada"}
          {riskLevel === "caution" && `${allIssues.length} restrição(ões) leve(s)`}
          {riskLevel === "high-risk" &&
            `${allIssues.length} restrição(ões) importante(s)`}
          {riskLevel === "critical" && "Treino contraindicado"}
        </AlertDescription>
      </Alert>

      {allIssues.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Alertas:</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {allIssues.slice(0, 3).map((issue, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50"
              >
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium">{issue.condition}</p>
                  <p className="text-muted-foreground">{issue.message}</p>
                </div>
              </div>
            ))}
            {allIssues.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{allIssues.length - 3} alertas adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Recomendações:</div>
          <div className="space-y-1">
            {recommendations.slice(0, 2).map((rec, idx) => (
              <p key={idx} className="text-xs text-muted-foreground pl-4 relative">
                <span className="absolute left-0">•</span>
                {rec}
              </p>
            ))}
          </div>
        </div>
      )}

      {(riskLevel === "high-risk" || riskLevel === "critical") && (
        <div className="pt-2 border-t">
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
        </div>
      )}
    </Card>
  );
};
