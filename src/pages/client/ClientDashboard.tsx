import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { TodayWorkoutCard } from "@/components/client/TodayWorkoutCard";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { WorkoutSelector } from "@/components/client/WorkoutSelector";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";
import { WelcomeSplash } from "@/components/client/WelcomeSplash";
import { ClientHeader } from "@/components/client/ClientHeader";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [checkingAnamnesis, setCheckingAnamnesis] = useState(true);

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

  useEffect(() => {
    const checkAnamnesis = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("anamnesis_completed")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Redirect to anamnesis if not completed
        if (!data?.anamnesis_completed) {
          navigate("/client/anamnesis", { replace: true });
        }
      } catch (error) {
        console.error("Error checking anamnesis:", error);
      } finally {
        setCheckingAnamnesis(false);
      }
    };

    checkAnamnesis();
  }, [user?.id, navigate]);

  if (checkingAnamnesis) {
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
