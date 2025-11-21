import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { ExerciseVideoPlayer } from "@/components/client/ExerciseVideoPlayer";
import { SeriesTracker } from "@/components/client/SeriesTracker";
import { RestTimer } from "@/components/client/RestTimer";
import { ExerciseNotes } from "@/components/client/ExerciseNotes";
import { SessionProgressBar } from "@/components/client/SessionProgressBar";
import { useCompleteSession } from "@/hooks/useSessionCompletion";
import { toast } from "@/hooks/use-toast";

const WorkoutSessionExecution = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const completeSessionMutation = useCompleteSession();

  useEffect(() => {
    // Força dark mode
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

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
        toast({
          title: "🎉 Parabéns!",
          description: "Treino completado com sucesso!",
        });
        setTimeout(() => navigate("/client/dashboard"), 2000);
      },
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!session || !currentExercise) {
    return <div className="flex items-center justify-center min-h-screen">Sessão não encontrada</div>;
  }

  const nextExercise = currentExerciseIndex < totalExercises - 1 
    ? exercises[currentExerciseIndex + 1] 
    : null;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Video/Image Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black">
        {currentExercise.exercises?.video_url && (
          <div className="w-full h-full opacity-40">
            <ExerciseVideoPlayer
              mediaUrl={currentExercise.exercises?.video_url}
              exerciseName={currentExercise.exercises?.name || ""}
            />
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => navigate("/client/dashboard")}
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Timer Overlay (Centered) */}
      {showRestTimer ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-wider text-white/70 mb-2">DESCANSO</p>
            <RestTimer
              restTime={currentExercise.methods?.rest_seconds || 60}
              onComplete={() => setShowRestTimer(false)}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setShowRestTimer(false)}
            className="rounded-[30px]"
          >
            PULAR
          </Button>
        </div>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 px-6">
          <p className="text-sm uppercase tracking-wider text-white/70 mb-2">
            {session.session_type || 'EXERCÍCIO'}
          </p>
          <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-8">
            {currentExercise.exercises?.name}
          </h2>
        </div>
      )}

      {/* Control Panel (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-20 shadow-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <SessionProgressBar 
            current={currentExerciseIndex + 1} 
            total={totalExercises} 
          />
        </div>

        {/* Series Tracker */}
        {!showRestTimer && (
          <div className="mb-6">
            <SeriesTracker
              sets={currentExercise.volumes?.num_series || 3}
              reps={`${currentExercise.methods?.reps_min}-${currentExercise.methods?.reps_max}` || "12"}
              clientWorkoutId={todaySchedule?.client_workouts?.id || ""}
              sessionId={sessionId || ""}
              exerciseId={currentExercise.exercise_id}
            />
          </div>
        )}

        {/* Exercise Notes */}
        {currentExercise.exercises?.contraindication && !showRestTimer && (
          <div className="mb-6">
            <ExerciseNotes notes={currentExercise.exercises?.contraindication} />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentExerciseIndex === 0}
            className="rounded-[30px]"
          >
            ANTERIOR
          </Button>
          <Button 
            onClick={handleNext}
            className="rounded-[30px] bg-primary hover:bg-primary/90"
          >
            {currentExerciseIndex === totalExercises - 1 ? "FINALIZAR" : "PRÓXIMO"}
          </Button>
        </div>

        {/* Next Exercise Preview */}
        {nextExercise && !showRestTimer && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs uppercase text-muted-foreground mb-2">
              Próximo exercício
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-muted flex-shrink-0">
                {nextExercise.exercises?.thumbnail_url ? (
                  <img 
                    src={nextExercise.exercises.thumbnail_url} 
                    alt={nextExercise.exercises.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
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
    </div>
  );
};

export default WorkoutSessionExecution;
