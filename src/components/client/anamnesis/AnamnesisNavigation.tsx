import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface AnamnesisNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  loading: boolean;
}

export const AnamnesisNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  loading,
}: AnamnesisNavigationProps) => {
  return (
    <div className="flex justify-between gap-2 mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1 || loading}
        className="w-full sm:w-auto min-w-[120px]"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Anterior
      </Button>

      {currentStep < totalSteps ? (
        <Button onClick={onNext} disabled={loading} className="w-full sm:w-auto min-w-[120px]">
          Próximo
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={loading} className="w-full sm:w-auto min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Concluir"
          )}
        </Button>
      )}
    </div>
  );
};
