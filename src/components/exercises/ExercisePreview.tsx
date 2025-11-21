import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExercisePreviewProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExercisePreview = ({
  exercise,
  open,
  onOpenChange,
}: ExercisePreviewProps) => {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tipo</p>
              <Badge variant="outline">{exercise.exercise_type}</Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Grupo Muscular</p>
              <Badge variant="outline">{exercise.exercise_group}</Badge>
            </div>
          </div>

          {exercise.level && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Nível</p>
              <Badge>{exercise.level}</Badge>
            </div>
          )}

          {exercise.primary_muscle && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Músculo Primário</p>
              <Badge variant="secondary">{exercise.primary_muscle}</Badge>
            </div>
          )}

          {exercise.secondary_muscle && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Músculo Secundário</p>
              <Badge variant="secondary">{exercise.secondary_muscle}</Badge>
            </div>
          )}

          {exercise.equipment && exercise.equipment.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Equipamentos</p>
              <div className="flex gap-2 flex-wrap">
                {exercise.equipment.map((eq: string) => (
                  <Badge key={eq} variant="outline">{eq}</Badge>
                ))}
              </div>
            </div>
          )}

          {exercise.impact_level && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Nível de Impacto</p>
              <Badge variant="outline">{exercise.impact_level}</Badge>
            </div>
          )}

          {exercise.biomechanical_class && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Classe Biomecânica</p>
              <p className="text-sm">{exercise.biomechanical_class}</p>
            </div>
          )}

          {exercise.dominant_movement && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Movimento Dominante</p>
              <p className="text-sm">{exercise.dominant_movement}</p>
            </div>
          )}

          {exercise.video_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Vídeo</p>
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Ver vídeo demonstrativo →
              </a>
            </div>
          )}

          {exercise.contraindication && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Contraindicação</p>
              <p className="text-sm bg-destructive/10 p-3 rounded-lg">{exercise.contraindication}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
