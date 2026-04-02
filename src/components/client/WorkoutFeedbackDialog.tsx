import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WorkoutFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: string) => void;
}

const ratings = [
  { id: "easy", label: "Fácil", emoji: "😊", color: "border-green-300 bg-green-50 hover:border-green-500" },
  { id: "ideal", label: "Ideal", emoji: "💪", color: "border-primary/30 bg-primary/5 hover:border-primary" },
  { id: "hard", label: "Difícil", emoji: "🥵", color: "border-orange-300 bg-orange-50 hover:border-orange-500" },
];

export const WorkoutFeedbackDialog = ({ open, onOpenChange, onSubmit }: WorkoutFeedbackDialogProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-foreground">Como foi o treino?</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {ratings.map((rating) => (
            <button
              key={rating.id}
              onClick={() => setSelected(rating.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${selected === rating.id 
                  ? 'border-primary bg-primary/10 scale-105' 
                  : rating.color
                }`}
            >
              <span className="text-3xl">{rating.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{rating.label}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={() => selected && onSubmit(selected)}
          disabled={!selected}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
        >
          Enviar feedback
        </Button>
      </DialogContent>
    </Dialog>
  );
};
