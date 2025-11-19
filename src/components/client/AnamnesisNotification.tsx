import { AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export const AnamnesisNotification = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Alert className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 bg-accent/95 border-accent shadow-xl shadow-accent/20 backdrop-blur-sm animate-in slide-in-from-top-4 duration-500">
      <AlertCircle className="h-5 w-5 text-accent-foreground" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold text-accent-foreground mb-1">
            Anamnese Pendente
          </p>
          <p className="text-sm text-accent-foreground/90">
            Seu personal solicitou que você preencha ou atualize sua anamnese.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate("/client/anamnesis")}
            className="bg-primary hover:bg-primary/90"
          >
            Preencher Agora
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="hover:bg-accent-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
