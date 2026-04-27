import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/protocol/exerciseTaxonomy";

interface Props {
  current: number;
  done: number[];
  onJump: (step: number) => void;
}

export const WizardStepper = ({ current, done, onJump }: Props) => {
  const max = Math.max(current, ...done);
  return (
    <div className="flex gap-1 p-1.5 rounded-xl bg-muted/40 border border-border">
      {STEPS.map((label, i) => {
        const isActive = current === i;
        const isDone = done.includes(i);
        const canClick = i <= max;
        return (
          <button
            key={i}
            type="button"
            disabled={!canClick}
            onClick={() => canClick && onJump(i)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 px-1 py-2 rounded-lg transition-all",
              isActive && "bg-primary text-primary-foreground shadow-md shadow-primary/30",
              !isActive && isDone && "bg-primary/10 text-primary",
              !isActive && !isDone && "text-muted-foreground",
              canClick && !isActive && "hover:bg-muted cursor-pointer",
              !canClick && "cursor-default"
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isActive && "bg-primary-foreground/25",
                !isActive && isDone && "bg-primary text-primary-foreground",
                !isActive && !isDone && "bg-muted"
              )}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className="text-[10px] font-semibold leading-none text-center">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
