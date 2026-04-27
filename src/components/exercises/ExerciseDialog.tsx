import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtocolExerciseWizard } from "@/components/admin/protocol-wizard/ProtocolExerciseWizard";
import type { Database } from "@/integrations/supabase/types";
import type { ProtocolExercise } from "@/hooks/useProtocolBank";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExerciseDialogProps {
  exercise?: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog único de exercícios — usa a metodologia JMP (Bloco + Equipamento +
 * Segurança + Nível + Detalhes) com geração automática de ID. Não há mais
 * "Biblioteca v2.0" separada: existe apenas UMA biblioteca de exercícios,
 * regida pelos critérios da metodologia revisada.
 */
export const ExerciseDialog = ({
  exercise,
  open,
  onOpenChange,
}: ExerciseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "Editar Exercício" : "Novo Exercício"}
          </DialogTitle>
          <DialogDescription>
            Preencha em sequência — o ID é gerado automaticamente a partir de
            Bloco + Equipamento + Segurança + Nível.
          </DialogDescription>
        </DialogHeader>

        <ProtocolExerciseWizard
          exercise={(exercise as unknown as ProtocolExercise) ?? null}
          onClose={() => onOpenChange(false)}
          protocolOnly={false}
        />
      </DialogContent>
    </Dialog>
  );
};
