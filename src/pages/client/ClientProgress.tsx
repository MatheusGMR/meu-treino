import { BottomNavigation } from "@/components/client/BottomNavigation";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";

const ClientProgress = () => {
  return (
    <SolidBackgroundWrapper>
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-border/50 shadow-sm">
          <div className="px-5 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              Progresso
            </h1>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          <MonthlyMetricsCards />
          <RecentHistoryTimeline />
        </div>

        <BottomNavigation activeTab="progresso" />
      </div>
    </SolidBackgroundWrapper>
  );
};

export default ClientProgress;
