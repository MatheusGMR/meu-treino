// Check-in Diário Estruturado — Diretriz JMP (Diretrizes do Agente, seção 4.1)
// Coleta: (1) Tempo disponível → (2) Dor do dia → (3) Disposição
// Uma pergunta por tela. Botões com opções fixas. Sem campo livre.
// A pergunta de disposição é contextualizada pelo perfil de rotina e horário.
import { useState, useEffect } from "react";
import { X, Clock, AlertCircle, Battery } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContextualCheckinPrompt } from "@/hooks/useContextualCheckinPrompt";
import { toast } from "sonner";

interface StructuredCheckinDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete?: (checkin: { tempo_cat: string; dor_cat: string; disposicao: string }) => void;
}

type Step = "tempo" | "dor" | "dor_local" | "disposicao" | "submitting" | "done";

const TEMPO_OPTIONS = [
  { value: "T1", label: "Até 40 minutos", desc: "Sessão reduzida" },
  { value: "T2", label: "40 a 55 minutos", desc: "Sessão padrão" },
  { value: "T3", label: "Acima de 55 minutos", desc: "Sessão completa" },
] as const;

const DOR_OPTIONS = [
  { value: "D0", label: "Sem dor", desc: "Tudo tranquilo hoje", emoji: "✅" },
  { value: "D1", label: "Leve", desc: "Lembro dela às vezes, mas não me limita", emoji: "🟡" },
  { value: "D2", label: "Moderada", desc: "Me faz ter cuidado em alguns movimentos", emoji: "🟠" },
  { value: "D3", label: "Limitante", desc: "Presente agora, dói de verdade", emoji: "🔴" },
] as const;

const DOR_LOCAL_OPTIONS = [
  { value: "L1", label: "Lombar" },
  { value: "L2", label: "Ombro" },
  { value: "L3", label: "Joelho" },
] as const;

// Disposição contextualizada pelo horário (diretriz seção 4.1)
const DISPOSICAO_PRESETS: Record<string, {
  pergunta: string;
  opcoes: Array<{ value: string; label: string }>;
}> = {
  manha: {
    pergunta: "Dormiu bem?",
    opcoes: [
      { value: "OK", label: "Sim, foi uma boa noite" },
      { value: "Moderada", label: "Mais ou menos" },
      { value: "Comprometida", label: "Ainda estou sonolento" },
    ],
  },
  tarde: {
    pergunta: "Muito cansado do dia?",
    opcoes: [
      { value: "OK", label: "Pronto para meu treino" },
      { value: "Moderada", label: "Estressado mas vou encarar" },
      { value: "Comprometida", label: "Muito estressado / cansaço físico" },
    ],
  },
  noite: {
    pergunta: "Como foi o dia?",
    opcoes: [
      { value: "OK", label: "Disposto e animado" },
      { value: "Moderada", label: "Cansado mas quero treinar" },
      { value: "Comprometida", label: "Preferia estar descansando" },
    ],
  },
  geral: {
    pergunta: "Como você está hoje?",
    opcoes: [
      { value: "OK", label: "Disposto e animado" },
      { value: "Moderada", label: "Mais ou menos" },
      { value: "Comprometida", label: "Preferia estar descansando" },
    ],
  },
};

function getDisposicaoPreset(hora: string): typeof DISPOSICAO_PRESETS[string] {
  const h = parseInt(hora.split(":")[0], 10);
  if (h >= 5 && h < 12) return DISPOSICAO_PRESETS.manha;
  if (h >= 12 && h < 18) return DISPOSICAO_PRESETS.tarde;
  if (h >= 18 || h < 5) return DISPOSICAO_PRESETS.noite;
  return DISPOSICAO_PRESETS.geral;
}

