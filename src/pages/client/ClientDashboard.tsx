import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { TodayWorkoutCard } from "@/components/client/TodayWorkoutCard";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { useAuth } from "@/hooks/useAuth";

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Olá, {user?.user_metadata?.full_name || "Aluno"}! 👋
          </h1>
          <p className="text-muted-foreground">Seu progresso este mês</p>
        </div>

        <MonthlyMetricsCards />

        <TodayWorkoutCard />

        <RecentHistoryTimeline />
      </div>
    </div>
  );
};

export default ClientDashboard;
