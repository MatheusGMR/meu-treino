import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, X, Clock, Activity, Flame } from "lucide-react";
import { ExerciseVideoPlayer } from "@/components/client/ExerciseVideoPlayer";
import { SeriesTracker } from "@/components/client/SeriesTracker";
import { RestTimer } from "@/components/client/RestTimer";
import { SessionProgressBar } from "@/components/client/SessionProgressBar";
import { AbandonWorkoutDialog } from "@/components/client/AbandonWorkoutDialog";
import { useCompleteSession } from "@/hooks/useSessionCompletion";

const WorkoutSessionExecution = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [startTime] = useState(Date.now());
  const completeSessionMutation = useCompleteSession();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session-execution", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`*, session_exercises (*, exercises (*), volumes (*), methods (*))`)
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: todaySchedule } = useQuery({
    queryKey: ["today-schedule", sessionId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("daily_workout_schedule")
        .select("*, client_workouts(id)")
        .eq("session_id", sessionId)
        .eq("scheduled_for", today)
        .maybeSingle();
      return data;
    },
    enabled: !!sessionId,
  });

  const exercises = session?.session_exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const nextExercise = currentExerciseIndex < totalExercises - 1 ? exercises[currentExerciseIndex + 1] : null;

  const elapsedMs = Date.now() - startTime;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setShowRestTimer(false);
    } else {
      handleCompleteSession();
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setShowRestTimer(false);
    }
  };

  const handleCompleteSession = () => {
    if (!todaySchedule?.id) return;
    completeSessionMutation.mutate(todaySchedule.id, {
      onSuccess: () => {
        navigate(`/client/workout/complete/${todaySchedule.id}`, {
          state: { startTime, exercisesCount: totalExercises, sessionName: session?.name },
        });
      },
    });
  };

  const handleAbandon = (reason: string) => {
    setShowAbandonDialog(false);
    navigate("/client/dashboard");
  };

  if (isLoading) {
    return (
      <div className="client-dark flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !currentExercise) {
    return (
      <div className="client-dark flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Sessão não encontrada</p>
      </div>
    );
  }

  return (
    <div className="client-dark min-h-screen bg-background text-foreground flex flex-col">
      {/* Exercise Media - top */}
      <div className="relative w-full aspect-video bg-muted flex-shrink-0">
        {currentExercise.exercises?.video_url ? (
          <ExerciseVideoPlayer
            mediaUrl={currentExercise.exercises.video_url}
            mediaType="video"
            exerciseName={currentExercise.exercises?.name || ""}
          />
        ) : currentExercise.exercises?.thumbnail_url ? (
          <img
            src={currentExercise.exercises.thumbnail_url}
            alt={currentExercise.exercises.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <span className="text-5xl">🏋️</span>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={() => setShowAbandonDialog(true)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex-1 flex flex-col">
        {/* Timer & Navigation */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
              className="w-10 h-10 rounded-lg border border-border flex items-center justify-center disabled:opacity-30 hover:bg-card transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              {showRestTimer ? (
                <RestTimer
                  restTime={currentExercise.methods?.rest_seconds || 60}
                  onComplete={() => setShowRestTimer(false)}
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentExercise.exercises?.name}
                  </h2>
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mt-1">
                    {session.session_type || `Exercício ${currentExerciseIndex + 1}/${totalExercises}`}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Skip Button */}
        {showRestTimer && (
          <div className="px-5 mb-4">
            <button
              onClick={() => setShowRestTimer(false)}
              className="w-full py-3 rounded-lg border-2 border-primary text-primary font-bold uppercase tracking-wider text-sm hover:bg-primary hover:text-primary-foreground transition-all"
            >
              PULAR
            </button>
          </div>
        )}

        {/* Progress segments */}
        <div className="px-5 mb-4">
          <div className="flex gap-1">
            {exercises.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < currentExerciseIndex ? 'bg-primary' :
                  i === currentExerciseIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-5 mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-card border border-border p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Tempo</p>
              <p className="text-primary font-bold text-lg mt-0.5">
                {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
              </p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Status</p>
              <p className="text-primary font-bold text-sm mt-0.5 uppercase">
                {showRestTimer ? 'Descanso' : 'Ativo'}
              </p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Exercícios</p>
              <p className="text-primary font-bold text-lg mt-0.5">
                {currentExerciseIndex + 1}/{totalExercises}
              </p>
            </div>
          </div>
        </div>

        {/* Series Tracker */}
        {!showRestTimer && (
          <div className="px-5 mb-4">
            <SeriesTracker
              sets={currentExercise.volumes?.num_series || 3}
              reps={`${currentExercise.methods?.reps_min}-${currentExercise.methods?.reps_max}` || "12"}
              clientWorkoutId={todaySchedule?.client_workouts?.id || ""}
              sessionId={sessionId || ""}
              exerciseId={currentExercise.exercise_id}
            />
          </div>
        )}

        {/* Next Exercise Preview */}
        {nextExercise && !showRestTimer && (
          <div className="px-5 mt-auto pb-6">
            <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {nextExercise.exercises?.thumbnail_url ? (
                  <img src={nextExercise.exercises.thumbnail_url} alt={nextExercise.exercises.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted"><span>💪</span></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Próximo</p>
                <p className="font-bold text-sm text-primary truncate">{nextExercise.exercises?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {nextExercise.volumes?.num_series}x {nextExercise.methods?.reps_min}-{nextExercise.methods?.reps_max}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AbandonWorkoutDialog
        open={showAbandonDialog}
        onOpenChange={setShowAbandonDialog}
        onConfirm={handleAbandon}
      />
    </div>
  );
};

export default WorkoutSessionExecution;
