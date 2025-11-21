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
      color: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: TrendingDown,
      label: "Variação",
      value: `${metrics?.weightChange || 0}kg`,
      color: "bg-success/10",
      iconColor: "text-success",
    },
    {
      icon: Calendar,
      label: "Frequência",
      value: `${metrics?.weeklyFrequency || 0}%`,
      color: "bg-warning/10",
      iconColor: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full ${card.color} flex items-center justify-center`}>
                <Icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
