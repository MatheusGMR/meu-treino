// Feedback Pós-Sessão Estruturado — Diretriz JMP Feedback v1, Componente 4
// Máximo 4 toques. Linguagem leve — nunca clínica.
// 1) Como você está saindo daqui? [Bem / Cansado mas bem / Senti algo]
// 2) Onde foi o desconforto? [Lombar / Joelho / Ombro / Outra região] (só se "Senti algo")
// 3) Como foi a intensidade? [Leve / Normal / Puxado] (só se "Senti algo")
// 4) Encerra — registra e fecha
import { useState } from "react";
import { X, Heart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StructuredFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  scheduleId?: string;
}

type Step = "estado" | "regiao" | "intensidade" | "done";

const ESTADO_OPTIONS = [
  { value: "bem", label: "Bem — treino foi ótimo", emoji: "💪" },
  { value: "cansado_mas_bem", label: "Cansado mas bem", emoji: "😊" },
  { value: "senti_algo", label: "Senti algo", emoji: "🤔" },
] as const;

const REGIAO_OPTIONS = [
  { value: "lombar", label: "Lombar" },
  { value: "joelho", label: "Joelho" },
  { value: "ombro", label: "Ombro" },
  { value: "outra", label: "Outra região" },
] as const;

const INTENSIDADE_OPTIONS = [
  { value: "leve", label: "Leve" },
  { value: "normal", label: "Normal" },
  { value: "puxado", label: "Puxado" },
] as const;

export const StructuredFeedbackDialog = ({
  open,
  onClose,
  scheduleId,
}: StructuredFeedbackDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("estado");
  const [estado, setEstado] = useState<string | null>(null);
  const [regiao, setRegiao] = useState<string | null>(null);
  const [intensidade, setIntensidade] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep("estado");
    setEstado(null);
    setRegiao(null);
    setIntensidade(null);
    setSubmitting(false);
  };

  const handleEstado = (value: string) => {
    setEstado(value);
    if (value === "senti_algo") {
      setStep("regiao");
    } else {
      // Bem ou Cansado mas bem → submeter direto
      submitFeedback(value, null, null);
    }
  };

  const handleRegiao = (value: string) => {
    setRegiao(value);
    setStep("intensidade");
  };

  const handleIntensidade = (value: string) => {
    setIntensidade(value);
    submitFeedback(estado!, regiao!, value);
  };

  const submitFeedback = async (
    estadoGeral: string,
    regiaoVal: string | null,
    intensidadeVal: string | null
  ) => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-post-session-feedback", {
        body: {
          schedule_id: scheduleId,
          estado_geral: estadoGeral,
          regiao: regiaoVal,
          intensidade: intensidadeVal,
        },
      });
      if (error) throw error;
      setStep("done");
      toast.success("Feedback registrado!");
      setTimeout(() => {
        reset();
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error("Erro ao registrar feedback");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-6 pb-10 animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Pós-sessão
            </span>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step 1: Estado geral */}
        {step === "estado" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground text-center">
              Como você está saindo daqui?
            </h2>
            <div className="space-y-3 pt-2">
              {ESTADO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleEstado(opt.value)}
                  disabled={submitting}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-left disabled:opacity-50"
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Região do desconforto */}
        {step === "regiao" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground text-center">
              Onde foi o desconforto?
            </h2>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {REGIAO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRegiao(opt.value)}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-center"
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Intensidade */}
        {step === "intensidade" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground text-center">
              Como foi a intensidade?
            </h2>
            <div className="space-y-3 pt-2">
              {INTENSIDADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleIntensidade(opt.value)}
                  disabled={submitting}
                  className="w-full p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-center disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <p className="font-bold text-foreground">Obrigado!</p>
            <p className="text-sm text-muted-foreground">Bom descanso até a próxima.</p>
          </div>
        )}
      </div>
    </div>
  );
};
