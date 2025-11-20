import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Activity, AlertTriangle, Clock, FileText } from "lucide-react";
import { useSessionAnalysis } from "@/hooks/useSessionAnalysis";
import { SessionSummaryDialog } from "./SessionSummaryDialog";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";
import { motion } from "framer-motion";

interface SessionAnalysisPanelProps {
  exercises: SessionExerciseData[];
  sessionName: string;
  onSave?: () => void;
}

export const SessionAnalysisPanel = ({ exercises, sessionName, onSave }: SessionAnalysisPanelProps) => {
  const [showSummary, setShowSummary] = useState(false);
  const { data: analysis, isLoading } = useSessionAnalysis(exercises);

  if (isLoading || !analysis) {
    return (
      <Card className="h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Análise em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Carregando análise...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVolumeColor = (percentage: number) => {
    if (percentage >= 80 && percentage <= 100) return "bg-green-500";
    if (percentage >= 50 && percentage < 80) return "bg-yellow-500";
    if (percentage > 100 && percentage <= 120) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getEnergyBadge = (cost: string) => {
    switch (cost) {
      case 'Alto':
        return <Badge variant="destructive">Alto 🔴</Badge>;
      case 'Médio':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Médio 🟡</Badge>;
      case 'Baixo':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Baixo 🟢</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
      default:
        return <TrendingUp className="w-3 h-3 text-green-500" />;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="h-fit sticky top-4">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Análise em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Volume Analysis */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">📊 Volume</span>
                <span className="text-xs text-muted-foreground">
                  {analysis.volume.totalSeries} séries
                </span>
              </div>
              <div className="space-y-1">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${getVolumeColor(analysis.volume.percentage)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(analysis.volume.percentage, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: {analysis.volume.recommended.min}</span>
                  <span className="font-medium">Ótimo: {analysis.volume.recommended.optimal}</span>
                  <span>Max: {analysis.volume.recommended.max}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.volume.percentage}% do ótimo
                </p>
              </div>
            </div>

            {/* Energy Cost */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">⚡ Custo Energético</span>
                {getEnergyBadge(analysis.energy.total)}
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-center p-1 rounded bg-red-500/10">
                  <div className="font-medium">{analysis.energy.breakdown.high}</div>
                  <div className="text-muted-foreground">Alto</div>
                </div>
                <div className="text-center p-1 rounded bg-yellow-500/10">
                  <div className="font-medium">{analysis.energy.breakdown.medium}</div>
                  <div className="text-muted-foreground">Médio</div>
                </div>
                <div className="text-center p-1 rounded bg-green-500/10">
                  <div className="font-medium">{analysis.energy.breakdown.low}</div>
                  <div className="text-muted-foreground">Baixo</div>
                </div>
              </div>
            </div>

            {/* Muscle Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">💪 Músculos</span>
                {analysis.muscles.isBalanced ? (
                  <Badge variant="outline" className="text-xs">✅ Balanceado</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">⚠️ Desbalanceado</Badge>
                )}
              </div>
              <div className="space-y-1">
                {analysis.muscles.distribution.slice(0, 4).map((muscle) => (
                  <div key={muscle.group} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{muscle.group}</span>
                      <span className="text-muted-foreground">{muscle.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${muscle.percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {analysis.alerts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium">⚠️ Alertas</span>
                <div className="space-y-1">
                  {analysis.alerts.slice(0, 3).map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      {getAlertIcon(alert.type)}
                      <span className="flex-1 text-muted-foreground">{alert.message}</span>
                    </div>
                  ))}
                  {analysis.alerts.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      +{analysis.alerts.length - 3} alertas...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium">💡 Sugestões</span>
                <div className="space-y-1">
                  {analysis.suggestions.slice(0, 2).map((suggestion, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      • {suggestion}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="w-3 h-3" />
              <span>Duração estimada: ~{analysis.estimatedDuration} min</span>
            </div>

            {/* View Summary Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(true)}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Resumo Completo
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <SessionSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        analysis={analysis}
        sessionName={sessionName}
        onConfirm={() => {
          setShowSummary(false);
          onSave?.();
        }}
      />
    </>
  );
};
