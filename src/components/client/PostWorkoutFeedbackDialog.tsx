import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, Loader2, Heart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PostWorkoutAnalysis {
  mood_summary: string;
  mood_category: string;
  difficulty_rating: string;
  attention_points: { category: string; description: string; severity: string }[];
  recovery_tips: string;
  trainer_insights: string;
}

interface PostWorkoutFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  scheduleId?: string;
  sessionId?: string;
  sessionName?: string;
}

const MOOD_EMOJIS: Record<string, string> = {
  otimo: "💪", bem: "😊", cansado: "😴", com_dor: "🤕", indisposto: "😔",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: "Fácil", ideal: "Ideal", dificil: "Difícil", muito_dificil: "Muito Difícil",
};

const CATEGORY_LABELS: Record<string, string> = {
  dor: "Dor", cansaco: "Cansaço", sono: "Sono", trabalho: "Trabalho", emocional: "Emocional", outro: "Outro",
};

const PROMPT_QUESTIONS = [
  "Como você se sentiu durante o treino?",
  "Sentiu alguma dor ou desconforto?",
  "Como foi seu dia no trabalho?",
  "Dormiu bem ontem à noite?",
  "Alguma observação sobre o treino de hoje?",
];

export const PostWorkoutFeedbackDialog = ({
  open,
  onClose,
  scheduleId,
  sessionId,
  sessionName,
}: PostWorkoutFeedbackDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<"record" | "analyzing" | "result">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [analysis, setAnalysis] = useState<PostWorkoutAnalysis | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    recognition.onerror = () => setShowTextInput(true);

    recognition.onend = () => {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (finalTranscript.trim()) setTextInput(finalTranscript.trim());
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

  const analyzeFeedback = async (text: string) => {
    if (!text.trim()) return;
    setTranscription(text);
    setStep("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-post-workout", {
        body: { transcription: text, session_id: sessionId, schedule_id: scheduleId },
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      setStep("result");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao analisar feedback.");
      setStep("record");
    }
  };

  if (!open) return null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-6 pb-10 animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Pós-treino</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step: Record */}
        {step === "record" && (
          <div className="text-center space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Como foi o treino?</h2>
              <p className="text-sm text-muted-foreground">
                {sessionName ? `Conte como foi "${sessionName}"` : "Conte como se sentiu durante e após o treino"}
              </p>
            </div>

            {/* Prompt suggestions */}
            <div className="text-left space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sugestões do que falar:</p>
              {PROMPT_QUESTIONS.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{q}</span>
                </div>
              ))}
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
                      onClick={() => analyzeFeedback(textInput)}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all"
                    >
                      Enviar feedback
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
                  placeholder="O treino foi bom, mas senti uma dor no ombro direito durante o supino. Dormi mal ontem e o dia no trabalho foi puxado..."
                  className="w-full h-28 bg-muted border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  autoFocus
                />
                <button
                  onClick={() => analyzeFeedback(textInput)}
                  disabled={!textInput.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar feedback
                </button>
                <button onClick={() => setShowTextInput(false)} className="text-xs text-muted-foreground underline">
                  Usar microfone
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="text-center space-y-6 py-8">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-foreground font-semibold">Analisando seu feedback...</p>
              <p className="text-sm text-muted-foreground mt-1">A IA está processando suas observações</p>
            </div>
          </div>
        )}

        {/* Step: Result */}
        {step === "result" && analysis && (
          <div className="space-y-4">
            {/* Mood & Difficulty */}
            <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
              <span className="text-3xl">{MOOD_EMOJIS[analysis.mood_category] || "😊"}</span>
              <div className="flex-1">
                <p className="text-foreground font-semibold text-sm">{analysis.mood_summary}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Dificuldade: {DIFFICULTY_LABELS[analysis.difficulty_rating] || analysis.difficulty_rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Attention Points */}
            {analysis.attention_points?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Pontos de atenção
                </p>
                {analysis.attention_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 border border-border">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      point.severity === "alta" ? "bg-destructive" : point.severity === "media" ? "bg-yellow-500" : "bg-primary"
                    }`} />
                    <div>
                      <span className="text-xs font-medium text-foreground">
                        {CATEGORY_LABELS[point.category] || point.category}
                      </span>
                      <p className="text-xs text-muted-foreground">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recovery Tips */}
            {analysis.recovery_tips && (
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-1">💡 Dicas de recuperação</p>
                <p className="text-sm text-foreground">{analysis.recovery_tips}</p>
              </div>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all mt-2"
            >
              Concluir ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