export const StructuredCheckinDialog = ({
  open,
  onClose,
  onComplete,
}: StructuredCheckinDialogProps) => {
  const { user } = useAuth();
  const ctx = useContextualCheckinPrompt();
  const [step, setStep] = useState<Step>("tempo");
  const [tempoCat, setTempoCat] = useState<string | null>(null);
  const [dorCat, setDorCat] = useState<string | null>(null);
  const [dorLocal, setDorLocal] = useState<string[]>([]);
  const [disposicao, setDisposicao] = useState<string | null>(null);
  const [hasPainProfile, setHasPainProfile] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("tempo");
      setTempoCat(null);
      setDorCat(null);
      setDorLocal([]);
      setDisposicao(null);
    }
  }, [open]);

  // Check if profile has pain registered (only ask dor if profile has it)
  useEffect(() => {
    if (!user?.id || !open) return;
    supabase
      .from("anamnesis")
      .select("dor_cat, dor_local")
      .eq("client_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasPainProfile(data?.dor_cat !== "D0" && data?.dor_cat !== null);
      });
  }, [user?.id, open]);

  const handleTempo = (value: string) => {
    setTempoCat(value);
    // Diretriz: "Dor do dia — condicional: só pergunta se perfil tem dor registrada na anamnese"
    if (hasPainProfile) {
      setStep("dor");
    } else {
      setDorCat("D0");
      setStep("disposicao");
    }
  };

  const handleDor = (value: string) => {
    setDorCat(value);
    if (value !== "D0") {
      setStep("dor_local");
    } else {
      setStep("disposicao");
    }
  };

  const handleDorLocal = (value: string) => {
    setDorLocal((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const confirmDorLocal = () => {
    setStep("disposicao");
  };

  const handleDisposicao = async (value: string) => {
    setDisposicao(value);
    setStep("submitting");

    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Persist structured check-in
      const { error } = await supabase.from("daily_checkin_sessions").insert({
        client_id: user.id,
        checkin_date: today,
        hora_checkin: ctx.hora,
        dia_util: ctx.dia_util,
        contexto_pergunta: ctx.contexto,
        pergunta_exibida: ctx.pergunta,
        transcription: `[ESTRUTURADO] T=${tempoCat} D=${dorCat} Local=${dorLocal.join(",")} Disp=${value}`,
        dor_cat_dia: dorCat,
        dor_local_dia: dorLocal,
        tempo_cat: tempoCat,
        disposicao: value,
        vocab_capturado: [],
        ai_summary: null,
        ai_raw_response: null,
      });

      if (error) throw error;

      setStep("done");
      onComplete?.({
        tempo_cat: tempoCat!,
        dor_cat: dorCat!,
        disposicao: value,
      });

      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      toast.error("Erro ao registrar check-in");
      setStep("disposicao");
    }
  };

  if (!open) return null;

  const disposicaoPreset = getDisposicaoPreset(ctx.hora);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card rounded-t-3xl border-t border-border p-6 pb-10 animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Check-in do dia
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* TEMPO */}
        {step === "tempo" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Quanto tempo você tem hoje?</h2>
            </div>
            <div className="space-y-3">
              {TEMPO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleTempo(opt.value)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <span className="text-xs font-mono text-primary font-bold">{opt.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DOR */}
        {step === "dor" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Como está a dor hoje?</h2>
            </div>
            <div className="space-y-3">
              {DOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDor(opt.value)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DOR LOCAL */}
        {step === "dor_local" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground text-center">Onde está a dor?</h2>
            <p className="text-xs text-muted-foreground text-center">Pode selecionar mais de uma</p>
            <div className="space-y-3">
              {DOR_LOCAL_OPTIONS.map((opt) => {
                const active = dorLocal.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleDorLocal(opt.value)}
                    className={`w-full p-4 rounded-xl border transition-all text-center text-sm font-medium ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-primary/5 hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={confirmDorLocal}
              disabled={dorLocal.length === 0}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        )}

        {/* DISPOSIÇÃO */}
        {step === "disposicao" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center mb-2">
              <Battery className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{disposicaoPreset.pergunta}</h2>
            </div>
            <div className="space-y-3">
              {disposicaoPreset.opcoes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDisposicao(opt.value)}
                  className="w-full p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-center text-sm font-medium text-foreground"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUBMITTING */}
        {step === "submitting" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Preparando seu treino...</p>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-3xl">💪</span>
            </div>
            <p className="font-bold text-foreground">Vamos lá!</p>
          </div>
        )}
      </div>
    </div>
  );
};
