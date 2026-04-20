import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { useJmpAlerts, type AlertSeverity, type AlertStatus, type AlertType, type AgentAlert } from "@/hooks/useJmpAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Activity, HeartPulse, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button as PlaySeed } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SEVERITY_VARIANT: Record<AlertSeverity, "default" | "secondary" | "destructive" | "outline"> = {
  baixa: "outline",
  media: "secondary",
  alta: "default",
  critica: "destructive",
};

const TYPE_LABEL: Record<AlertType, string> = {
  frequencia_zero: "Frequência zero",
  frequencia_baixa: "Frequência baixa",
  dor_persistente: "Dor persistente",
  sessao_sem_feedback: "Sessão sem feedback",
  revisao_nivel_I3: "Revisão nível I3",
  alerta_medico: "Alerta médico",
  condicao_cardiaca: "Condição cardíaca",
  inconsistencia_checkin: "Inconsistência check-in",
  divergencia_conduta: "Divergência de conduta",
};

const TYPE_ICON: Record<AlertType, any> = {
  frequencia_zero: Clock,
  frequencia_baixa: Clock,
  dor_persistente: Activity,
  sessao_sem_feedback: AlertTriangle,
  revisao_nivel_I3: ShieldAlert,
  alerta_medico: HeartPulse,
  condicao_cardiaca: HeartPulse,
  inconsistencia_checkin: AlertTriangle,
  divergencia_conduta: AlertTriangle,
};

export default function JmpAlerts() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "todos">("aberto");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "todas">("todas");
  const [typeFilter, setTypeFilter] = useState<AlertType | "todos">("todos");

  const { alerts, isLoading, resolveAlert, setInReview } = useJmpAlerts({
    status: statusFilter,
    severity: severityFilter,
    alert_type: typeFilter,
  });

  const [resolveTarget, setResolveTarget] = useState<AgentAlert | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-agent-rules");
      if (error) throw error;
      toast.success(`Seeds aplicados: ${data.report.milestones} marcos, ${data.report.videos} vídeos, ${data.report.templates} templates`);
    } catch (e: any) {
      toast.error("Erro ao aplicar seeds: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const counts = {
    aberto: alerts.filter((a) => a.status === "aberto").length,
    em_revisao: alerts.filter((a) => a.status === "em_revisao").length,
    critica: alerts.filter((a) => a.severity === "critica").length,
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alertas JMP</h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real do agente Protocolo Destravamento
            </p>
          </div>
          <PlaySeed onClick={handleSeed} disabled={seeding} variant="outline">
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Re-importar diretrizes do agente
          </PlaySeed>
        </div>

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Abertos
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{counts.aberto}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Em revisão
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{counts.em_revisao}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Críticos
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-3xl font-bold text-destructive">{counts.critica}</p></CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_revisao">Em revisão</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas severidades</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {(Object.keys(TYPE_LABEL) as AlertType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando alertas...</div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum alerta encontrado com os filtros atuais.</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const Icon = TYPE_ICON[alert.alert_type] || AlertTriangle;
              return (
                <Card key={alert.id} className={alert.severity === "critica" ? "border-destructive/50" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${alert.severity === "critica" ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge variant={SEVERITY_VARIANT[alert.severity]}>{alert.severity}</Badge>
                              <Badge variant="outline">{TYPE_LABEL[alert.alert_type]}</Badge>
                              {alert.status === "resolvido" && (
                                <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Resolvido</Badge>
                              )}
                              {alert.status === "em_revisao" && (
                                <Badge variant="default">Em revisão</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Cliente: <span className="font-medium text-foreground">{alert.client_name}</span> ·{" "}
                              {format(new Date(alert.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {alert.status !== "resolvido" && (
                            <div className="flex gap-2">
                              {alert.status === "aberto" && (
                                <Button variant="outline" size="sm" onClick={() => setInReview(alert.id)}>
                                  Marcar em revisão
                                </Button>
                              )}
                              <Button size="sm" onClick={() => { setResolveTarget(alert); setResolveNote(""); }}>
                                Resolver
                              </Button>
                            </div>
                          )}
                        </div>
                        {alert.description && (
                          <p className="text-sm mt-2">{alert.description}</p>
                        )}
                        {alert.payload && Object.keys(alert.payload).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">Ver detalhes</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(alert.payload, null, 2)}
                            </pre>
                          </details>
                        )}
                        {alert.resolution_note && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Resolução: {alert.resolution_note}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Dialog de resolução */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{resolveTarget?.title}</p>
            <div>
              <Label htmlFor="note">Nota de resolução</Label>
              <Textarea
                id="note"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="Ex: Contatei cliente, reportou melhora. Liberado para próxima sessão."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (resolveTarget) {
                  resolveAlert({ id: resolveTarget.id, note: resolveNote });
                  setResolveTarget(null);
                }
              }}
              disabled={!resolveNote.trim()}
            >
              Marcar como resolvido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
