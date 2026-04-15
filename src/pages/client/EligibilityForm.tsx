import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";
import { useEffect } from "react";

const EligibilityForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useFunnelTracking();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    phone: "",
    gender: "",
    is_vs_gold: "",
    vs_gold_exit_months: "",
    pain_shoulder: false,
    pain_lower_back: false,
    pain_knee: false,
  });

  useEffect(() => {
    track("eligibility_start");
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    {
      id: "name",
      label: "Qual seu nome completo?",
      render: () => (
        <Input
          value={formData.full_name}
          onChange={(e) => updateField("full_name", e.target.value)}
          placeholder="Seu nome completo"
          className="text-lg h-14 bg-card border-border"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && formData.full_name && goNext()}
        />
      ),
      valid: () => formData.full_name.trim().length > 2,
    },
    {
      id: "age",
      label: "Qual sua idade?",
      render: () => (
        <Input
          type="number"
          value={formData.age}
          onChange={(e) => updateField("age", e.target.value)}
          placeholder="Ex: 32"
          className="text-lg h-14 bg-card border-border"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && formData.age && goNext()}
        />
      ),
      valid: () => !!formData.age && parseInt(formData.age) >= 16 && parseInt(formData.age) <= 100,
    },
    {
      id: "phone",
      label: "Telefone para contato",
      render: () => (
        <Input
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="(99) 99999-9999"
          className="text-lg h-14 bg-card border-border"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && formData.phone && goNext()}
        />
      ),
      valid: () => formData.phone.trim().length >= 10,
    },
    {
      id: "gender",
      label: "Qual seu sexo?",
      render: () => (
        <RadioCardGroup
          value={formData.gender}
          onValueChange={(v) => {
            updateField("gender", v);
            setTimeout(goNext, 350);
          }}
          className="grid grid-cols-1 gap-3"
        >
          {["Masculino", "Feminino"].map((opt) => (
            <RadioCardItem key={opt} value={opt} className="p-4 text-base">
              {opt}
            </RadioCardItem>
          ))}
        </RadioCardGroup>
      ),
      valid: () => !!formData.gender,
    },
    {
      id: "vs_gold",
      label: "Você é aluno ou ex-aluno VS Gold?",
      subtitle: "Aceitamos apenas ex-alunos com mais de 18 meses de desligamento.",
      render: () => (
        <div className="space-y-4">
          <RadioCardGroup
            value={formData.is_vs_gold}
            onValueChange={(v) => {
              updateField("is_vs_gold", v);
              if (v === "Não") setTimeout(goNext, 350);
            }}
            className="grid grid-cols-1 gap-3"
          >
            {["Sim", "Não"].map((opt) => (
              <RadioCardItem key={opt} value={opt} className="p-4 text-base">
                {opt}
              </RadioCardItem>
            ))}
          </RadioCardGroup>
          {formData.is_vs_gold === "Sim" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label className="text-sm text-muted-foreground">
                Há quantos meses saiu da VS Gold?
              </Label>
              <Input
                type="number"
                value={formData.vs_gold_exit_months}
                onChange={(e) => updateField("vs_gold_exit_months", e.target.value)}
                placeholder="Ex: 24"
                className="h-12 bg-card border-border"
              />
              {formData.vs_gold_exit_months && parseInt(formData.vs_gold_exit_months) < 18 && (
                <p className="text-sm text-destructive">
                  ⚠️ Infelizmente, aceitamos apenas ex-alunos com mais de 18 meses de desligamento.
                </p>
              )}
            </motion.div>
          )}
        </div>
      ),
      valid: () => {
        if (!formData.is_vs_gold) return false;
        if (formData.is_vs_gold === "Não") return true;
        if (!formData.vs_gold_exit_months) return false;
        return parseInt(formData.vs_gold_exit_months) >= 18;
      },
    },
    {
      id: "pain",
      label: "Você sente alguma dessas dores?",
      subtitle: "Selecione todas que se aplicam. Caso nenhuma, avance.",
      render: () => (
        <div className="space-y-4">
          {[
            { field: "pain_shoulder", label: "Dor no ombro" },
            { field: "pain_lower_back", label: "Dor lombar" },
            { field: "pain_knee", label: "Dor no joelho" },
          ].map(({ field, label }) => (
            <label
              key={field}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={(formData as any)[field]}
                onCheckedChange={(checked) => updateField(field, !!checked)}
              />
              <span className="text-base">{label}</span>
            </label>
          ))}
        </div>
      ),
      valid: () => true, // optional
    },
  ];

  const currentStep = steps[step];
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = useCallback(() => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(prev => prev + 1);
    }
  }, [step, totalSteps]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep(prev => prev - 1);
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("eligibility_submissions").insert({
        user_id: user.id,
        full_name: formData.full_name,
        age: parseInt(formData.age),
        phone: formData.phone,
        gender: formData.gender,
        is_vs_gold: formData.is_vs_gold === "Sim",
        vs_gold_exit_date: null,
        pain_shoulder: formData.pain_shoulder,
        pain_lower_back: formData.pain_lower_back,
        pain_knee: formData.pain_knee,
        payment_status: "pending",
      } as any);

      if (error) throw error;

      // Update profile name
      await supabase.from("profiles").update({ full_name: formData.full_name }).eq("id", user.id);

      track("eligibility_complete", undefined, {
        is_vs_gold: formData.is_vs_gold === "Sim",
        has_pain: formData.pain_shoulder || formData.pain_lower_back || formData.pain_knee,
      });

      // Store pain data in sessionStorage for anamnesis to use
      sessionStorage.setItem("eligibility_pain", JSON.stringify({
        pain_shoulder: formData.pain_shoulder,
        pain_lower_back: formData.pain_lower_back,
        pain_knee: formData.pain_knee,
      }));

      navigate("/client/checkout");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = step === totalSteps - 1;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <img src={meuTreinoLogo} alt="Meu Treino" className="h-8 rounded-lg" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Elegibilidade
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {step + 1} de {totalSteps}
                </p>
                <h2 className="text-2xl font-bold">{currentStep.label}</h2>
                {currentStep.id === "vs_gold" && currentStep.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
                )}
                {currentStep.id === "pain" && currentStep.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{currentStep.subtitle}</p>
                )}
              </div>

              {currentStep.render()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={loading || !currentStep.valid()}
                className="gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Continuar para Pagamento
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!currentStep.valid()}
                className="gap-2"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityForm;
