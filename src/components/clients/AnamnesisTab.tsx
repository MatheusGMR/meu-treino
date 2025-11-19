import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Send } from "lucide-react";
import { useClientAnamnesis, useRequestAnamnesis } from "@/hooks/useAnamnesis";
import { AnamnesisResponsesCard } from "./AnamnesisResponsesCard";
import { AnamnesisProfileCard } from "./AnamnesisProfileCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnamnesisTabProps {
  clientId: string;
}

export const AnamnesisTab = ({ clientId }: AnamnesisTabProps) => {
  const { data, isLoading } = useClientAnamnesis(clientId);
  const requestAnamnesis = useRequestAnamnesis();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  const isCompleted = data?.profile?.anamnesis_completed;
  const lastUpdate = data?.profile?.anamnesis_last_update;
  const canRequest = !lastUpdate || 
    (new Date().getTime() - new Date(lastUpdate).getTime()) > 7 * 24 * 60 * 60 * 1000;

  if (!isCompleted || !data?.anamnesis) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Anamnese
              </CardTitle>
              <CardDescription>O cliente ainda não preencheu a anamnese</CardDescription>
            </div>
            <Badge variant="secondary">Pendente</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Solicite ao cliente que preencha a anamnese para ter acesso a informações importantes sobre
            histórico de saúde, objetivos e perfil comportamental.
          </p>
          <Button
            onClick={() => requestAnamnesis.mutate(clientId)}
            disabled={requestAnamnesis.isPending || !canRequest}
          >
            <Send className="mr-2 h-4 w-4" />
            Solicitar Anamnese
          </Button>
          {!canRequest && (
            <p className="text-sm text-muted-foreground">
              Uma solicitação já foi enviada recentemente. Aguarde 7 dias para enviar nova solicitação.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Anamnese
              </CardTitle>
              <CardDescription>
                {lastUpdate && (
                  <>Última atualização: {format(new Date(lastUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Completo</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestAnamnesis.mutate(clientId)}
                disabled={requestAnamnesis.isPending || !canRequest}
              >
                <Send className="mr-2 h-4 w-4" />
                Solicitar Atualização
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {data.profileDetails && (
        <AnamnesisProfileCard 
          profile={data.profileDetails}
          confidenceScore={data.anamnesis.profile_confidence_score ?? undefined}
        />
      )}

      <AnamnesisResponsesCard anamnesis={data.anamnesis} />
    </div>
  );
};
