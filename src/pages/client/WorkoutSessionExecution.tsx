import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ExerciseVideoPlayer } from "@/components/client/ExerciseVideoPlayer";
import { SeriesTracker } from "@/components/client/SeriesTracker";
import { RestTimer } from "@/components/client/RestTimer";
import { ExerciseNotes } from "@/components/client/ExerciseNotes";
import { SessionProgressBar } from "@/components/client/SessionProgressBar";
import { AbandonWorkoutDialog } from "@/components/client/AbandonWorkoutDialog";
import { useCompleteSession } from "@/hooks/useSessionCompletion";
import { toast } from "@/hooks/use-toast";

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
        .select(`
          *,
          session_exercises (
            *,
            exercises (*),
            volumes (*),
            methods (*)
          )
        `)
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
          state: {
            startTime,
            exercisesCount: totalExercises,
            sessionName: session?.name,
          }
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !currentExercise) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Sessão não encontrada</p>
      </div>
    );
  }

  const nextExercise = currentExerciseIndex < totalExercises - 1 
    ? exercises[currentExerciseIndex + 1] 
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowAbandonDialog(true)}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">
          {currentExerciseIndex + 1}/{totalExercises}
        </span>
        <div className="w-9" />
      </header>

      {/* Exercise Media */}
      <div className="w-full bg-muted" style={{ aspectRatio: '16/10' }}>
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
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <span className="text-5xl">🏋️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5">
        {/* Exercise Name */}
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
            {session.session_type || 'Exercício'}
          </p>
          <h2 className="text-2xl font-bold text-foreground">
            {currentExercise.exercises?.name}
          </h2>
        </div>

        {/* Progress Bar */}
        <SessionProgressBar 
          current={currentExerciseIndex + 1} 
          total={totalExercises} 
        />

        {/* Rest Timer */}
        {showRestTimer && (
          <div className="py-4">
            <RestTimer
              restTime={currentExercise.methods?.rest_seconds || 60}
              onComplete={() => setShowRestTimer(false)}
            />
          </div>
        )}

        {/* Series Tracker */}
        {!showRestTimer && (
          <SeriesTracker
            sets={currentExercise.volumes?.num_series || 3}
            reps={`${currentExercise.methods?.reps_min}-${currentExercise.methods?.reps_max}` || "12"}
            clientWorkoutId={todaySchedule?.client_workouts?.id || ""}
            sessionId={sessionId || ""}
            exerciseId={currentExercise.exercise_id}
          />
        )}

        {/* Exercise Notes */}
        {currentExercise.exercises?.contraindication && !showRestTimer && (
          <ExerciseNotes notes={currentExercise.exercises?.contraindication} />
        )}

        {/* Next Exercise Preview */}
        {nextExercise && !showRestTimer && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
              Próximo exercício
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {nextExercise.exercises?.thumbnail_url ? (
                  <img 
                    src={nextExercise.exercises.thumbnail_url} 
                    alt={nextExercise.exercises.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                    <span>💪</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {nextExercise.exercises?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextExercise.volumes?.num_series}x {nextExercise.methods?.reps_min}-{nextExercise.methods?.reps_max}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentExerciseIndex === 0}
            className="rounded-lg font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            ANTERIOR
          </Button>
          <Button 
            onClick={handleNext}
            className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            {currentExerciseIndex === totalExercises - 1 ? "FINALIZAR" : "PRÓXIMO"}
            {currentExerciseIndex < totalExercises - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
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
