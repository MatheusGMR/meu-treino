import { AppLayout } from "@/layouts/AppLayout";
import { AdminMetricsCards } from "@/components/admin/AdminMetricsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, UserPlus, BarChart3, Settings } from "lucide-react";

export default function AdminDashboard() {
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funcionalidades mais utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
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
