import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionAnalysis {
  volume: {
    totalSeries: number;
    status: 'below' | 'optimal' | 'above' | 'excessive';
    percentage: number;
    recommended: {
      min: number;
      optimal: number;
      max: number;
    };
  };
  energy: {
    total: 'Baixo' | 'Médio' | 'Alto';
    breakdown: {
      high: number;
      medium: number;
      low: number;
    };
    score: number;
  };
  muscles: {
    distribution: Array<{
      group: string;
      percentage: number;
      count: number;
    }>;
    isBalanced: boolean;
    warnings: string[];
  };
  risks: {
    level: 'safe' | 'caution' | 'high';
    methods: {
      high: number;
      medium: number;
      low: number;
    };
    warnings: string[];
  };
  estimatedDuration: number;
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    category: string;
  }>;
  suggestions: string[];
}

interface SessionSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: SessionAnalysis;
  sessionName: string;
  onConfirm: () => void;
}

export const SessionSummaryDialog = ({
  open,
  onOpenChange,
  analysis,
  sessionName,
  onConfirm,
}: SessionSummaryDialogProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const hasErrorAlerts = analysis.alerts.some(a => a.type === 'error');

  const handleSave = () => {
    if (hasErrorAlerts) {
      setShowConfirmation(true);
    } else {
      onConfirm();
    }
  };

  const getVolumeStatusBadge = () => {
    switch (analysis.volume.status) {
      case 'below':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Abaixo</Badge>;
      case 'optimal':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">✅ Ótimo</Badge>;
      case 'above':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">Acima</Badge>;
      case 'excessive':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">Excessivo</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  const totalExercises = analysis.muscles.distribution.reduce((sum, m) => sum + m.count, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Resumo da Sessão - {sessionName}</DialogTitle>
            <DialogDescription>
              Análise completa da sessão antes de salvar
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Composição */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  📋 Composição
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{totalExercises}</div>
                    <div className="text-muted-foreground">exercícios</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">{analysis.volume.totalSeries}</div>
                    <div className="text-muted-foreground">séries totais</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">~{analysis.estimatedDuration}</div>
                    <div className="text-muted-foreground">minutos</div>
                  </div>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  📊 Volume
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    {getVolumeStatusBadge()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Séries: {analysis.volume.totalSeries}</span>
                      <span className="text-muted-foreground">{analysis.volume.percentage}% do ótimo</span>
                    </div>
                    <Progress value={Math.min(analysis.volume.percentage, 100)} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {analysis.volume.recommended.min}</span>
                      <span>Ótimo: {analysis.volume.recommended.optimal}</span>
                      <span>Max: {analysis.volume.recommended.max}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Energia */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  ⚡ Energia
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Custo total:</span>
                    <Badge variant="outline">{analysis.energy.total}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 rounded bg-red-500/10">
                      <div className="text-lg font-medium">{analysis.energy.breakdown.high}</div>
                      <div className="text-xs text-muted-foreground">Alto 🔴</div>
                    </div>
                    <div className="text-center p-2 rounded bg-yellow-500/10">
                      <div className="text-lg font-medium">{analysis.energy.breakdown.medium}</div>
                      <div className="text-xs text-muted-foreground">Médio 🟡</div>
                    </div>
                    <div className="text-center p-2 rounded bg-green-500/10">
                      <div className="text-lg font-medium">{analysis.energy.breakdown.low}</div>
                      <div className="text-xs text-muted-foreground">Baixo 🟢</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {analysis.energy.total === 'Alto' && 'Recomendado: 48-72h de descanso'}
                    {analysis.energy.total === 'Médio' && 'Recomendado: 24-48h de descanso'}
                    {analysis.energy.total === 'Baixo' && 'Recomendado: 24h de descanso'}
                  </p>
                </div>
              </div>

              {/* Músculos */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  💪 Músculos
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Distribuição:</span>
                    {analysis.muscles.isBalanced ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                        ✅ Balanceado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                        ⚠️ Desbalanceado
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {analysis.muscles.distribution.map((muscle) => (
                      <div key={muscle.group} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{muscle.group}</span>
                          <span className="text-muted-foreground">
                            {muscle.percentage}% ({muscle.count} exerc.)
                          </span>
                        </div>
                        <Progress value={muscle.percentage} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {analysis.alerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    ⚠️ Alertas ({analysis.alerts.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.alerts.map((alert, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted text-sm">
                        {getAlertIcon(alert.type)}
                        <span className="flex-1">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões */}
              {analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    💡 Sugestões
                  </h3>
                  <div className="space-y-1">
                    {analysis.suggestions.map((suggestion, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground">
                        • {suggestion}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleSave}>
              Salvar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation for error alerts */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Atenção!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta sessão possui os seguintes alertas críticos:</p>
              <ul className="list-disc list-inside space-y-1">
                {analysis.alerts
                  .filter(a => a.type === 'error')
                  .map((alert, idx) => (
                    <li key={idx} className="text-sm">{alert.message}</li>
                  ))}
              </ul>
              <p className="pt-2">Deseja continuar mesmo assim?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>
              Revisar Sessão
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              Salvar Assim Mesmo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
