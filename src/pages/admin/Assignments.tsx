import { AppLayout } from "@/layouts/AppLayout";
import { useAssignmentHistory } from "@/hooks/useAssignmentHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Assignments() {
  const { data: history, isLoading } = useAssignmentHistory();

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <History className="h-8 w-8" />
            Histórico de Atribuições
          </h1>
          <p className="text-muted-foreground">
            Acompanhe todas as transferências de clientes entre profissionais
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {item.client?.full_name || "Cliente"}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(item.changed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Transferência</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">
                      {item.old_personal?.full_name || "Nenhum profissional"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-primary">
                      {item.new_personal?.full_name || "Nenhum profissional"}
                    </span>
                  </div>

                  {item.change_reason && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Motivo:</p>
                      <p className="text-sm text-muted-foreground">{item.change_reason}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Alterado por: {item.changed_by_user?.full_name || "Sistema"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h3>
            <p className="text-muted-foreground">
              As transferências de clientes aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
