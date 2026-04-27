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
      <DialogContent className="max-w-2xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-3 border-b shrink-0">
          <DialogTitle className="pr-8">
            {exercise ? "Editar exercício do Protocolo" : "Novo exercício do Protocolo"}
          </DialogTitle>
          <DialogDescription>
            Preencha em sequência — o ID JMP é gerado automaticamente a partir de Bloco +
            Equipamento + Segurança + Nível.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-auto p-6">
          <ProtocolExerciseWizard exercise={exercise ?? null} onClose={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
