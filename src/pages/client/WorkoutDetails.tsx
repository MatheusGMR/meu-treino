import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Download, Share2, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen bg-white pb-24">
        <div className="p-5 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border/50 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            
            <div className="flex gap-2">
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Heart className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Download className="w-5 h-5 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          <Badge variant="secondary" className="mb-2">
            Treino de Hoje
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">
            {session.name}
          </h1>
        </div>
      </header>

      <div className="px-5 py-6 space-y-8">
        {/* Equipment Section */}
        {equipmentSet.size > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Equipamento
            </h2>
            <div className="bg-card rounded-[16px] p-4 border border-border/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
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
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-lg font-bold text-foreground">
              {session.session_type || 'Exercícios'}
            </h2>
            <span className="text-sm text-warning font-semibold">
              {exercises.length} exercício{exercises.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
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
            <h2 className="text-lg font-bold text-foreground mb-3">
              Descrição
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {session.description}
            </p>
          </section>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 p-5 pb-8 shadow-lg">
        <Button 
          size="lg" 
          className="w-full rounded-[30px] text-base font-bold shadow-lg"
          onClick={() => navigate(`/client/workout/session/${workoutId}`)}
        >
          COMECE A TREINAR
        </Button>
      </div>
    </div>
  );
};

export default WorkoutDetails;
