import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles } from "lucide-react";

const MOOD_EMOJIS: Record<string, string> = {
  otimo: "💪",
  bem: "😊",
  cansado: "😴",
  com_dor: "🤕",
  indisposto: "😔",
};

const MOOD_LABELS: Record<string, string> = {
  otimo: "Ótimo",
  bem: "Bem",
  cansado: "Cansado",
  com_dor: "Com dor",
  indisposto: "Indisposto",
};

const MOOD_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  otimo: "default",
  bem: "secondary",
  cansado: "outline",
  com_dor: "destructive",
  indisposto: "destructive",
};

interface ClientCheckinCardProps {
  clientId: string;
}

export const ClientCheckinCard = ({ clientId }: ClientCheckinCardProps) => {
  const { data: checkin, isLoading } = useQuery({
    queryKey: ["client-checkin", clientId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("client_id", clientId)
        .eq("checkin_date", today)
        .maybeSingle();
      return data;
    },
    enabled: !!clientId,
  });

  if (isLoading || !checkin) return null;

  const analysis = checkin.ai_suggestions as any;
  const moodCategory = analysis?.mood_category || "bem";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          Check-in de Hoje
          <Badge variant={MOOD_VARIANTS[moodCategory] || "secondary"} className="ml-auto text-xs">
            {MOOD_EMOJIS[moodCategory]} {MOOD_LABELS[moodCategory]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {/* Transcription */}
        {checkin.transcription && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground italic">"{checkin.transcription}"</p>
          </div>
        )}

        {/* AI Suggestions — prioritized over mood summary */}
        {analysis?.needs_adjustment && analysis.suggestions?.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <div className="flex items-center gap-1.5 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">Adaptações Sugeridas</span>
              {checkin.suggestion_accepted !== null && (
                <Badge variant={checkin.suggestion_accepted ? "default" : "outline"} className="ml-auto text-[10px]">
                  {checkin.suggestion_accepted ? "Aceito" : "Recusado"}
                </Badge>
              )}
            </div>
            {analysis.suggestions.map((s: any, i: number) => (
              <p key={i} className="text-muted-foreground pl-5">
                • {s.exercise_name}: {s.details}
              </p>
            ))}
          </div>
        )}

        {/* Overall recommendation */}
        {analysis?.overall_recommendation && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <p className="text-foreground">{analysis.overall_recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
