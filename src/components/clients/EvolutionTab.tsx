import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  MessageCircle, TrendingUp, Activity, Heart, Brain, Dumbbell, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";

const MOOD_LABELS: Record<string, string> = {
  otimo: "Ótimo", bem: "Bem", cansado: "Cansado", com_dor: "Com dor", indisposto: "Indisposto",
};
const MOOD_EMOJIS: Record<string, string> = {
  otimo: "💪", bem: "😊", cansado: "😴", com_dor: "🤕", indisposto: "😔",
};
const MOOD_SCORE: Record<string, number> = {
  otimo: 5, bem: 4, cansado: 3, com_dor: 2, indisposto: 1,
};

interface EvolutionTabProps {
  clientId: string;
}

export const EvolutionTab = ({ clientId }: EvolutionTabProps) => {
  // Last 30 check-ins
  const { data: checkins = [], isLoading: loadingCheckins } = useQuery({
    queryKey: ["client-checkins-history", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("client_id", clientId)
        .order("checkin_date", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  // Recent completed sessions
  const { data: completedSessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["client-completed-sessions", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_workout_schedule")
        .select("*, sessions(name)")
        .eq("client_id", clientId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  // Session completions for volume trend
  const { data: completionDetails = [] } = useQuery({
    queryKey: ["client-completion-details", clientId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase
        .from("session_completions")
        .select("completed_at, weight_used, sets_completed")
        .eq("client_id", clientId)
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at", { ascending: true });
      return data || [];
    },
  });

  const isLoading = loadingCheckins || loadingSessions;

  // Build mood trend data (chronological)
  const moodTrendData = [...checkins].reverse().map((c) => {
    const analysis = c.ai_suggestions as any;
    const mood = analysis?.mood_category || "bem";
    return {
      date: format(new Date(c.checkin_date), "dd/MM", { locale: ptBR }),
      score: MOOD_SCORE[mood] || 3,
      mood,
      label: MOOD_LABELS[mood] || mood,
    };
  });

  // Session difficulty distribution
  const difficultyCount = completedSessions.reduce((acc: Record<string, number>, s: any) => {
    const r = s.difficulty_rating || "Não avaliado";
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});
  const difficultyData = Object.entries(difficultyCount).map(([name, value]) => ({ name, value }));

  // Volume trend (aggregate weight per day)
  const volumeByDay: Record<string, number> = {};
  completionDetails.forEach((c: any) => {
    if (c.completed_at && c.weight_used) {
      const day = format(new Date(c.completed_at), "dd/MM", { locale: ptBR });
      volumeByDay[day] = (volumeByDay[day] || 0) + (c.weight_used * (c.sets_completed || 1));
    }
  });
  const volumeTrendData = Object.entries(volumeByDay).map(([date, volume]) => ({ date, volume: Math.round(volume) }));

  // Abandonment stats
  const abandonedSessions = completedSessions.filter((s: any) => s.abandon_reason);
  const completedCount = completedSessions.filter((s: any) => s.completed && !s.abandon_reason).length;
  const totalSessions = completedSessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  // Suggestions accepted rate
  const checkinsWithSuggestions = checkins.filter((c: any) => c.suggestion_accepted !== null);
  const acceptedCount = checkinsWithSuggestions.filter((c: any) => c.suggestion_accepted).length;

  // Average mood
  const avgMoodScore = moodTrendData.length > 0
    ? (moodTrendData.reduce((sum, d) => sum + d.score, 0) / moodTrendData.length).toFixed(1)
    : "—";

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{avgMoodScore}</p>
            <p className="text-xs text-muted-foreground">Humor Médio (1-5)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Conclusão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Brain className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{checkins.length}</p>
            <p className="text-xs text-muted-foreground">Check-ins (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Sessões Concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      {moodTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Tendência Emocional (últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: number) => {
                    const entry = Object.entries(MOOD_SCORE).find(([, v]) => v === value);
                    return entry ? `${MOOD_EMOJIS[entry[0]]} ${MOOD_LABELS[entry[0]]}` : value;
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Volume Trend */}
      {volumeTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              Volume Total por Dia (kg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Difficulty Distribution */}
        {difficultyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Percepção de Dificuldade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {difficultyData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <Badge
                    variant={d.name === "Difícil" ? "destructive" : d.name === "Fácil" ? "secondary" : "default"}
                  >
                    {d.name}
                  </Badge>
                  <span className="text-sm font-medium">{d.value}x</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Suggestions Acceptance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Sugestões IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkinsWithSuggestions.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Aceitas</span>
                  </div>
                  <span className="font-bold">{acceptedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                    <span>Recusadas</span>
                  </div>
                  <span className="font-bold">{checkinsWithSuggestions.length - acceptedCount}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sugestão registrada ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Check-in Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Histórico de Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum check-in registrado</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {checkins.slice(0, 15).map((checkin: any) => {
                const analysis = checkin.ai_suggestions as any;
                const mood = analysis?.mood_category || "bem";
                return (
                  <div key={checkin.id} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <div className="text-2xl">{MOOD_EMOJIS[mood] || "😊"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {format(new Date(checkin.checkin_date), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {MOOD_LABELS[mood] || mood}
                        </Badge>
                        {checkin.suggestion_accepted !== null && (
                          <Badge
                            variant={checkin.suggestion_accepted ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {checkin.suggestion_accepted ? "Adaptou treino" : "Manteve original"}
                          </Badge>
                        )}
                      </div>
                      {checkin.mood_summary && (
                        <p className="text-xs text-muted-foreground">{checkin.mood_summary}</p>
                      )}
                      {checkin.transcription && (
                        <p className="text-xs text-muted-foreground italic mt-1 truncate">
                          "{checkin.transcription}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abandoned Sessions */}
      {abandonedSessions.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Sessões Abandonadas ({abandonedSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {abandonedSessions.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded bg-destructive/5 border border-destructive/10">
                <div>
                  <span className="font-medium">{(s as any).sessions?.name || "Sessão"}</span>
                  <span className="text-muted-foreground ml-2">
                    {s.completed_at && format(new Date(s.completed_at), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
                <Badge variant="destructive" className="text-[10px]">{s.abandon_reason}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
