import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AnamnesisCompletionScreen } from "@/components/client/AnamnesisCompletionScreen";
import { ChevronRight, ChevronLeft, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BehavioralProfileSelector, PerfilComportamental } from "@/components/client/anamnesis/BehavioralProfileSelector";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

interface QuestionDef {
  id: string;
  section: string;
  label: string;
  subtitle?: string;
  type: "text" | "number" | "radio" | "checkbox" | "textarea" | "perfil" | "slider";
  options?: string[];
  field: string;
  placeholder?: string;
  required?: boolean;
  numberProps?: { min?: number; max?: number; step?: string };
  sliderLabels?: [string, string, string]; // I1, I2, I3
}

const QUESTIONS: QuestionDef[] = [
  // Identificação
  { id: "age", section: "Identificação", label: "Qual sua idade?", type: "number", field: "age", placeholder: "Ex: 29", required: true },
  { id: "gender", section: "Identificação", label: "Qual seu gênero?", type: "radio", field: "gender", options: ["Masculino", "Feminino", "Não-binário", "Prefiro não dizer"], required: true },
  { id: "profession", section: "Identificação", label: "Qual sua profissão?", type: "text", field: "profession", placeholder: "Ex: Engenheiro, Professor..." },
  { id: "contato", section: "Identificação", label: "Seu contato telefônico", type: "text", field: "contato", placeholder: "(99) 99999-9999" },
  { id: "tempo_sentado", section: "Identificação", label: "Quanto tempo fica sentado por dia?", type: "radio", field: "tempo_sentado_dia", options: ["Menos de 2 horas", "2 a 4 horas", "4 a 6 horas", "6 a 8 horas", "Mais de 8 horas"] },

  // Composição Corporal
  { id: "peso", section: "Composição Corporal", label: "Qual seu peso? (kg)", type: "number", field: "peso_kg", placeholder: "Ex: 75.5", numberProps: { step: "0.1" } },
  { id: "altura", section: "Composição Corporal", label: "Qual sua altura? (cm)", type: "number", field: "altura_cm", placeholder: "Ex: 175" },
  { id: "autoimagem", section: "Composição Corporal", label: "Como você se enxerga hoje?", type: "radio", field: "autoimagem", options: ["Abaixo do peso", "Peso normal", "Sobrepeso", "Obesidade", "Não sei avaliar"] },
  { id: "regioes", section: "Composição Corporal", label: "Quais regiões deseja melhorar?", subtitle: "Selecione todas que se aplicam", type: "checkbox", field: "regioes_que_deseja_melhorar", options: ["Peito", "Costas", "Ombros", "Braços", "Abdômen", "Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilhas", "Mobilidade", "Postura"] },

  // Histórico de Treino
  { id: "treina", section: "Histórico de Treino", label: "Você treina atualmente?", type: "radio", field: "treina_atualmente", options: ["Sim", "Não"] },
  { id: "frequencia", section: "Histórico de Treino", label: "Com qual frequência?", type: "radio", field: "frequencia_atual", options: ["0 vezes/semana", "1 vez/semana", "2 vezes/semana", "3 vezes/semana", "4 vezes/semana", "5 vezes/semana", "6+ vezes/semana"] },
  { id: "tipos_treino", section: "Histórico de Treino", label: "Quais tipos de treino já realizou?", subtitle: "Selecione todos que se aplicam", type: "checkbox", field: "tipos_de_treino_feitos", options: ["Musculação", "Funcional", "Crossfit", "Corrida", "Lutas", "Pilates", "Yoga", "HIIT", "Esportes coletivos"] },
  { id: "tempo_parado", section: "Histórico de Treino", label: "Caso esteja parado, há quanto tempo?", type: "radio", field: "tempo_parado", options: ["Não estou parado", "Menos de 1 mês", "1 a 3 meses", "3 a 6 meses", "6 a 12 meses", "Mais de 1 ano"] },

  // Limitações e Segurança
  { id: "dores", section: "Limitações", label: "Possui alguma dor atualmente?", subtitle: "Descreva qualquer dor que esteja sentindo", type: "textarea", field: "dores_atuais", placeholder: "Descreva aqui ou escreva 'Nenhuma'" },
  { id: "escala_dor", section: "Limitações", label: "Escala de dor (0 a 10)", subtitle: "0 = sem dor | 10 = dor extrema", type: "number", field: "escala_dor", placeholder: "0", numberProps: { min: 0, max: 10 } },
  { id: "lesoes", section: "Limitações", label: "Possui ou já teve alguma lesão?", type: "textarea", field: "lesoes", placeholder: "Descreva aqui ou escreva 'Nenhuma'" },
  { id: "cirurgias", section: "Limitações", label: "Já realizou alguma cirurgia?", type: "textarea", field: "cirurgias", placeholder: "Descreva aqui ou escreva 'Nenhuma'" },
  { id: "restricao", section: "Limitações", label: "Possui alguma restrição médica?", type: "radio", field: "restricao_medica", options: ["Sim", "Não", "Não sei"] },
  { id: "liberacao", section: "Limitações", label: "Possui liberação médica para treinar?", type: "radio", field: "liberacao_medica", options: ["Sim", "Não", "Não se aplica"] },
  { id: "articulares", section: "Limitações", label: "Problemas articulares ou posturais?", subtitle: "Selecione todos que se aplicam", type: "checkbox", field: "problemas_articulares", options: ["Lombar", "Joelho", "Quadril", "Ombro", "Cervical", "Tornozelo", "Nenhum"] },

  // Objetivos
  { id: "obj_principal", section: "Objetivos", label: "Qual seu objetivo principal?", type: "radio", field: "objetivo_principal", options: ["Emagrecimento", "Hipertrofia", "Condicionamento", "Saúde", "Performance", "Mobilidade"] },
  { id: "obj_secundario", section: "Objetivos", label: "Tem algum objetivo secundário?", type: "radio", field: "objetivo_secundario", options: ["Nenhum", "Emagrecimento", "Hipertrofia", "Condicionamento", "Saúde", "Performance", "Mobilidade"] },
  { id: "prazo", section: "Objetivos", label: "Qual prazo desejado?", type: "radio", field: "prazo", options: ["30 dias", "3 meses", "6 meses", "1 ano", "Sem prazo"] },
  { id: "prioridade", section: "Objetivos", label: "Quanto isso é prioritário para você?", subtitle: "1 = Mínima | 5 = Máxima", type: "radio", field: "prioridade", options: ["1", "2", "3", "4", "5"] },
  { id: "evento", section: "Objetivos", label: "Treina para algum evento específico?", type: "text", field: "evento_especifico", placeholder: "Ex: Casamento, competição, viagem..." },

  // Hábitos e Comportamento
  { id: "sono", section: "Hábitos", label: "Quantas horas de sono por noite?", type: "radio", field: "sono_horas", options: ["Menos de 5 horas", "5 a 6 horas", "6 a 7 horas", "7 a 8 horas", "Mais de 8 horas"] },
  { id: "alimentacao", section: "Hábitos", label: "Como avalia sua alimentação?", type: "radio", field: "alimentacao", options: ["Muito ruim", "Ruim", "Regular", "Boa", "Muito boa"] },
  { id: "agua", section: "Hábitos", label: "Qual seu consumo diário de água?", type: "radio", field: "consumo_agua", options: ["Menos de 1 litro", "1 a 2 litros", "2 a 3 litros", "Mais de 3 litros"] },
  { id: "estresse", section: "Hábitos", label: "Qual seu nível de estresse?", type: "radio", field: "estresse", options: ["Baixo", "Moderado", "Alto"] },
  { id: "alcool", section: "Hábitos", label: "Consumo de álcool ou cigarro?", type: "radio", field: "alcool_cigarro", options: ["Não consumo", "Álcool ocasional", "Álcool frequente", "Cigarro", "Álcool e cigarro"] },
  { id: "motivacao", section: "Hábitos", label: "O que mais te motiva?", type: "radio", field: "motivacao", options: ["Resultados", "Saúde", "Estética", "Disciplina", "Bem-estar", "Performance"] },
  { id: "instrucao", section: "Hábitos", label: "Como prefere receber instruções?", type: "radio", field: "preferencia_instrucao", options: ["Explicado em detalhes", "Direto ao ponto"] },

  // Logística
  { id: "local", section: "Logística", label: "Onde pretende treinar?", type: "radio", field: "local_treino", options: ["Academia", "Condomínio", "Casa", "Estúdio", "Ar livre"] },
  { id: "tempo_sessao", section: "Logística", label: "Tempo disponível por sessão?", type: "radio", field: "tempo_disponivel", options: ["30 minutos", "45 minutos", "60 minutos", "Mais de 60 minutos"] },
  { id: "horario", section: "Logística", label: "Qual horário preferido?", type: "radio", field: "horario_preferido", options: ["Manhã", "Tarde", "Noite", "Horários flexíveis"] },
  { id: "tipo_preferido", section: "Logística", label: "Tipo de treino preferido?", type: "radio", field: "tipo_treino_preferido", options: ["Musculação", "Funcional", "Cardio", "Mobilidade", "HIIT", "Mix combinado"] },

  // Final
  { id: "comentarios", section: "Final", label: "Algo mais que gostaria de compartilhar?", subtitle: "Escreva algo que não foi perguntado, mas é importante", type: "textarea", field: "comentarios_finais", placeholder: "Suas observações finais..." },

  // Agente IA — Perfil comportamental e contexto
  { id: "perfil", section: "Seu jeito", label: "Qual frase mais combina com você agora?", subtitle: "Isso ajuda nosso agente a falar com você do jeito certo", type: "perfil", field: "perfil_primario", required: true },
  { id: "ins_cat", section: "Seu jeito", label: "Quão segura você se sente para começar?", subtitle: "Sem julgamento — isso define o ritmo do treino", type: "slider", field: "ins_cat", sliderLabels: ["Confiante (I1)", "Um pouco insegura (I2)", "Muito insegura (I3)"], required: true },
  { id: "rotina", section: "Seu jeito", label: "Como costuma ser sua rotina?", type: "radio", field: "rotina_tipo", options: ["pre_trabalho", "pos_trabalho", "livre"] },
  { id: "compromisso", section: "Seu jeito", label: "Em uma escala de 1 a 5, quão comprometido você está?", subtitle: "1 = vou tentar | 5 = vou seguir até o fim", type: "radio", field: "compromisso", options: ["1", "2", "3", "4", "5"] },
  { id: "frequencia_esperada", section: "Seu jeito", label: "Quantas vezes por semana pretende treinar?", type: "radio", field: "frequencia_esperada", options: ["2", "3", "4", "5"] },
  { id: "motivacao_real", section: "Seu jeito", label: "Por que você está aqui? Conte com suas palavras.", subtitle: "O que você escrever vira a forma como vamos te falar — então seja você mesma", type: "textarea", field: "motivacao_real", placeholder: "Ex: Quero parar de sentir dor nas costas todo dia ao acordar..." },
];

