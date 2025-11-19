import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnesisStatus } from "@/hooks/useAnamnesisStatus";
import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { TodayWorkoutCard } from "@/components/client/TodayWorkoutCard";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { WorkoutSelector } from "@/components/client/WorkoutSelector";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";
import { WelcomeSplash } from "@/components/client/WelcomeSplash";
import { ClientHeader } from "@/components/client/ClientHeader";
import { AnamnesisNotification } from "@/components/client/AnamnesisNotification";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anamnesisCompleted, loading: anamnesisLoading } = useAnamnesisStatus();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Força dark mode
    document.documentElement.classList.add('dark');
    
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      document.documentElement.classList.remove('dark');
    };
  }, []);

  // Redirect to anamnesis if not completed
  useEffect(() => {
    if (!anamnesisLoading && anamnesisCompleted === false) {
      navigate("/client/anamnesis", { replace: true });
    }
  }, [anamnesisCompleted, anamnesisLoading, navigate]);

  if (anamnesisLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-background border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-background">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showSplash) {
    return <WelcomeSplash />;
  }

  return (
    <SolidBackgroundWrapper>
      <div className="min-h-screen dark">
        <ClientHeader />
        {anamnesisCompleted === false && <AnamnesisNotification />}
        
        <div className="container mx-auto px-4 pt-8 pb-8 space-y-8">
          <MonthlyMetricsCards />

        <TodayWorkoutCard />

        <WorkoutSelector />

        <RecentHistoryTimeline />
        </div>
      </div>
    </SolidBackgroundWrapper>
  );
};

export default ClientDashboard;
