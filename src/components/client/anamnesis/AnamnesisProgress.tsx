import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnamnesisProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  "Identificação",
  "Composição",
  "Histórico",
  "Limitações",
  "Objetivos",
  "Hábitos",
  "Logística",
  "Final"
];

export const AnamnesisProgress = ({ currentStep, totalSteps }: AnamnesisProgressProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                currentStep === step 
                  ? "bg-primary text-primary-foreground" 
                  : currentStep > step 
                  ? "bg-green-500 text-white" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step ? <Check className="w-5 h-5" /> : step}
            </div>
            <span className="text-xs mt-2 text-center hidden sm:block">
              {stepLabels[step - 1]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 sm:hidden text-center">
        <span className="text-sm font-medium">{stepLabels[currentStep - 1]}</span>
      </div>
    </div>
  );
};
