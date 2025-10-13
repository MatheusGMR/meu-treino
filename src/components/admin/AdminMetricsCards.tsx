import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Dumbbell, CheckCircle, UserX, Award } from "lucide-react";
import { useAdminMetrics } from "@/hooks/useAdminMetrics";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminMetricsCards = () => {
  const { data: metrics, isLoading } = useAdminMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Clientes",
      value: metrics?.totalClients || 0,
      icon: Users,
      description: "Clientes cadastrados",
    },
    {
      title: "Clientes Ativos",
      value: metrics?.activeClients || 0,
      icon: UserCheck,
      description: "Com profissional atribuído",
    },
    {
      title: "Profissionais",
      value: metrics?.totalProfessionals || 0,
      icon: Award,
      description: "Personal trainers ativos",
    },
    {
      title: "Treinos Criados",
      value: metrics?.totalWorkouts || 0,
      icon: Dumbbell,
      description: "Total de treinos no sistema",
    },
    {
      title: "Sessões Concluídas",
      value: metrics?.completedSessions || 0,
      icon: CheckCircle,
      description: "Total de sessões finalizadas",
    },
    {
      title: "Sem Profissional",
      value: metrics?.unassignedClients || 0,
      icon: UserX,
      description: "Aguardando atribuição",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
