import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Dumbbell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        .select(`
          *,
          session_exercises (
            *,
            exercises (*),
            volumes (*),
            methods (*)
          )
        `)
        .eq("id", workoutId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workoutId,
  });

  const exercises = session?.session_exercises || [];
  const equipmentSet = new Set(
    exercises.flatMap(ex => ex.exercises?.equipment || [])
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="p-5 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            
            <button className="p-2 hover:bg-muted rounded-full transition-colors">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">
            Treino de Hoje
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {session.name}
          </h1>
        </div>
      </header>

      {/* Info Grid */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border text-center transition-all hover:border-primary hover:shadow-sm">
            <p className="text-xs uppercase text-muted-foreground font-medium">Exercícios</p>
            <p className="text-xl font-bold text-foreground mt-1">{exercises.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center transition-all hover:border-primary hover:shadow-sm">
            <p className="text-xs uppercase text-muted-foreground font-medium">Séries</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {exercises.reduce((sum, ex) => sum + (ex.volumes?.num_series || 0), 0)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-border text-center transition-all hover:border-primary hover:shadow-sm">
            <p className="text-xs uppercase text-muted-foreground font-medium">Tipo</p>
            <p className="text-sm font-bold text-foreground mt-1 truncate">
              {session.session_type || 'Geral'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* Equipment Section */}
        {equipmentSet.size > 0 && (
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">
              Equipamento
            </h2>
            <div className="rounded-lg p-4 border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">
                    {Array.from(equipmentSet).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {equipmentSet.size} item{equipmentSet.size > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Exercise List */}
        <section>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-base font-bold text-foreground">
              Exercícios
            </h2>
            <span className="text-sm text-primary font-semibold">
              {exercises.length}
            </span>
          </div>
          
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
        </section>

        {session.description && (
          <section>
            <h2 className="text-base font-bold text-foreground mb-2">
              Descrição
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {session.description}
            </p>
          </section>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-6">
        <Button 
          size="lg" 
          className="w-full rounded-lg text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 transition-all duration-200 hover:shadow-lg"
          onClick={() => navigate(`/client/workout/session/${workoutId}`)}
        >
          COMEÇAR TREINO
        </Button>
      </div>
    </div>
  );
};

export default WorkoutDetails;
