import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { usePersonalSubscription } from "@/hooks/usePersonalSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Subscription() {
  const { subscription, loading } = usePersonalSubscription();
  const [actionLoading, setActionLoading] = useState(false);

  const handleManageSubscription = async (action: "cancel" | "portal") => {
    try {
      setActionLoading(true);

      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: { action },
      });

      if (error) throw error;

      if (action === "portal" && data?.url) {
        window.open(data.url, "_blank");
      } else if (action === "cancel") {
        toast({
          title: "Assinatura cancelada",
          description: "Você terá acesso até o final do período atual",
        });
      }
    } catch (error: any) {
      console.error("Erro ao gerenciar assinatura:", error);
      toast({
        title: "Erro ao gerenciar assinatura",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!subscription) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
              <CardDescription>
                Você precisa de uma assinatura ativa para acessar a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/escolher-plano"}>
                Escolher Plano
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500">Período de Teste</Badge>;
      case "past_due":
        return <Badge variant="destructive">Pagamento Atrasado</Badge>;
      case "canceled":
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Minha Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e métodos de pagamento
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{subscription.subscription_plans.name}</CardTitle>
                <CardDescription className="mt-1">
                  R$ {subscription.subscription_plans.price}/{subscription.subscription_plans.interval === 'month' ? 'mês' : 'ano'}
                </CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Próxima cobrança</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Método de pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Cartão de crédito via Stripe
                  </p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Cancelamento agendado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua assinatura será cancelada em{" "}
                    {format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={() => handleManageSubscription("portal")}
                disabled={actionLoading}
                variant="default"
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Gerenciar Pagamento
              </Button>

              {!subscription.cancel_at_period_end && (
                <Button
                  onClick={() => handleManageSubscription("cancel")}
                  disabled={actionLoading}
                  variant="outline"
                >
                  Cancelar Assinatura
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
