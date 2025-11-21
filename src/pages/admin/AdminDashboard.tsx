import { AppLayout } from "@/layouts/AppLayout";
import { AdminMetricsCards } from "@/components/admin/AdminMetricsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, UserPlus, BarChart3, Sparkles, Settings, RefreshCw } from "lucide-react";
import { usePendingUpdates } from "@/hooks/usePendingUpdates";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminDashboard() {
  const { data: pendingUpdates } = usePendingUpdates();
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const { data: newItemsCount } = useQuery({
    queryKey: ["new-items-count"],
    queryFn: async () => {
      const [exercises, methods, volumes] = await Promise.all([
        supabase.from("exercises").select("id", { count: "exact" }).eq("is_new", true),
        supabase.from("methods").select("id", { count: "exact" }).eq("is_new", true),
        supabase.from("volumes").select("id", { count: "exact" }).eq("is_new", true),
      ]);
      
      return {
        exercises: exercises.count || 0,
        methods: methods.count || 0,
        volumes: volumes.count || 0,
        total: (exercises.count || 0) + (methods.count || 0) + (volumes.count || 0),
      };
    },
  });

  const recalculateAnamnesisProfiles = async () => {
    setIsRecalculating(true);
    
    try {
      // Buscar todos os clientes com anamnese concluída
      const { data: clients, error: clientsError } = await supabase
        .from("anamnesis")
        .select("client_id")
        .not("completed_at", "is", null);

      if (clientsError) throw clientsError;

      if (!clients || clients.length === 0) {
        toast({
          title: "Nenhum cliente para recalcular",
          description: "Não há clientes com anamnese concluída",
        });
        return;
      }

      toast({
        title: "Iniciando recálculo",
        description: `Processando ${clients.length} cliente(s)...`,
      });

      let successCount = 0;
      let errorCount = 0;

      // Processar cada cliente
      for (const client of clients) {
        try {
          const { error } = await supabase.functions.invoke('calculate-anamnesis-profile', {
            body: { clientId: client.client_id },
          });

          if (error) {
            console.error(`Erro ao calcular perfil do cliente ${client.client_id}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Erro ao processar cliente ${client.client_id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Recálculo concluído",
        description: `✅ ${successCount} perfis calculados com sucesso. ${errorCount > 0 ? `❌ ${errorCount} erros.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

    } catch (error) {
      console.error("Erro ao recalcular perfis:", error);
      toast({
        title: "Erro ao recalcular",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral completa do sistema e suas métricas
          </p>
        </div>

        <AdminMetricsCards />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Profissionais
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os personal trainers do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/professionals">Acessar</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Gerenciar Clientes
              </CardTitle>
              <CardDescription>
                Veja todos os clientes e gerencie suas atribuições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/clients">Acessar</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Atribuições
              </CardTitle>
              <CardDescription>
                Interface para reatribuir clientes entre profissionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/assignments">Acessar</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Atualizações Automáticas
                {pendingUpdates && pendingUpdates.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingUpdates.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Revise atualizações da pesquisa científica semanal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {newItemsCount && newItemsCount.total > 0 && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{newItemsCount.exercises}</div>
                    <div className="text-muted-foreground text-xs">Exercícios</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{newItemsCount.methods}</div>
                    <div className="text-muted-foreground text-xs">Métodos</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{newItemsCount.volumes}</div>
                    <div className="text-muted-foreground text-xs">Volumes</div>
                  </div>
                </div>
              )}
              <Button asChild className="w-full">
                <Link to="/admin/pending-updates">
                  Revisar Atualizações
                  {pendingUpdates && pendingUpdates.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingUpdates.length} pendentes
                    </Badge>
                  )}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades mais utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={recalculateAnamnesisProfiles}
              disabled={isRecalculating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculando...' : 'Recalcular Perfis de Anamnese'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/users">
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Usuários
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/personal/exercises">Ver Exercícios</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/personal/sessions">Ver Sessões</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/personal/workouts">Ver Treinos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
