import { cn } from "@/lib/utils";

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function SelectionCard({ 
  title, 
  subtitle, 
  isSelected, 
  onClick, 
  disabled 
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-3 rounded-lg border-2 text-left transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        isSelected 
          ? "border-primary bg-primary/10 shadow-sm" 
          : "border-border bg-card hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <div className="font-medium text-sm">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </div>
      )}
    </button>
  );
}
