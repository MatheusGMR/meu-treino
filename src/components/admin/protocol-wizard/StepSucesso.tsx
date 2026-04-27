import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

interface Props {
  generatedId: string;
  onAddAnother: () => void;
  onClose: () => void;
}

export const StepSucesso = ({ generatedId, onAddAnother, onClose }: Props) => (
  <div className="text-center py-6">
    <div className="inline-flex w-16 h-16 rounded-full bg-primary/15 text-primary items-center justify-center mb-4">
      <PartyPopper className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-bold text-foreground mb-1">Exercício cadastrado!</h3>
    <p className="text-sm text-muted-foreground mb-5">
      Disponível imediatamente para os perfis compatíveis
    </p>
    <div className="inline-block bg-foreground text-background font-mono text-lg px-5 py-3 rounded-xl tracking-[2px] mb-6">
      {generatedId}
    </div>
    <div className="flex gap-2 justify-center">
      <Button variant="outline" onClick={onAddAnother}>
        + Cadastrar outro
      </Button>
      <Button onClick={onClose}>Ver biblioteca</Button>
    </div>
  </div>
);
