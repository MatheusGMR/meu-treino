import { useEffect, useMemo, useReducer, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, X, Volume2, VolumeX, SkipForward } from "lucide-react";
import { ExerciseVideoPlayer } from "@/components/client/ExerciseVideoPlayer";
import { SeriesTracker } from "@/components/client/SeriesTracker";
import { RestTimer } from "@/components/client/RestTimer";
import { AbandonWorkoutDialog } from "@/components/client/AbandonWorkoutDialog";
import { useCompleteSession, useCompleteSet } from "@/hooks/useSessionCompletion";
import { useExerciseAudioCues } from "@/hooks/useExerciseAudioCues";
import { useAuth } from "@/hooks/useAuth";

type Phase = "prepare" | "execute" | "rest" | "done";

interface ExecState {
  exerciseIndex: number;
  currentSet: number;
  completedSets: number[];
  phase: Phase;
  weight: number;
  reps: string;
  restCanAdvance: boolean;
}

type ExecAction =
  | { type: "INIT"; reps: string }
  | { type: "START_EXECUTION" }
  | { type: "COMPLETE_SET"; isLastSetOfExercise: boolean }
  | { type: "REST_DONE" }
  | { type: "NEXT_SET" }
  | { type: "ADVANCE_EXERCISE"; reps: string; hasPreparation: boolean }
  | { type: "SET_WEIGHT"; weight: number }
  | { type: "SET_REPS"; reps: string };

const initialState: ExecState = {
  exerciseIndex: 0,
  currentSet: 1,
  completedSets: [],
  phase: "prepare",
  weight: 0,
  reps: "",
  restCanAdvance: false,
};

function reducer(state: ExecState, action: ExecAction): ExecState {
  switch (action.type) {
    case "INIT":
      return { ...state, reps: action.reps };
    case "START_EXECUTION":
      return { ...state, phase: "execute" };
    case "COMPLETE_SET":
      if (action.isLastSetOfExercise) {
        return {
          ...state,
          completedSets: [...state.completedSets, state.currentSet],
          phase: "done",
        };
      }
      return {
        ...state,
        completedSets: [...state.completedSets, state.currentSet],
        phase: "rest",
        restCanAdvance: false,
      };
    case "REST_DONE":
      return { ...state, restCanAdvance: true };
    case "NEXT_SET":
      return {
        ...state,
        currentSet: state.currentSet + 1,
        phase: "execute",
        restCanAdvance: false,
      };
    case "ADVANCE_EXERCISE":
      return {
        ...initialState,
        exerciseIndex: state.exerciseIndex + 1,
        reps: action.reps,
        phase: action.hasPreparation ? "prepare" : "execute",
      };
    case "SET_WEIGHT":
      return { ...state, weight: action.weight };
    case "SET_REPS":
      return { ...state, reps: action.reps };
    default:
      return state;
  }
}

