import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { TodayWorkoutCard } from "@/components/client/TodayWorkoutCard";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { useAuth } from "@/hooks/useAuth";
import { BackgroundWrapper } from "@/components/BackgroundWrapper";

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <BackgroundWrapper overlayOpacity="medium">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Olá, {user?.user_metadata?.full_name || "Aluno"}! 👋
              </span>
            </h1>
          <p className="text-muted-foreground">Seu progresso este mês</p>
        </div>

        <MonthlyMetricsCards />

        <TodayWorkoutCard />

          <RecentHistoryTimeline />
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default ClientDashboard;
