import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, Check, ArrowRight, ArrowDown, Clock, Dumbbell, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContextualCheckinPrompt } from "@/hooks/useContextualCheckinPrompt";
import { toast } from "sonner";

interface AISuggestion {
  exercise_name: string;
  adjustment_type: "reduce_load" | "swap_exercise" | "reduce_sets" | "skip";
  details: string;
  original_series: number;
  suggested_series: number;
  original_reps: string;
  suggested_reps: string;
  original_load: string;
  suggested_load: string;
}

interface AnalysisResult {
  mood_summary: string;
  mood_category: string;
  needs_adjustment: boolean;
  suggestions: AISuggestion[];
  overall_recommendation: string;
  estimated_time_original: number;
  estimated_time_adapted: number;
}

interface DailyCheckinDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
  onSuggestionAccepted?: (analysis: AnalysisResult) => void;
}

const ADJUSTMENT_ICONS: Record<string, string> = {
  reduce_load: "⚖️",
  swap_exercise: "🔄",
  reduce_sets: "📉",
  skip: "⏭️",
};

const ADJUSTMENT_LABELS: Record<string, string> = {
  reduce_load: "Reduzir carga",
  swap_exercise: "Trocar exercício",
  reduce_sets: "Reduzir séries",
  skip: "Pular",
};

const MOOD_EMOJIS: Record<string, string> = {
  otimo: "💪",
  bem: "😊",
  cansado: "😴",
  com_dor: "🤕",
  indisposto: "😔",
};

