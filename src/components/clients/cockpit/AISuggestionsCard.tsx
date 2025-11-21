import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface AISuggestionsCardProps {
  suggestions: {
    sessions: string;
    recommendations: string[];
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
      <CardContent className="space-y-3 text-xs max-h-[400px] overflow-y-auto">
        {/* Frequência */}
        <div className="space-y-1">
          <span className="font-medium">Frequência:</span>
          <p className="text-muted-foreground leading-relaxed">{suggestions.sessions}</p>
        </div>

        {/* Recomendações Consolidadas */}
        {suggestions.recommendations.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <span className="font-medium">Recomendações:</span>
            <ul className="space-y-1.5 pl-4">
              {suggestions.recommendations.map((item, idx) => (
                <li key={idx} className="text-muted-foreground leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
