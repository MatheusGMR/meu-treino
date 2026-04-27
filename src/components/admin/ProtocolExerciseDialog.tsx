import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProtocolExercise } from "@/hooks/useProtocolBank";
import { ProtocolExerciseWizard } from "./protocol-wizard/ProtocolExerciseWizard";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exercise?: ProtocolExercise | null;
}

export const ProtocolExerciseDialog = ({ open, onOpenChange, exercise }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {exercise ? "Editar exercício do Protocolo" : "Novo exercício do Protocolo"}
          </DialogTitle>
          <DialogDescription>
            Preencha em sequência — o ID JMP é gerado automaticamente a partir de Bloco +
            Equipamento + Segurança + Nível.
          </DialogDescription>
        </DialogHeader>

        <ProtocolExerciseWizard exercise={exercise ?? null} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