const ClientAnamnesis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { track } = useFunnelTracking();
  const [currentQ, setCurrentQ] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [trialWorkoutReady, setTrialWorkoutReady] = useState(false);

  // Check if user came from eligibility and has pre-filled pain data
  const eligibilityPain = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("eligibility_pain");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, []);

  const hasPainFromEligibility = eligibilityPain && (
    eligibilityPain.pain_shoulder || eligibilityPain.pain_lower_back || eligibilityPain.pain_knee
  );

  const [formData, setFormData] = useState<Record<string, any>>({
    age: "", gender: "", profession: "", contato: "", tempo_sentado_dia: "",
    peso_kg: "", altura_cm: "", autoimagem: "", regioes_que_deseja_melhorar: [],
    treina_atualmente: "", frequencia_atual: "", tipos_de_treino_feitos: [], tempo_parado: "",
    dores_atuais: "", escala_dor: "", lesoes: "", cirurgias: "",
    restricao_medica: "", liberacao_medica: "", problemas_articulares: [],
    objetivo_principal: "", objetivo_secundario: "", prazo: "", prioridade: "", evento_especifico: "",
    sono_horas: "", alimentacao: "", consumo_agua: "", estresse: "",
    alcool_cigarro: "", motivacao: "", preferencia_instrucao: "",
    local_treino: "", tempo_disponivel: "", horario_preferido: "", tipo_treino_preferido: "",
    comentarios_finais: "",
  });

  // Track anamnesis start
  useState(() => { track("anamnesis_start"); });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setFormData(prev => {
      const arr = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  // Filter questions: skip pain-related ones if already answered in eligibility
  const filteredQuestions = useMemo(() => {
    if (!hasPainFromEligibility) return QUESTIONS;
    // Skip the generic "dores" and "articulares" questions since they already told us
    const skipIds = ["dores", "articulares"];
    return QUESTIONS.filter(q => !skipIds.includes(q.id));
  }, [hasPainFromEligibility]);

  const question = filteredQuestions[currentQ];
  const totalQ = filteredQuestions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  // Get unique sections for section label
  const sections = [...new Set(filteredQuestions.map(q => q.section))];
  const currentSection = question.section;
  const sectionIndex = sections.indexOf(currentSection) + 1;

  const goNext = useCallback(() => {
    if (currentQ < totalQ - 1) {
      setDirection(1);
      setCurrentQ(prev => prev + 1);
    }
  }, [currentQ, totalQ]);

  const goPrev = useCallback(() => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ(prev => prev - 1);
    }
  }, [currentQ]);

  // Auto-advance on radio selection
  const handleRadioChange = useCallback((field: string, value: string) => {
    updateField(field, value);
    // Small delay for visual feedback before advancing
    setTimeout(() => {
      if (currentQ < totalQ - 1) {
        setDirection(1);
        setCurrentQ(prev => prev + 1);
      }
    }, 350);
  }, [currentQ, totalQ]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    setLoading(true);
    track("anamnesis_complete");
    try {
      // Merge eligibility pain data
      const painLocations = [...(formData.problemas_articulares || [])];
      if (eligibilityPain) {
        if (eligibilityPain.pain_shoulder && !painLocations.includes("Ombro")) painLocations.push("Ombro");
        if (eligibilityPain.pain_lower_back && !painLocations.includes("Lombar")) painLocations.push("Lombar");
        if (eligibilityPain.pain_knee && !painLocations.includes("Joelho")) painLocations.push("Joelho");
      }
      const hasJointPain = painLocations.length > 0 && !painLocations.includes("Nenhum");
      const { error: anamnesisError } = await supabase
        .from("anamnesis")
        .insert([{
          client_id: user.id,
          age: parseInt(formData.age) || null,
          gender: formData.gender || null,
          profession: formData.profession || null,
          contato: formData.contato || null,
          daily_sitting_hours: formData.tempo_sentado_dia ? parseInt(formData.tempo_sentado_dia.split(' ')[0]) : null,
          peso_kg: parseFloat(formData.peso_kg) || null,
          altura_cm: parseFloat(formData.altura_cm) || null,
          autoimagem: formData.autoimagem || null,
          regioes_que_deseja_melhorar: formData.regioes_que_deseja_melhorar.length > 0 ? formData.regioes_que_deseja_melhorar : null,
          treina_atualmente: formData.treina_atualmente === "Sim",
          frequencia_atual: formData.frequencia_atual || null,
          tipos_de_treino_feitos: formData.tipos_de_treino_feitos.length > 0 ? formData.tipos_de_treino_feitos : null,
          time_without_training: formData.tempo_parado || null,
          pain_details: formData.dores_atuais || null,
          escala_dor: parseInt(formData.escala_dor) || null,
          lesoes: formData.lesoes || null,
          cirurgias: formData.cirurgias || null,
          restricao_medica: formData.restricao_medica || null,
          liberacao_medica: formData.liberacao_medica || null,
          pain_locations: painLocations.length > 0 ? painLocations : null,
          has_joint_pain: hasJointPain,
          primary_goal: formData.objetivo_principal || null,
          objetivo_secundario: formData.objetivo_secundario || null,
          prazo: formData.prazo || null,
          prioridade: parseInt(formData.prioridade) || 3,
          evento_especifico: formData.evento_especifico || null,
          sono_horas: formData.sono_horas || null,
          alimentacao: formData.alimentacao || null,
          consumo_agua: formData.consumo_agua || null,
          estresse: formData.estresse || null,
          alcool_cigarro: formData.alcool_cigarro || null,
          motivacao: formData.motivacao || null,
          preferencia_instrucao: formData.preferencia_instrucao || null,
          local_treino: formData.local_treino || null,
          tempo_disponivel: formData.tempo_disponivel || null,
          horario_preferido: formData.horario_preferido || null,
          tipo_treino_preferido: formData.tipo_treino_preferido || null,
          comentarios_finais: formData.comentarios_finais || null,
        }]);

      if (anamnesisError) throw anamnesisError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          anamnesis_completed: true,
          anamnesis_last_update: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({ title: "Processando...", description: "Estamos analisando suas informações..." });

      let retries = 3;
      let profileCalculated = false;
      while (retries > 0 && !profileCalculated) {
        const { error: profileCalcError } = await supabase.functions.invoke(
          'calculate-anamnesis-profile',
          { body: { clientId: user.id } }
        );
        if (profileCalcError) {
          retries--;
          if (retries === 0) {
            toast({ title: "Erro ao processar anamnese", description: "Entre em contato com seu personal.", variant: "destructive" });
            setLoading(false);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          profileCalculated = true;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["has-workout", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["anamnesis-status", user.id] });

      setShowCompletion(true);
      setIsGeneratingWorkout(true);

      try {
        const { error: trialError } = await supabase.functions.invoke(
          'generate-trial-workout',
          { body: { clientId: user.id } }
        );
        if (trialError) console.error("Erro treino experimental:", trialError);
      } catch (e) {
        console.error("Erro treino experimental:", e);
      }

      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { clientId: user.id, platformUrl: window.location.origin + '/auth/login' }
        });
      } catch (e) {
        console.error("Erro email:", e);
      }

      await queryClient.invalidateQueries({ queryKey: ["has-workout", user.id] });
      setTrialWorkoutReady(true);
      setIsGeneratingWorkout(false);
    } catch (error: any) {
      console.error("Error submitting anamnesis:", error);
      toast({ title: "Erro ao salvar", description: error.message || "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.user_metadata?.full_name || "Aluno";

  if (showCompletion) {
    return (
      <AnamnesisCompletionScreen
        userName={userName}
        isGeneratingWorkout={isGeneratingWorkout}
        trialWorkoutReady={trialWorkoutReady}
        onContinue={() => navigate("/client/dashboard", { replace: true })}
      />
    );
  }

  const isLastQuestion = currentQ === totalQ - 1;
  const currentValue = formData[question.field];
  const hasValue = question.type === "checkbox"
    ? (currentValue as string[])?.length > 0
    : !!currentValue;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const renderInput = () => {
    switch (question.type) {
      case "text":
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => updateField(question.field, e.target.value)}
            placeholder={question.placeholder}
            className="text-lg h-14 bg-card border-border"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && hasValue && goNext()}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={currentValue || ""}
            onChange={(e) => updateField(question.field, e.target.value)}
            placeholder={question.placeholder}
            className="text-lg h-14 bg-card border-border"
            min={question.numberProps?.min}
            max={question.numberProps?.max}
            step={question.numberProps?.step}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && hasValue && goNext()}
          />
        );
      case "radio":
        return (
          <RadioCardGroup
            value={currentValue || ""}
            onValueChange={(value) => handleRadioChange(question.field, value)}
          >
            {question.options!.map((option) => (
              <RadioCardItem key={option} value={option}>
                {option}
              </RadioCardItem>
            ))}
          </RadioCardGroup>
        );
      case "checkbox":
        return (
          <div className="grid grid-cols-2 gap-3">
            {question.options!.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  (currentValue as string[])?.includes(option)
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Checkbox
                  checked={(currentValue as string[])?.includes(option)}
                  onCheckedChange={() => toggleArrayField(question.field, option)}
                />
                <span className="text-sm font-medium text-foreground">{option}</span>
              </label>
            ))}
          </div>
        );
      case "textarea":
        return (
          <Textarea
            value={currentValue || ""}
            onChange={(e) => updateField(question.field, e.target.value)}
            placeholder={question.placeholder}
            className="text-base bg-card border-border min-h-[120px]"
            autoFocus
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <img src={meuTreinoLogo} alt="Meu Treino" className="h-8" />
          <span className="text-xs font-medium text-muted-foreground">
            {currentQ + 1} / {totalQ}
          </span>
        </div>
        {/* Progress bar */}
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

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQ}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {/* Section label */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {currentSection}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({sectionIndex}/{sections.length})
                </span>
              </div>

              {/* Question */}
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {question.label}
                </h2>
                {question.subtitle && (
                  <p className="text-muted-foreground text-sm">
                    {question.subtitle}
                  </p>
                )}
              </div>

              {/* Input */}
              <div className="pt-2">
                {renderInput()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentQ === 0 || loading}
            className="min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Concluir
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={loading}
              className="min-w-[140px]"
            >
              {question.type === "radio" ? "Pular" : "Próximo"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAnamnesis;