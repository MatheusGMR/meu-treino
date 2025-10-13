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
          <div className="flex gap-2">
            <Badge variant="outline">{exercise.exercise_group}</Badge>
            <Badge>{exercise.intensity}</Badge>
          </div>

          {exercise.media_url && (
            <div className="rounded-lg overflow-hidden border">
              {exercise.media_type === "video" ? (
                <video
                  src={exercise.media_url}
                  controls
                  className="w-full max-h-96"
                />
              ) : (
                <img
                  src={exercise.media_url}
                  alt={exercise.name}
                  className="w-full max-h-96 object-cover"
                />
              )}
            </div>
          )}

          {exercise.equipment && (
            <div>
              <h4 className="font-medium mb-1">Equipamento</h4>
              <p className="text-muted-foreground">{exercise.equipment}</p>
            </div>
          )}

          {exercise.description && (
            <div>
              <h4 className="font-medium mb-1">Descrição</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {exercise.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
