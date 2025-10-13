import { useState, useEffect } from "react";
import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { TodayWorkoutCard } from "@/components/client/TodayWorkoutCard";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { WorkoutSelector } from "@/components/client/WorkoutSelector";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";
import { WelcomeSplash } from "@/components/client/WelcomeSplash";
import { ClientHeader } from "@/components/client/ClientHeader";

const ClientDashboard = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
