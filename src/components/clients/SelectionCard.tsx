import { cn } from "@/lib/utils";
import { Eye, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  onPreview?: () => void;
  hasWarning?: boolean;
  warningMessage?: string;
  warningSeverity?: 'warning' | 'error';
}

export function SelectionCard({ 
  title, 
  subtitle, 
  isSelected, 
  onClick, 
  disabled,
  onPreview,
  hasWarning,
  warningMessage,
  warningSeverity = 'warning'
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
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        hasWarning && warningSeverity === 'error' && "border-destructive/50 bg-destructive/5",
        hasWarning && warningSeverity === 'warning' && "border-yellow-500/50 bg-yellow-500/5"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-tight pr-7 break-words">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground leading-tight mt-1">
              {subtitle}
            </div>
          )}
        </div>
        {hasWarning && warningMessage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={warningSeverity === 'error' ? 'destructive' : 'secondary'}
                  className={cn(
                    "h-5 px-1.5 shrink-0",
                    warningSeverity === 'warning' && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30"
                  )}
                >
                  {warningSeverity === 'error' ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs font-semibold mb-1">⚠️ Contraindicação</p>
                <p className="text-xs">{warningMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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
