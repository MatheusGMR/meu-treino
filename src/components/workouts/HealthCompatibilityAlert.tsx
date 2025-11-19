import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, AlertTriangle, ShieldAlert, CheckCircle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HealthWarning {
  severity: "warning" | "danger" | "critical";
  condition: string;
  message: string;
  affectedExercises: Array<{ id: string; name: string; group: string }>;
  recommendation: string;
}

interface HealthCompatibilityAlertProps {
  compatible: boolean;
  warnings: HealthWarning[];
  criticalIssues: HealthWarning[];
  recommendations: string[];
  riskLevel: "safe" | "caution" | "high-risk" | "critical";
}

const RISK_LEVEL_CONFIG = {
  safe: {
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    title: "Treino Compatível",
    description: "Nenhuma restrição médica detectada.",
  },
  caution: {
    icon: Info,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    title: "Atenção Recomendada",
    description: "Algumas restrições leves foram detectadas.",
  },
  "high-risk": {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    title: "Alto Risco",
    description: "Restrições importantes detectadas. Supervisão necessária.",
  },
  critical: {
    icon: ShieldAlert,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    title: "Treino Contraindicado",
    description: "Condições críticas detectadas. Não atribuir sem liberação médica.",
  },
};

const SEVERITY_BADGES = {
  warning: { variant: "secondary" as const, label: "Atenção" },
  danger: { variant: "destructive" as const, label: "Risco" },
  critical: { variant: "destructive" as const, label: "CRÍTICO" },
};

export const HealthCompatibilityAlert = ({
  compatible,
  warnings,
  criticalIssues,
  recommendations,
  riskLevel,
}: HealthCompatibilityAlertProps) => {
  const config = RISK_LEVEL_CONFIG[riskLevel];
  const Icon = config.icon;
  const allIssues = [...criticalIssues, ...warnings];

  if (riskLevel === "safe") {
    return (
      <Alert className={config.bgColor}>
        <Icon className={`h-4 w-4 ${config.color}`} />
        <AlertTitle>{config.title}</AlertTitle>
        <AlertDescription>{config.description}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={config.bgColor}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertTitle className="flex items-center justify-between">
        <span>{config.title}</span>
        <Badge variant={riskLevel === "critical" ? "destructive" : "secondary"}>
          {allIssues.length} {allIssues.length === 1 ? "alerta" : "alertas"}
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{config.description}</p>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2">
              Ver Detalhes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                Análise de Compatibilidade de Saúde
              </DialogTitle>
              <DialogDescription>
                Análise detalhada das condições médicas do cliente em relação ao treino
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Issues Críticos */}
                {criticalIssues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-destructive flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4" />
                      Restrições Críticas ({criticalIssues.length})
                    </h3>
                    {criticalIssues.map((issue, idx) => (
                      <div key={idx} className="border border-destructive rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{issue.condition}</p>
                            <p className="text-sm text-muted-foreground">{issue.message}</p>
                          </div>
                          <Badge variant="destructive">CRÍTICO</Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Exercícios afetados:</p>
                          <ul className="text-sm space-y-1">
                            {issue.affectedExercises.map((ex) => (
                              <li key={ex.id} className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-destructive" />
                                <span>{ex.name}</span>
                                <Badge variant="outline" className="text-xs">{ex.group}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {issue.recommendation && (
                          <div className="bg-muted p-3 rounded text-sm">
                            <p className="font-medium mb-1">Recomendação:</p>
                            <p>{issue.recommendation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Alertas de Atenção ({warnings.length})
                    </h3>
                    {warnings.map((warning, idx) => (
                      <div key={idx} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{warning.condition}</p>
                            <p className="text-sm text-muted-foreground">{warning.message}</p>
                          </div>
                          <Badge variant={SEVERITY_BADGES[warning.severity].variant}>
                            {SEVERITY_BADGES[warning.severity].label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Exercícios afetados:</p>
                          <ul className="text-sm space-y-1">
                            {warning.affectedExercises.map((ex) => (
                              <li key={ex.id} className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                <span>{ex.name}</span>
                                <Badge variant="outline" className="text-xs">{ex.group}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {warning.recommendation && (
                          <div className="bg-muted p-3 rounded text-sm">
                            <p className="font-medium mb-1">Recomendação:</p>
                            <p>{warning.recommendation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recomendações Gerais */}
                {recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Recomendações Gerais
                    </h3>
                    <ul className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  );
};
