import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  onPreview?: () => void;
}

export function SelectionCard({ 
  title, 
  subtitle, 
  isSelected, 
  onClick, 
  disabled,
  onPreview
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-3 rounded-lg border-2 text-left transition-all relative group",
        "hover:shadow-md hover:scale-[1.02]",
        isSelected 
          ? "border-primary bg-primary/10 shadow-sm" 
          : "border-border bg-card hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <div className="font-medium text-sm leading-tight pr-7 break-words">{title}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground leading-tight mt-1">
          {subtitle}
        </div>
      )}
      {onPreview && (
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          type="button"
        >
          <Eye className="w-4 h-4" />
        </Button>
      )}
    </button>
  );
}
