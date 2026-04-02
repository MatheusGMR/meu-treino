import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertTriangle, Clock, Plus, MoreHorizontal } from "lucide-react";

interface AbandonWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

const reasons = [
  {
    id: "difficult",
    icon: AlertTriangle,
    title: "Muito difícil",
    description: "Quero um treino mais fácil",
  },
  {
    id: "long",
    icon: Clock,
    title: "Muito longo",
    description: "Quero passar menos tempo me exercitando",
  },
  {
    id: "exploring",
    icon: Plus,
    title: "Só estou conhecendo",
    description: "Quero me exercitar mais tarde",
  },
  {
    id: "other",
    icon: MoreHorizontal,
    title: "Outros",
    description: "Motivos pessoais",
  },
];

export const AbandonWorkoutDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: AbandonWorkoutDialogProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [step, setStep] = useState<'confirm' | 'reason'>('confirm');

  const handleClose = () => {
    setStep('confirm');
    setSelectedReason(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="client-dark bg-card border-border text-foreground max-w-sm mx-auto p-0 gap-0 [&>button]:hidden">
        {step === 'confirm' ? (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-6">Encerrar o treino?</h2>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-lg border-2 border-border text-foreground font-bold text-sm uppercase tracking-wider hover:border-foreground transition-all"
              >
                NÃO
              </button>
              <button
                onClick={() => setStep('reason')}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
              >
                SIM
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground text-center mb-1">
              Já está saindo do treino?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Nos ajude a melhorar</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`
                      flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all text-center min-h-[120px]
                      ${isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/50 hover:border-primary/50'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-primary/70'}`} />
                    <span className="font-bold text-sm text-foreground">{reason.title}</span>
                    <span className="text-[11px] text-muted-foreground mt-1 leading-tight">{reason.description}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => selectedReason && onConfirm(selectedReason)}
              disabled={!selectedReason}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider disabled:opacity-50 hover:bg-primary/90 transition-all"
            >
              ENVIAR
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
