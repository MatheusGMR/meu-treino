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

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Grupo Muscular</p>
            <Badge variant="outline">{exercise.exercise_group}</Badge>
          </div>

          {exercise.video_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Vídeo</p>
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {exercise.video_url}
              </a>
            </div>
          )}

          {exercise.contraindication && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Contraindicação</p>
              <p className="text-sm">{exercise.contraindication}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
