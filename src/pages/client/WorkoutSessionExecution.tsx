import { useState } from "react";
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

  const { data: session, isLoading } = useQuery({
    queryKey: ["session-execution", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_exercises (
            *,
            exercises (*)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/client/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold">{session.description}</h1>
            <div className="w-24" />
          </div>
          <SessionProgressBar 
            current={currentExerciseIndex + 1} 
            total={totalExercises} 
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h2 className="text-3xl font-bold text-center text-foreground">
          {currentExercise.exercises?.name}
        </h2>

        <ExerciseVideoPlayer
          mediaUrl={currentExercise.exercises?.media_url}
          mediaType={currentExercise.exercises?.media_type}
          exerciseName={currentExercise.exercises?.name || ""}
        />

        {!showRestTimer ? (
          <>
            <SeriesTracker
              sets={currentExercise.sets || 3}
              reps={currentExercise.reps || "12"}
              clientWorkoutId={todaySchedule?.client_workouts?.id || ""}
              sessionId={sessionId || ""}
              exerciseId={currentExercise.exercise_id}
            />

            <ExerciseNotes notes={currentExercise.notes} />

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setShowRestTimer(true)}
                disabled={!currentExercise.rest_time}
              >
                Iniciar Descanso ({currentExercise.rest_time || 0}s)
              </Button>
            </div>
          </>
        ) : (
          <RestTimer
            restTime={currentExercise.rest_time || 60}
            onComplete={() => setShowRestTimer(false)}
          />
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentExerciseIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <Button onClick={handleNext}>
            {currentExerciseIndex === totalExercises - 1 ? "Finalizar" : "Próximo"}
            {currentExerciseIndex < totalExercises - 1 && (
              <ChevronRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSessionExecution;
