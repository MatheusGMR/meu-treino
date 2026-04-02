import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AISuggestion {
  exercise_name: string;
  adjustment_type: "reduce_load" | "swap_exercise" | "reduce_sets" | "skip";
  details: string;
}

interface AnalysisResult {
  mood_summary: string;
  mood_category: string;
  needs_adjustment: boolean;
  suggestions: AISuggestion[];
  overall_recommendation: string;
}

interface DailyCheckinDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
  onSuggestionAccepted?: (analysis: AnalysisResult) => void;
}

const ADJUSTMENT_LABELS: Record<string, string> = {
  reduce_load: "Reduzir carga",
  swap_exercise: "Trocar exercício",
  reduce_sets: "Reduzir séries",
  skip: "Pular exercício",
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
  const [step, setStep] = useState<"record" | "transcribing" | "analyzing" | "result">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("record");
      setIsRecording(false);
      setTranscription("");
      setAnalysis(null);
      setRecordingTime(0);
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        processAudio();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async () => {
    setStep("transcribing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    // Use Web Speech API for transcription (browser-native, free)
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      // Fallback: since we already recorded, we'll use a simpler approach
      // Convert audio to text via a prompt to AI
    }

    // Read audio as base64 and send to AI for transcription via edge function
    const reader = new FileReader();
    reader.onloadend = async () => {
      // For now, use a text input fallback — real transcription would need STT
      // We'll show a text input for the user to type/confirm what they said
      setStep("record");
      setShowTextInput(true);
    };
    reader.readAsDataURL(blob);
  };

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const analyzeCheckin = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    setTranscription(text);
    setStep("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-checkin", {
        body: { transcription: text, session_id: sessionId },
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

  // Use SpeechRecognition API for live transcription
  const recognitionRef = useRef<any>(null);

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
      <div className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-6 pb-10 animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Close */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Check-in diário</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Record */}
        {(step === "record") && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Como você está hoje?
              </h2>
              <p className="text-sm text-muted-foreground">
                Conte como está se sentindo antes do treino
              </p>
            </div>

            {!showTextInput ? (
              <>
                {/* Mic Button */}
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? "bg-primary shadow-[0_0_40px_hsl(348_83%_47%/0.5)]"
                        : "bg-muted hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(348_83%_47%/0.3)]"
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
                    <p className="text-sm text-primary font-medium animate-pulse">
                      Gravando... {formatTime(recordingTime)}
                    </p>
                    {textInput && (
                      <p className="text-sm text-muted-foreground italic px-4 line-clamp-3">
                        "{textInput}"
                      </p>
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

                <button
                  onClick={() => setShowTextInput(true)}
                  className="text-xs text-muted-foreground underline"
                >
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
                <button
                  onClick={() => setShowTextInput(false)}
                  className="text-xs text-muted-foreground underline"
                >
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

        {/* Step: Result */}
        {step === "result" && analysis && (
          <div className="space-y-5">
            {/* Mood */}
            <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
              <span className="text-3xl">{MOOD_EMOJIS[analysis.mood_category] || "😊"}</span>
              <div>
                <p className="text-foreground font-semibold text-sm">{analysis.mood_summary}</p>
                <p className="text-xs text-muted-foreground mt-1">"{transcription}"</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <p className="text-sm text-foreground">{analysis.overall_recommendation}</p>
            </div>

            {/* Suggestions */}
            {analysis.needs_adjustment && analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ajustes sugeridos
                </p>
                {analysis.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{s.exercise_name}</p>
                      <p className="text-xs text-muted-foreground">{ADJUSTMENT_LABELS[s.adjustment_type]}: {s.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {analysis.needs_adjustment ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
                >
                  Vamos treinar! 💪
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
