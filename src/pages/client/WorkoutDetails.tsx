import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, Dumbbell } from "lucide-react";
import { ExerciseListItem } from "@/components/client/ExerciseListItem";
import { Skeleton } from "@/components/ui/skeleton";

const WorkoutDetails = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ["workout-details", workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error("Workout ID required");
      const { data, error } = await supabase
        .from("sessions")
        .select(`*, session_exercises (*, exercises (*), volumes (*), methods (*))`)
        .eq("id", workoutId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });

  const exercises = session?.session_exercises || [];

  if (isLoading) {
    return (
      <div className="client-dark min-h-screen bg-background pb-24">
        <div className="p-5 space-y-4">
          <Skeleton className="h-64 w-full rounded-lg bg-muted" />
          <Skeleton className="h-12 w-3/4 bg-muted" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="client-dark min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
      </div>
    );
  }

  const heroImage = exercises[0]?.exercises?.thumbnail_url;

  return (
    <div className="client-dark min-h-screen bg-background text-foreground pb-32">
      {/* Hero Image */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt={session.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <Dumbbell className="w-20 h-20 text-muted-foreground" />
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Info Card */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="rounded-2xl bg-card border border-border p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {session.name}
          </h1>

          <div className="flex gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-primary font-semibold">
              <Clock className="w-3.5 h-3.5" /> 45 min
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-primary font-semibold">
              <Dumbbell className="w-3.5 h-3.5" /> {exercises.length} exercícios
            </span>
          </div>

          <button
            onClick={() => navigate(`/client/workout/session/${workoutId}`)}
            className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_hsl(348_83%_47%/0.4)]"
          >
            COMECE A TREINAR
          </button>
        </div>
      </div>

      {/* Focus Areas */}
      {session.session_type && (
        <div className="px-5 mt-5">
          <div className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Áreas de foco:</p>
              <p className="text-foreground font-bold">{session.session_type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="px-5 mt-5">
        <h2 className="text-base font-bold text-foreground mb-3">Exercícios</h2>
        <div className="space-y-2">
          {exercises.map((exercise) => (
            <ExerciseListItem
              key={exercise.id}
              name={exercise.exercises?.name || 'Exercício'}
              sets={exercise.volumes?.num_series}
              reps={`${exercise.methods?.reps_min}-${exercise.methods?.reps_max}`}
              thumbnailUrl={exercise.exercises?.thumbnail_url}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetails;