const WorkoutSessionExecution = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [startTime] = useState(Date.now());
  const completeSessionMutation = useCompleteSession();
  const completeSetMutation = useCompleteSet();
  const { enabled: audioEnabled, setEnabled: setAudioEnabled, speak, stop: stopAudio, beep } =
    useExerciseAudioCues();

  const [state, dispatch] = useReducer(reducer, initialState);

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
      const today = new Date().toISOString().split("T")[0];
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

  const exercises = useMemo(() => session?.session_exercises || [], [session]);
  const totalExercises = exercises.length;
  const currentExercise = exercises[state.exerciseIndex];
  const nextExercise =
    state.exerciseIndex < totalExercises - 1 ? exercises[state.exerciseIndex + 1] : null;

  const isLastExercise = state.exerciseIndex >= totalExercises - 1;
  const totalSets = (currentExercise?.volumes as any)?.num_series || 3;
  const isLastSet = state.currentSet >= totalSets;
  const restSeconds = (currentExercise?.methods as any)?.rest_seconds || 60;
  const repsRange = currentExercise?.methods
    ? `${(currentExercise.methods as any).reps_min}-${(currentExercise.methods as any).reps_max}`
    : "12";

  const exerciseType = (currentExercise?.exercises as any)?.exercise_type as string | undefined;
  const showWeight = exerciseType === "Musculação";

  // Estimativa de duração da série (segundos) baseada em cadência × reps_max
  const method = currentExercise?.methods as any;
  const repsForTiming = method?.reps_max || 12;
  const cadenceTotal =
    (method?.cadence_contraction || 2) +
    (method?.cadence_pause || 0) +
    (method?.cadence_stretch || 2);
  const estimatedSetSeconds = Math.max(20, Math.min(90, repsForTiming * cadenceTotal));

  const preparationUrl = (currentExercise?.exercises as any)?.preparation_video_url as
    | string
    | null
    | undefined;
  const preparationDesc = (currentExercise?.exercises as any)?.preparation_description as
    | string
    | null
    | undefined;

  const elapsedMs = Date.now() - startTime;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Inicializar reps quando muda exercício
  useEffect(() => {
    if (currentExercise) {
      dispatch({ type: "INIT", reps: repsRange });
      // Se não há prep video, pular direto para execute
      if (state.phase === "prepare" && !preparationUrl) {
        dispatch({ type: "START_EXECUTION" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExercise?.id]);

  // Áudio contextual
  useEffect(() => {
    if (!currentExercise) return;
    const name = (currentExercise.exercises as any)?.name || "";
    if (state.phase === "prepare") {
      if (preparationDesc) speak(`Preparação. ${preparationDesc}`);
      else speak(`Preparando ${name}. Quando estiver pronto, toque em começar.`);
    } else if (state.phase === "execute") {
      speak(`Série ${state.currentSet} de ${totalSets}. Vamos lá.`);
    } else if (state.phase === "rest") {
      speak(`Boa! Descanse ${restSeconds} segundos.`);
    } else if (state.phase === "done") {
      speak(isLastExercise ? "Treino concluído! Excelente trabalho." : "Exercício concluído!");
    }
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentSet, currentExercise?.id]);

  // Auto-avançar quando done E não é último exercício
  useEffect(() => {
    if (state.phase !== "done") return;
    if (isLastExercise) return;
    const t = setTimeout(() => {
      const nextEx = exercises[state.exerciseIndex + 1] as any;
      const nextRange = nextEx?.methods
        ? `${nextEx.methods.reps_min}-${nextEx.methods.reps_max}`
        : "12";
      const hasPrep = !!nextEx?.exercises?.preparation_video_url;
      dispatch({ type: "ADVANCE_EXERCISE", reps: nextRange, hasPreparation: hasPrep });
    }, 1500);
    return () => clearTimeout(t);
  }, [state.phase, isLastExercise, exercises, state.exerciseIndex]);

  const completeSet = () => {
    // Registrar série no banco
    if (todaySchedule?.client_workouts?.id && sessionId && currentExercise) {
      completeSetMutation.mutate({
        clientWorkoutId: (todaySchedule.client_workouts as any).id,
        sessionId,
        exerciseId: (currentExercise as any).exercise_id,
        setNumber: state.currentSet,
        reps: state.reps || repsRange,
        weight: showWeight ? state.weight : 0,
        restTimeUsed: restSeconds,
      });
    }
    dispatch({ type: "COMPLETE_SET", isLastSetOfExercise: isLastSet });
  };

  // Timer de auto-conclusão da série quando o vídeo/áudio termina
  const [setTimeLeft, setSetTimeLeft] = useState(estimatedSetSeconds);
  useEffect(() => {
    if (state.phase !== "execute") {
      setSetTimeLeft(estimatedSetSeconds);
      return;
    }
    setSetTimeLeft(estimatedSetSeconds);
    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = estimatedSetSeconds - elapsed;
      if (left <= 0) {
        clearInterval(id);
        setSetTimeLeft(0);
        beep();
        completeSet();
      } else {
        setSetTimeLeft(left);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.currentSet, currentExercise?.id, estimatedSetSeconds]);

  const handlePrimaryAction = () => {
    if (state.phase === "prepare") {
      dispatch({ type: "START_EXECUTION" });
      return;
    }

    if (state.phase === "execute") {
      completeSet();
      return;
    }

    if (state.phase === "rest") {
      dispatch({ type: "NEXT_SET" });
      return;
    }

    if (state.phase === "done" && isLastExercise) {
      handleFinishWorkout();
      return;
    }
  };

  const handleFinishWorkout = () => {
    if (!todaySchedule?.id) return;
    completeSessionMutation.mutate(todaySchedule.id, {
      onSuccess: () => {
        navigate(`/client/workout/complete/${todaySchedule.id}`, {
          state: {
            startTime,
            exercisesCount: totalExercises,
            sessionName: session?.name,
          },
        });
      },
    });
  };

  const handleSkipExercise = () => {
    if (isLastExercise) {
      handleFinishWorkout();
      return;
    }
    const nextEx = exercises[state.exerciseIndex + 1] as any;
    const nextRange = nextEx?.methods
      ? `${nextEx.methods.reps_min}-${nextEx.methods.reps_max}`
      : "12";
    const hasPrep = !!nextEx?.exercises?.preparation_video_url;
    dispatch({ type: "ADVANCE_EXERCISE", reps: nextRange, hasPreparation: hasPrep });
  };

  const handleAbandon = (_reason: string) => {
    setShowAbandonDialog(false);
    stopAudio();
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

  // Determinar fonte de mídia
  const mainVideo =
    state.phase === "prepare" && preparationUrl
      ? preparationUrl
      : (currentExercise.exercises as any)?.video_url;
  const thumbnail = (currentExercise.exercises as any)?.thumbnail_url;

  // CTA contextual
  const ctaLabel =
    state.phase === "prepare"
      ? "COMEÇAR"
      : state.phase === "execute"
      ? isLastSet
        ? `CONCLUIR ÚLTIMA SÉRIE`
        : `CONCLUIR SÉRIE ${state.currentSet}`
      : state.phase === "rest"
      ? state.restCanAdvance
        ? "PRÓXIMA SÉRIE"
        : "PULAR DESCANSO"
      : isLastExercise
      ? "FINALIZAR TREINO"
      : "PRÓXIMO EXERCÍCIO";

  const ctaPulse = state.phase === "prepare" || (state.phase === "execute") || (state.phase === "rest" && state.restCanAdvance) || (state.phase === "done" && isLastExercise);

  return (
    <div className="client-dark min-h-screen bg-background text-foreground flex flex-col">
      {/* Vídeo no topo */}
      <div className="relative w-full aspect-video bg-muted flex-shrink-0">
        {mainVideo ? (
          <ExerciseVideoPlayer
            mediaUrl={mainVideo}
            mediaType="video"
            exerciseName={(currentExercise.exercises as any)?.name || ""}
            autoplay
            loop={state.phase === "prepare"}
            mute={false}
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={(currentExercise.exercises as any)?.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <span className="text-5xl">🏋️</span>
          </div>
        )}

        <button
          onClick={() => setShowAbandonDialog(true)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
          aria-label="Sair do treino"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
          aria-label={audioEnabled ? "Desativar áudio guia" : "Ativar áudio guia"}
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5 text-foreground" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {state.phase === "prepare" && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-md bg-background/70 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
              Preparação
            </p>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col px-5 pt-5 pb-32 overflow-y-auto">
        {/* Cabeçalho exercício */}
        <div className="text-center mb-3">
          <h2 className="text-2xl font-bold text-foreground">
            {(currentExercise.exercises as any)?.name}
          </h2>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mt-1">
            Exercício {state.exerciseIndex + 1} de {totalExercises}
          </p>
        </div>

        {/* Progress segmentado */}
        <div className="flex gap-1 mb-4">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < state.exerciseIndex
                  ? "bg-primary"
                  : i === state.exerciseIndex
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Tempo
            </p>
            <p className="text-primary font-bold text-base mt-0.5">
              {String(elapsedMin).padStart(2, "0")}:{String(elapsedSec).padStart(2, "0")}
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Fase
            </p>
            <p className="text-primary font-bold text-sm mt-0.5 uppercase">
              {state.phase === "prepare"
                ? "Preparar"
                : state.phase === "execute"
                ? "Ativo"
                : state.phase === "rest"
                ? "Descanso"
                : "Concluído"}
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Série
            </p>
            <p className="text-primary font-bold text-base mt-0.5">
              {state.currentSet}/{totalSets}
            </p>
          </div>
        </div>

        {/* Conteúdo principal por fase */}
        {state.phase === "prepare" && preparationDesc && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-2">
              Como se posicionar
            </p>
            <p className="text-sm text-foreground leading-relaxed">{preparationDesc}</p>
          </div>
        )}

        {state.phase === "execute" && (
          <SeriesTracker
            sets={totalSets}
            reps={repsRange}
            exerciseId={(currentExercise as any).exercise_id}
            currentSet={state.currentSet}
            completedSets={state.completedSets}
            showWeight={showWeight}
            weight={state.weight}
            onWeightChange={(w) => dispatch({ type: "SET_WEIGHT", weight: w })}
            repsCompleted={state.reps}
            onRepsChange={(r) => dispatch({ type: "SET_REPS", reps: r })}
          />
        )}

        {state.phase === "rest" && (
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center mb-4">
            <RestTimer
              restTime={restSeconds}
              autoStart
              onComplete={() => {
                dispatch({ type: "REST_DONE" });
                beep();
                speak("Pronto para a próxima série.");
              }}
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Próxima: Série {state.currentSet + 1} de {totalSets}
            </p>
          </div>
        )}

        {state.phase === "done" && !isLastExercise && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-6 text-center mb-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <CheckIcon />
            </div>
            <p className="font-bold text-primary">Exercício concluído!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Avançando para o próximo...
            </p>
          </div>
        )}

        {/* Próximo exercício */}
        {nextExercise && state.phase !== "done" && (
          <div className="mt-auto">
            <div className="flex items-center gap-3 rounded-xl bg-card border border-border p-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {(nextExercise.exercises as any)?.thumbnail_url ? (
                  <img
                    src={(nextExercise.exercises as any).thumbnail_url}
                    alt={(nextExercise.exercises as any).name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span>💪</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  Próximo
                </p>
                <p className="font-bold text-sm text-primary truncate">
                  {(nextExercise.exercises as any)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(nextExercise.volumes as any)?.num_series}x{" "}
                  {(nextExercise.methods as any)?.reps_min}-
                  {(nextExercise.methods as any)?.reps_max}
                </p>
              </div>
              <button
                onClick={handleSkipExercise}
                className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                aria-label="Pular exercício"
                title="Pular exercício"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CTA fixo */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handlePrimaryAction}
          disabled={completeSetMutation.isPending || completeSessionMutation.isPending}
          aria-label={ctaLabel}
          className={`w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
            ctaPulse ? "animate-pulse" : ""
          } motion-reduce:animate-none`}
        >
          {ctaLabel}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <AbandonWorkoutDialog
        open={showAbandonDialog}
        onOpenChange={setShowAbandonDialog}
        onConfirm={handleAbandon}
      />
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default WorkoutSessionExecution;
