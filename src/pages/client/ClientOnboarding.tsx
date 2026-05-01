import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, ArrowRight, Check } from "lucide-react";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

type OptionCard = {
  value: string;
  label: string;
  emoji?: string;
  desc?: string;
};

type Question =
  | {
      id: string;
      block: string;
      blockSub?: string;
      title: string;
      subtitle?: string;
      type: "single";
      field: string;
      options: OptionCard[];
    }
  | {
      id: string;
      block: string;
      blockSub?: string;
      title: string;
      subtitle?: string;
      type: "multi";
      field: string;
      options: OptionCard[];
    };

const QUESTIONS: Question[] = [
  // Bloco A — Conhecendo você
  {
    id: "experience",
    block: "Conhecendo você",
    blockSub: "Vamos entender um pouco mais sobre você.",
    title: "Você já treina ou está começando agora?",
    type: "single",
    field: "experience_choice",
    options: [
      { value: "never", emoji: "👟", label: "Nunca treinei", desc: "Estou começando agora." },
      { value: "stopped", emoji: "🏋️", label: "Já treinei, mas parei", desc: "Tive uma experiência, mas dei uma pausa." },
      { value: "current", emoji: "💪", label: "Treino atualmente", desc: "Tenho uma rotina de treinos." },
    ],
  },
  {
    id: "security",
    block: "Conhecendo você",
    title: "Você se sente segura treinando sozinha?",
    type: "single",
    field: "ins_cat",
    options: [
      { value: "I1", label: "Sim", desc: "Me sinto segura e confiante." },
      { value: "I2", label: "Mais ou menos", desc: "Às vezes me sinto insegura." },
      { value: "I3", label: "Não", desc: "Me sinto insegura na maioria das vezes." },
    ],
  },
  // Bloco B — Seu corpo fala
  {
    id: "has_pain",
    block: "Seu corpo fala",
    blockSub: "Vamos ouvir o que ele está dizendo hoje.",
    title: "Você sente alguma dor ou desconforto hoje?",
    type: "single",
    field: "has_pain",
    options: [
      { value: "no", label: "Não, estou bem" },
      { value: "yes", label: "Sim, sinto algo" },
    ],
  },
  {
    id: "pain_locations",
    block: "Seu corpo fala",
    title: "Onde você sente?",
    subtitle: "Selecione todos os locais.",
    type: "multi",
    field: "pain_locations",
    options: [
      { value: "Lombar", label: "Lombar" },
      { value: "Joelho", label: "Joelho" },
      { value: "Ombro", label: "Ombro" },
      { value: "Quadril", label: "Quadril" },
      { value: "Outro", label: "Outro" },
    ],
  },
  {
    id: "pain_limit",
    block: "Seu corpo fala",
    title: "Essa dor limita seus movimentos?",
    type: "single",
    field: "pain_limit",
    options: [
      { value: "low", label: "Não, consigo me mover normalmente" },
      { value: "med", label: "Um pouco, mas consigo fazer quase tudo" },
      { value: "high", label: "Bastante, evito certos movimentos" },
    ],
  },
  // Bloco C — Quase lá
  {
    id: "time",
    block: "Quase lá",
    blockSub: "Só mais algumas informações para montar seu treino perfeito.",
    title: "Como está seu tempo hoje?",
    type: "single",
    field: "time_window",
    options: [
      { value: "T1", label: "20–30 min" },
      { value: "T2", label: "30–45 min" },
      { value: "T3", label: "45–60 min" },
    ],
  },
  {
    id: "goal",
    block: "Quase lá",
    title: "O que você mais busca agora?",
    type: "single",
    field: "primary_goal",
    options: [
      { value: "Saúde e bem-estar", emoji: "❤️", label: "Saúde e bem-estar" },
      { value: "Reduzir dores", emoji: "🩹", label: "Reduzir dores" },
      { value: "Melhorar o corpo", emoji: "🪞", label: "Melhorar o corpo" },
      { value: "Ganhar força", emoji: "💪", label: "Ganhar força" },
    ],
  },
];

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { track } = useFunnelTracking();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, any>>({
    experience_choice: "",
    ins_cat: "",
    has_pain: "",
    pain_locations: [] as string[],
    pain_limit: "",
    time_window: "",
    primary_goal: "",
  });

  useEffect(() => {
    track("onboarding_start");
  }, []);

  // Pré-popular dores vindas da elegibilidade
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("eligibility_pain");
      if (!stored) return;
      const p = JSON.parse(stored);
      const locs: string[] = [];
      if (p?.pain_shoulder) locs.push("Ombro");
      if (p?.pain_lower_back) locs.push("Lombar");
      if (p?.pain_knee) locs.push("Joelho");
      if (locs.length > 0) {
        setData((d) => ({ ...d, has_pain: "yes", pain_locations: locs }));
      }
    } catch {}
  }, []);

  // Pular perguntas de dor caso usuário não tenha dor
  const visibleQuestions = useMemo(() => {
    if (data.has_pain === "no") {
      return QUESTIONS.filter((q) => q.id !== "pain_locations" && q.id !== "pain_limit");
    }
    return QUESTIONS;
  }, [data.has_pain]);

  const total = visibleQuestions.length;
  const q = visibleQuestions[Math.min(step, total - 1)];
  const progress = ((step + 1) / total) * 100;

  const goNext = useCallback(() => {
    if (step < total - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step, total]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSingle = (field: string, value: string) => {
    setData((d) => ({ ...d, [field]: value }));
    setTimeout(goNext, 280);
  };

  const toggleMulti = (field: string, value: string) => {
    setData((d) => {
      const arr = (d[field] as string[]) || [];
      return {
        ...d,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const isLast = step === total - 1;
  const currentValue =
    q.type === "multi" ? (data[q.field] as string[]) : (data[q.field] as string);
  const hasValue = q.type === "multi" ? (currentValue as string[]).length > 0 : !!currentValue;

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    track("onboarding_complete");

    try {
      // Mapear respostas → campos do schema `anamnesis`
      const expMap: Record<string, { nivel: string; treina: boolean }> = {
        never: { nivel: "iniciante", treina: false },
        stopped: { nivel: "intermediario", treina: false },
        current: { nivel: "intermediario", treina: true },
      };
      const exp = expMap[data.experience_choice] || expMap.never;

      const tempoMap: Record<string, string> = {
        T1: "30 minutos",
        T2: "45 minutos",
        T3: "60 minutos",
      };

      // dor_cat + escala_dor
      let dor_cat: "D0" | "D1" | "D2" | "D3" = "D0";
      let escala_dor = 0;
      const hasJointPain = data.has_pain === "yes";
      if (hasJointPain) {
        switch (data.pain_limit) {
          case "high":
            dor_cat = "D3";
            escala_dor = 8;
            break;
          case "med":
            dor_cat = "D2";
            escala_dor = 5;
            break;
          default:
            dor_cat = "D1";
            escala_dor = 2;
        }
      }

      // dor_local mapeado aos códigos L1/L2/L3 quando aplicável
      const localMap: Record<string, string> = {
        Lombar: "L1",
        Ombro: "L2",
        Joelho: "L3",
      };
      const dor_local: string[] = (data.pain_locations as string[])
        .map((l) => localMap[l])
        .filter(Boolean);

      // Buscar dados da elegibilidade para enriquecer
      const { data: elig } = await supabase
        .from("eligibility_submissions")
        .select("age, gender, phone, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const insertPayload: any = {
        client_id: user.id,
        age: elig?.age || null,
        gender: elig?.gender || null,
        contato: elig?.phone || null,
        nivel_experiencia: exp.nivel,
        treina_atualmente: exp.treina,
        ins_cat: data.ins_cat || null,
        has_joint_pain: hasJointPain,
        pain_locations: hasJointPain ? (data.pain_locations as string[]) : null,
        dor_local: dor_local.length > 0 ? dor_local : null,
        dor_cat,
        escala_dor,
        tempo_disponivel: tempoMap[data.time_window] || null,
        primary_goal: data.primary_goal || null,
      };

      const { error: anamnesisError } = await supabase
        .from("anamnesis")
        .insert([insertPayload]);
      if (anamnesisError) throw anamnesisError;

      // Atualiza profile com nome (caso ainda não)
      if (elig?.full_name) {
        await supabase
          .from("profiles")
          .update({ full_name: elig.full_name })
          .eq("id", user.id);
      }

      // Roda perfil do agente (3 retries)
      let retries = 3;
      let ok = false;
      while (retries > 0 && !ok) {
        const { error } = await supabase.functions.invoke("calculate-anamnesis-profile", {
          body: { clientId: user.id },
        });
        if (error) {
          retries--;
          if (retries === 0) {
            console.error("calculate-anamnesis-profile falhou", error);
            // Não bloqueia — segue para summary
            break;
          }
          await new Promise((r) => setTimeout(r, 1500));
        } else {
          ok = true;
        }
      }

      // Marca primeiro check-in pré-preenchido (sessão de hoje)
      try {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("daily_checkin_sessions").insert({
          client_id: user.id,
          checkin_date: today,
          tempo_cat: data.time_window as any,
          dor_cat_dia: dor_cat as any,
          dor_local_dia: dor_local,
          disposicao: "OK" as any,
          transcription: "[ONBOARDING]",
        } as any);
      } catch (e) {
        console.warn("Pré-checkin não persistido:", e);
      }

      await queryClient.invalidateQueries({ queryKey: ["client-anamnesis", user.id] });
      navigate("/client/onboarding/summary", { replace: true });
    } catch (error: any) {
      console.error("Onboarding submit error:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 280 : -280, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -280 : 280, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <img src={meuTreinoLogo} alt="Meu Treino" className="h-8" />
          <span className="text-xs font-medium text-muted-foreground">
            {step + 1} / {total}
          </span>
        </div>
        <div className="max-w-lg mx-auto mt-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={q.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {q.block}
                </span>
                {q.blockSub && (
                  <p className="text-sm text-muted-foreground">{q.blockSub}</p>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {q.title}
                </h2>
                {q.subtitle && (
                  <p className="text-sm text-muted-foreground">{q.subtitle}</p>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {q.options.map((opt) => {
                  const selected =
                    q.type === "multi"
                      ? (currentValue as string[]).includes(opt.value)
                      : currentValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (q.type === "multi") {
                          toggleMulti(q.field, opt.value);
                        } else {
                          handleSingle(q.field, opt.value);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {opt.emoji && (
                        <span className="text-2xl shrink-0">{opt.emoji}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{opt.label}</p>
                        {opt.desc && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.desc}
                          </p>
                        )}
                      </div>
                      {q.type === "multi" && selected && (
                        <Check className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={step === 0 || loading}
            className="min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={loading || !hasValue}
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Ver meu plano
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={loading || (q.type === "multi" && !hasValue)}
              className="min-w-[140px]"
            >
              {q.type === "multi" ? "Continuar" : "Pular"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
