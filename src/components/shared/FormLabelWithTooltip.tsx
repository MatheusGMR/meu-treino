import { FormLabel } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface FormLabelWithTooltipProps {
  children: React.ReactNode;
  tooltip: string;
  required?: boolean;
}

export const FormLabelWithTooltip = ({ children, tooltip, required }: FormLabelWithTooltipProps) => (
  <div className="flex items-center gap-1.5">
    <FormLabel>
      {children} {required && "*"}
    </FormLabel>
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild type="button">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]" sideOffset={5}>
          <p className="text-xs leading-relaxed">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);
