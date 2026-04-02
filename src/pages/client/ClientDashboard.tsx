import { useState, useEffect, useRef, useCallback } from "react";
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
import { BottomNavigation } from "@/components/client/BottomNavigation";
import { DailyCheckinDialog } from "@/components/client/DailyCheckinDialog";
import { Clock, Dumbbell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { anamnesisCompleted, loading: anamnesisLoading } = useAnamnesisStatus();
  const { data: hasWorkout, isLoading: workoutLoading } = useHasWorkout();
  const [showSplash, setShowSplash] = useState(() => {
    const shown = sessionStorage.getItem("splash_shown");
    return !shown;
  });
  const [isExpanding, setIsExpanding] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showCheckin, setShowCheckin] = useState(false);

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

  // Check if already did check-in today
  const { data: todayCheckin } = useQuery({
    queryKey: ["today-checkin", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("client_id", user.id)
        .eq("checkin_date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const completedSessions = weeklySchedule.filter(d => d.completed).length;
  const totalSessions = weeklySchedule.length;
  const currentWeek = 1;

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem("splash_shown", "true");
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    if (!anamnesisLoading && anamnesisCompleted === false) {
      navigate("/client/anamnesis", { replace: true });
    }
  }, [anamnesisCompleted, anamnesisLoading, navigate]);

  if (anamnesisLoading || workoutLoading) {
    return (
      <div className="client-dark min-h-screen flex items-center justify-center bg-background">
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

  const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  return (
    <div className="client-dark min-h-screen bg-background text-foreground pb-24">
      {anamnesisCompleted === false && (
        <div className="px-5 pt-4">
          <AnamnesisNotification />
        </div>
      )}

      {/* Week Header */}
      <div className="text-center pt-6 pb-4">
        <h1 className="text-xl font-bold text-foreground">Semana {currentWeek}</h1>
      </div>

      {/* Day Selector */}
      <div className="px-5 mb-6">
        <div className="flex gap-2 justify-center">
          {weeklySchedule.length > 0
            ? weeklySchedule.map((day, i) => {
                const isCompleted = day.completed;
                const hasSession = !day.locked;
                return (
                  <button
                    key={day.id}
                    onClick={() => {
                      if (hasSession && day.dayNumber) {
                        // navigate to workout details if available
                      }
                    }}
                    className={`
                      flex flex-col items-center justify-center w-14 h-20 rounded-lg border-2 transition-all
                      ${isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-foreground hover:border-primary/50'
                      }
                    `}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {dayLabels[i] || `D${day.dayNumber}`}
                    </span>
                    <span className="text-lg font-bold mt-0.5">{day.dayNumber}</span>
                    {hasSession && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isCompleted ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })
            : dayLabels.slice(0, 5).map((label, i) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center w-14 h-20 rounded-lg border-2 bg-card border-border text-foreground"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
                  <span className="text-lg font-bold mt-0.5">{i + 1}</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* Workout Section */}
      <div className="px-5">
        <h2 className="text-lg font-bold text-foreground mb-4">Seu treino de hoje</h2>

        {todayWorkout ? (
          <div
            ref={cardRef}
            className={`rounded-xl overflow-hidden bg-card border border-border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              isExpanding
                ? 'fixed inset-0 z-50 rounded-none border-none'
                : 'relative'
            }`}
            style={isExpanding ? { borderRadius: 0 } : {}}
          >
            {/* Workout Image */}
            <div className={`w-full bg-muted overflow-hidden transition-all duration-500 ${isExpanding ? 'h-[45vh]' : 'aspect-[16/10]'}`}>
              {todayWorkout.sessions?.session_exercises?.[0]?.exercises?.thumbnail_url ? (
                <img
                  src={todayWorkout.sessions.session_exercises[0].exercises.thumbnail_url}
                  alt={todayWorkout.sessions?.name || 'Treino'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Dumbbell className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Workout Info */}
            <div className={`p-5 transition-all duration-500 ${isExpanding ? 'flex flex-col justify-center flex-1' : ''}`}>
              <h3 className={`font-bold text-foreground mb-2 transition-all duration-500 ${isExpanding ? 'text-2xl' : 'text-xl'}`}>
                {todayWorkout.sessions?.name || 'Treino do Dia'}
              </h3>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>45 min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  <span>
                    {todayWorkout.sessions?.session_exercises
                      ? `${todayWorkout.sessions.session_exercises.length} exercícios`
                      : 'Exercícios'}
                  </span>
                </div>
              </div>

              {todayWorkout.sessions?.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {todayWorkout.sessions.description}
                </p>
              )}

              <button
                onClick={() => {
                  if (isExpanding) return;
                  setIsExpanding(true);
                  setTimeout(() => {
                    navigate(`/client/workout/details/${todayWorkout.session_id}`);
                  }, 550);
                }}
                className={`w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider transition-all ${
                  isExpanding
                    ? 'opacity-0 scale-95'
                    : 'hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_hsl(348_83%_47%/0.4)]'
                }`}
              >
                IR PARA O TREINO
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-8 bg-card border border-border text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum treino agendado para hoje</p>
          </div>
        )}
      </div>

      {/* Progress Info */}
      {totalSessions > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso semanal</span>
            <span className="text-foreground font-bold">{completedSessions}/{totalSessions}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <BottomNavigation activeTab="plano" />
    </div>
  );
};

export default ClientDashboard;
