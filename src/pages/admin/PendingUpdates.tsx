import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingUpdates, useApproveUpdate, useRejectUpdate, useTriggerResearch } from "@/hooks/usePendingUpdates";
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PendingUpdates() {
  const { data: pendingUpdates, isLoading } = usePendingUpdates();
  const approveUpdate = useApproveUpdate();
  const rejectUpdate = useRejectUpdate();
  const triggerResearch = useTriggerResearch();

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      exercise: "Exercício",
      method: "Método",
      volume: "Volume",
    };
    return labels[type] || type;
  };

  const getEntityTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      exercise: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      method: "bg-green-500/10 text-green-500 border-green-500/20",
      volume: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-500";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Atualizações Pendentes</h1>
            <p className="text-muted-foreground mt-1">
              Revise e aprove as novidades encontradas pela pesquisa automática
            </p>
          </div>
          <Button
            onClick={() => triggerResearch.mutate()}
            disabled={triggerResearch.isPending}
          >
            {triggerResearch.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Executar Pesquisa Agora
          </Button>
        </div>

        {pendingUpdates && pendingUpdates.length === 0 ? (
          <Alert>
            <AlertDescription>
              Nenhuma atualização pendente no momento. Execute a pesquisa automática ou aguarde a próxima execução semanal.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {pendingUpdates?.map((update) => {
              const entityData = update.entity_data as any;
              
              return (
                <Card key={update.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getEntityTypeColor(update.entity_type)}>
                            {getEntityTypeLabel(update.entity_type)}
                          </Badge>
                          {update.confidence_score && (
                            <Badge variant="outline">
                              Confiança: {(update.confidence_score * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{entityData.name}</CardTitle>
                        <CardDescription>
                          {entityData.short_description || entityData.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {entityData.long_description && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Detalhes:</p>
                        <p className="whitespace-pre-wrap">{entityData.long_description}</p>
                      </div>
                    )}

                    {update.source_reference && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Fonte:</span>
                        <a
                          href={update.source_reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {update.source_reference}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => approveUpdate.mutate(update.id)}
                        disabled={approveUpdate.isPending || rejectUpdate.isPending}
                        className="flex-1"
                      >
                        {approveUpdate.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Aprovar e Publicar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rejectUpdate.mutate(update.id)}
                        disabled={approveUpdate.isPending || rejectUpdate.isPending}
                        className="flex-1"
                      >
                        {rejectUpdate.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
