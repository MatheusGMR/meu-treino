import { Card } from "@/components/ui/card";
import { Activity, TrendingDown, Calendar } from "lucide-react";
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics";
import { Skeleton } from "@/components/ui/skeleton";

export const MonthlyMetricsCards = () => {
  const { data: metrics, isLoading } = useMonthlyMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      icon: Activity,
      label: "Sessões",
      value: `${metrics?.sessionsCompleted || 0}/${metrics?.totalSessions || 0}`,
      color: "text-primary",
    },
    {
      icon: TrendingDown,
      label: "Variação",
      value: `${metrics?.weightChange || 0}kg`,
      color: "text-accent",
    },
    {
      icon: Calendar,
      label: "Frequência",
      value: `${metrics?.weeklyFrequency || 0}%`,
      color: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-6 hover:shadow-lg hover:shadow-primary/10 transition-all hover:border-primary/50 border-border/50 bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-foreground/60">{card.label}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
