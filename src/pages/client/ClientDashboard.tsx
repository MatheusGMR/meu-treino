import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnesisStatus } from "@/hooks/useAnamnesisStatus";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useWeeklySchedule } from "@/hooks/useWeeklySchedule";
import { useClientGoals } from "@/hooks/useClientGoals";
import { useHasWorkout } from "@/hooks/useHasWorkout";
import { WelcomeSplash } from "@/components/client/WelcomeSplash";
import { WaitingForWorkout } from "@/components/client/WaitingForWorkout";
import { AnamnesisNotification } from "@/components/client/AnamnesisNotification";
import { DayCarousel } from "@/components/client/DayCarousel";
import { GoalsDisplay } from "@/components/client/GoalsDisplay";
import { WorkoutCard } from "@/components/client/WorkoutCard";
import { BottomNavigation } from "@/components/client/BottomNavigation";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anamnesisCompleted, loading: anamnesisLoading } = useAnamnesisStatus();
  const { data: hasWorkout, isLoading: workoutLoading } = useHasWorkout();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  
  const { data: weeklySchedule = [] } = useWeeklySchedule();
  const { data: clientGoals } = useClientGoals();
  const { data: todayWorkout } = useTodayWorkout();
  
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const completedSessions = weeklySchedule.filter(d => d.completed).length;
  const totalSessions = weeklySchedule.length;
  
  const getWorkoutStatus = () => {
    if (todayWorkout?.completed) return 'completed';
    if (todayWorkout) return 'in-progress';
    return 'upcoming';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!anamnesisLoading && anamnesisCompleted === false) {
      navigate("/client/anamnesis", { replace: true });
    }
  }, [anamnesisCompleted, anamnesisLoading, navigate]);

  if (anamnesisLoading || workoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground text-lg font-semibold">
            {anamnesisLoading ? "Carregando perfil..." : "Verificando treinos..."}
          </p>
        </div>
      </div>
    );
  }

  if (anamnesisCompleted && !hasWorkout) {
    return <WaitingForWorkout />;
  }

  if (showSplash) {
    return <WelcomeSplash />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-foreground">
              Meu Treino
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Avatar className="w-9 h-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          {anamnesisCompleted === false && <AnamnesisNotification />}
        </div>
      </header>

      {/* Day Carousel */}
      <div className="pt-4">
        <DayCarousel 
          days={weeklySchedule}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      {/* Goals */}
      <GoalsDisplay
        mainGoal={clientGoals?.goal || 'Não definido'}
        targetWeight={clientGoals?.targetWeight || '0'}
      />

      {/* Progress Info */}
      <div className="px-5 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{completedSessions}</span> de{' '}
          <span className="font-bold text-foreground">{totalSessions}</span> treinos concluídos
        </p>
      </div>

      {/* Main Workout Card */}
      {todayWorkout && (
        <WorkoutCard
          workoutName={todayWorkout.sessions?.name || 'Treino do Dia'}
          imageUrl={todayWorkout.sessions?.session_exercises?.[0]?.exercises?.thumbnail_url}
          status={getWorkoutStatus()}
          onClick={() => navigate(`/client/workout/details/${todayWorkout.session_id}`)}
        />
      )}

      <BottomNavigation activeTab="plano" />
    </div>
  );
};

export default ClientDashboard;
