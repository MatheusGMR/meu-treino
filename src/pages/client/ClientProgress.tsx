import { BottomNavigation } from "@/components/client/BottomNavigation";
import { RecentHistoryTimeline } from "@/components/client/RecentHistoryTimeline";
import { MonthlyMetricsCards } from "@/components/client/MonthlyMetricsCards";
import { GoalsDisplay } from "@/components/client/GoalsDisplay";
import { useClientGoals } from "@/hooks/useClientGoals";
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics";
import { Target, Dumbbell, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ClientProgress = () => {
  const { user } = useAuth();
  const { data: clientGoals } = useClientGoals();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: anamnesis } = useQuery({
    queryKey: ["anamnesis-weight", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("anamnesis").select("peso_kg, primary_goal").eq("client_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="client-dark min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Progresso</h1>
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Goals Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-card border border-border p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Objetivo Principal</p>
            <p className="font-bold text-foreground text-lg leading-tight">
              {clientGoals?.goal || anamnesis?.primary_goal || 'Não definido'}
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Meta de Peso</p>
            <p className="font-bold text-foreground text-lg">
              {clientGoals?.targetWeight || '—'} kg
            </p>
          </div>
        </div>

        {/* Weight Section */}
        <div className="rounded-xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Seu Peso</h2>
            <span className="text-sm text-muted-foreground capitalize">{currentMonth}</span>
          </div>

          {/* Placeholder chart area */}
          <div className="h-32 flex items-end justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-primary/30" />
            <span className="text-sm text-muted-foreground">Gráfico em breve</span>
          </div>

          <div className="rounded-lg bg-muted/50 border border-border p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Peso Atual</p>
            <p className="text-2xl font-bold text-primary mt-1">{anamnesis?.peso_kg || '—'} kg</p>
          </div>
        </div>

        {/* Metrics */}
        <MonthlyMetricsCards />
        <RecentHistoryTimeline />
      </div>

      <BottomNavigation activeTab="progresso" />
    </div>
  );
};

export default ClientProgress;