export const DailyCheckinDialog = ({
  open,
  onClose,
  sessionId,
  onSuggestionAccepted,
}: DailyCheckinDialogProps) => {
  const { user } = useAuth();
  const ctx = useContextualCheckinPrompt();
  const [step, setStep] = useState<"record" | "transcribing" | "analyzing" | "result" | "suggestions">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      setStep("record");
      setIsRecording(false);
      setTranscription("");
      setAnalysis(null);
      setRecordingTime(0);
      setShowTextInput(false);
      setTextInput("");
    }
  }, [open]);

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowTextInput(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTextInput(finalTranscript + interim);
    };

    recognition.onerror = () => {
      setShowTextInput(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (finalTranscript.trim()) {
        setTextInput(finalTranscript.trim());
      }
    };

    recognition.start();
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopVoiceRecognition = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const analyzeCheckin = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    setTranscription(text);
    setStep("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-checkin", {
        body: {
          transcription: text,
          session_id: sessionId,
          contexto_pergunta: ctx.contexto,
          pergunta_exibida: ctx.pergunta,
          hora_checkin: ctx.hora,
          dia_util: ctx.dia_util,
        },
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      setStep("result");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao analisar check-in.");
      setStep("record");
    }
  };

  const handleAcceptSuggestions = async () => {
    if (!analysis) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_checkins")
        .update({ suggestion_accepted: true, adapted_session_data: JSON.parse(JSON.stringify(analysis.suggestions)) })
        .eq("client_id", user?.id)
        .eq("checkin_date", today);

      onSuggestionAccepted?.(analysis);
      toast.success("Treino adaptado com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao aplicar sugestões.");
    }
  };

  const handleDeclineSuggestions = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase
        .from("daily_checkins")
        .update({ suggestion_accepted: false })
        .eq("client_id", user?.id)
        .eq("checkin_date", today);
    } catch { /* silent */ }
    onClose();
  };

  if (!open) return null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-md bg-card rounded-t-3xl border-t border-border p-6 pb-10 animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${step === "suggestions" ? "max-h-[90vh] overflow-y-auto" : ""}`}>
        {/* Close */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {step === "suggestions" ? (
              <button onClick={() => setStep("result")} className="p-1 rounded-full hover:bg-muted transition-colors">
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
            ) : (
              <Sparkles className="w-5 h-5 text-primary" />
            )}
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              {step === "suggestions" ? "Comparação do treino" : "Check-in diário"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Record */}
        {step === "record" && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{ctx.pergunta}</h2>
              <p className="text-sm text-muted-foreground">Conte com suas palavras — a IA cuida do resto</p>
            </div>

            {!showTextInput ? (
              <>
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? "bg-primary shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
                        : "bg-muted hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    }`}
                  >
                    {isRecording && (
                      <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                    )}
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-primary-foreground" />
                    ) : (
                      <Mic className="w-10 h-10 text-primary" />
                    )}
                  </button>
                </div>

                {isRecording && (
                  <div className="space-y-2">
                    <p className="text-sm text-primary font-medium animate-pulse">Gravando... {formatTime(recordingTime)}</p>
                    {textInput && (
                      <p className="text-sm text-muted-foreground italic px-4 line-clamp-3">"{textInput}"</p>
                    )}
                  </div>
                )}

                {!isRecording && textInput && (
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-sm text-foreground">"{textInput}"</p>
                    </div>
                    <button
                      onClick={() => analyzeCheckin(textInput)}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
                    >
                      Enviar
                    </button>
                  </div>
                )}

                <button onClick={() => setShowTextInput(true)} className="text-xs text-muted-foreground underline">
                  Prefiro digitar
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Estou me sentindo bem hoje, mas com uma leve dor no ombro..."
                  className="w-full h-28 bg-muted border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  autoFocus
                />
                <button
                  onClick={() => analyzeCheckin(textInput)}
                  disabled={!textInput.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
                <button onClick={() => setShowTextInput(false)} className="text-xs text-muted-foreground underline">
                  Usar microfone
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Analyzing */}
        {(step === "transcribing" || step === "analyzing") && (
          <div className="text-center space-y-6 py-8">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-foreground font-semibold">Analisando como você está...</p>
              <p className="text-sm text-muted-foreground mt-1">A IA está preparando sugestões para seu treino</p>
            </div>
          </div>
        )}

        {/* Step: Result — Summary with "Ver Sugestões" CTA */}
        {step === "result" && analysis && (
          <div className="space-y-5">
            {/* Mood */}
            <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
              <span className="text-3xl">{MOOD_EMOJIS[analysis.mood_category] || "😊"}</span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mt-0.5">"{transcription}"</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <p className="text-sm text-foreground">{analysis.overall_recommendation}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {analysis.needs_adjustment && analysis.suggestions.length > 0 ? (
                <>
                  {/* Time comparison preview */}
                  <div className="flex items-center justify-center gap-4 py-3">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">Original</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{analysis.estimated_time_original || 45} min</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Adaptado</span>
                      </div>
                      <p className="text-lg font-bold text-primary">{analysis.estimated_time_adapted || 40} min</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("suggestions")}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ver sugestões ({analysis.suggestions.length} ajustes)
                  </button>

                  <button
                    onClick={handleDeclineSuggestions}
                    className="w-full py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
                  >
                    Manter treino original
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
                >
                  Vamos treinar! 💪
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: Suggestions — Before/After Comparison */}
        {step === "suggestions" && analysis && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <Dumbbell className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {analysis.suggestions.length} exercício{analysis.suggestions.length > 1 ? "s" : ""} ajustado{analysis.suggestions.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analysis.estimated_time_original} min → {analysis.estimated_time_adapted} min
                </p>
              </div>
            </div>

            {/* Exercise-by-exercise comparison */}
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                {/* Exercise header */}
                <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2">
                  <span className="text-base">{ADJUSTMENT_ICONS[s.adjustment_type] || "🔧"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.exercise_name}</p>
                    <p className="text-[11px] text-primary font-medium">{ADJUSTMENT_LABELS[s.adjustment_type]}</p>
                  </div>
                </div>

                {/* Before / After grid */}
                {s.adjustment_type !== "skip" ? (
                  <div className="grid grid-cols-2 divide-x divide-border">
                    {/* Before */}
                    <div className="p-3 space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Antes</p>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Séries</p>
                          <p className="text-sm font-bold text-foreground">{s.original_series}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Reps</p>
                          <p className="text-sm font-bold text-foreground">{s.original_reps}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Carga</p>
                          <p className="text-sm font-bold text-foreground">{s.original_load}</p>
                        </div>
                      </div>
                    </div>

                    {/* After */}
                    <div className="p-3 space-y-2 bg-primary/5">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Depois</p>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Séries</p>
                          <p className={`text-sm font-bold ${s.suggested_series !== s.original_series ? "text-primary" : "text-foreground"}`}>
                            {s.suggested_series}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Reps</p>
                          <p className={`text-sm font-bold ${s.suggested_reps !== s.original_reps ? "text-primary" : "text-foreground"}`}>
                            {s.suggested_reps}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Carga</p>
                          <p className={`text-sm font-bold ${s.suggested_load !== s.original_load ? "text-primary" : "text-foreground"}`}>
                            {s.suggested_load}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-sm text-muted-foreground italic">Este exercício será removido do treino</p>
                  </div>
                )}

                {/* Details */}
                <div className="px-4 py-2 bg-muted/30 border-t border-border">
                  <p className="text-xs text-muted-foreground">{s.details}</p>
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pb-2">
              <button
                onClick={handleDeclineSuggestions}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
              >
                Manter original
              </button>
              <button
                onClick={handleAcceptSuggestions}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Adaptar treino
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
