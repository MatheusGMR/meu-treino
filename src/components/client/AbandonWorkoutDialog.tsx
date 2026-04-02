import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface AbandonWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const reasons = [
  { id: "too_hard", label: "Muito difícil", emoji: "😰" },
  { id: "too_long", label: "Muito longo", emoji: "⏰" },
  { id: "pain", label: "Sentindo dor", emoji: "🤕" },
  { id: "exploring", label: "Só conhecendo", emoji: "👀" },
  { id: "other", label: "Outro motivo", emoji: "💭" },
];

export const AbandonWorkoutDialog = ({ open, onOpenChange, onConfirm }: AbandonWorkoutDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Encerrar treino?</AlertDialogTitle>
          <AlertDialogDescription>
            Seu progresso parcial será salvo. Nos diga o motivo para melhorarmos sua experiência.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          {reasons.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left text-sm font-medium
                ${selectedReason === reason.id 
                  ? 'border-primary bg-primary/5 text-foreground' 
                  : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
            >
              <span className="text-lg">{reason.emoji}</span>
              {reason.label}
            </button>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Continuar treino</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedReason || "other")}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={!selectedReason}
          >
            Encerrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
