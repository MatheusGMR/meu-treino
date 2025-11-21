import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewBadgeProps {
  addedAt: string;
  sourceReference?: string | null;
}

export const NewBadge = ({ addedAt, sourceReference }: NewBadgeProps) => {
  const timeAgo = formatDistanceToNow(new Date(addedAt), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse cursor-help"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Novo
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-xs font-medium">Adicionado {timeAgo}</p>
            {sourceReference && (
              <p className="text-xs text-muted-foreground max-w-xs truncate">
                Fonte: {sourceReference}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
