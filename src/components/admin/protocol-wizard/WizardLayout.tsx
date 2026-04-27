import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const StepHeader = ({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="flex gap-3 pb-4 mb-5 border-b border-border">
    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
);

export const StepFooter = ({
  onPrev,
  onNext,
  nextDisabled,
  nextLabel = "Próximo",
}: {
  onPrev?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) => (
  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
    {onPrev ? (
      <Button type="button" variant="outline" size="sm" onClick={onPrev}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>
    ) : (
      <div />
    )}
    <Button type="button" size="sm" onClick={onNext} disabled={nextDisabled}>
      {nextLabel}
      <ChevronRight className="w-4 h-4 ml-1" />
    </Button>
  </div>
);
