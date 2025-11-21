import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb } from "lucide-react";

interface AISuggestionsCardProps {
  suggestions: {
    sessions: string;
    mandatory: string[];
    recommendations: string[];
    warnings: string[];
  };
}

export const AISuggestionsCard = ({ suggestions }: AISuggestionsCardProps) => {
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Sugestão Automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Montagem Sugerida */}
        <div className="space-y-1">
          <span className="font-medium">Sugestão de montagem:</span>
          <p className="text-muted-foreground">{suggestions.sessions}</p>
        </div>

        {/* Inclusão Obrigatória */}
        {suggestions.mandatory.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <span className="font-medium flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              Inclusão obrigatória:
            </span>
            <ul className="space-y-0.5 pl-6">
              {suggestions.mandatory.map((item, idx) => (
                <li key={idx} className="text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recomendações */}
        {suggestions.recommendations.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <span className="font-medium">Recomendações:</span>
            <ul className="space-y-0.5 pl-6">
              {suggestions.recommendations.map((item, idx) => (
                <li key={idx} className="text-muted-foreground">• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Avisos */}
        {suggestions.warnings.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {suggestions.warnings.map((warning, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{warning}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
