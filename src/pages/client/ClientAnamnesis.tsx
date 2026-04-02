import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioCardGroup, RadioCardItem } from "@/components/ui/radio-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import logoJmFull from "@/assets/logo-jm-full.png";
import { AnamnesisProgress } from "@/components/client/anamnesis/AnamnesisProgress";
import { AnamnesisNavigation } from "@/components/client/anamnesis/AnamnesisNavigation";
import { AnamnesisStepHeader } from "@/components/client/anamnesis/AnamnesisStepHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnamnesisCompletionScreen } from "@/components/client/AnamnesisCompletionScreen";

const ClientAnamnesis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [trialWorkoutReady, setTrialWorkoutReady] = useState(false);
  const totalSteps = 8;

  // Form state - Anamnese 2.0
  const [formData, setFormData] = useState({
    // Pilar 1: Identificação
    age: "",
    gender: "",
    profession: "",
    contato: "",
    tempo_sentado_dia: "",
    
    // Pilar 2: Composição Corporal
    peso_kg: "",
    altura_cm: "",
    autoimagem: "",
    regioes_que_deseja_melhorar: [] as string[],
    
    // Pilar 3: Histórico de Treino
    treina_atualmente: "",
    frequencia_atual: "",
    tipos_de_treino_feitos: [] as string[],
    tempo_parado: "",
    
    // Pilar 4: Limitações e Segurança
    dores_atuais: "",
    escala_dor: "",
    lesoes: "",
    cirurgias: "",
    restricao_medica: "",
    liberacao_medica: "",
    problemas_articulares: [] as string[],
    
    // Pilar 5: Objetivos
    objetivo_principal: "",
    objetivo_secundario: "",
    prazo: "",
    prioridade: "",
    evento_especifico: "",
    
    // Pilar 6: Hábitos e Comportamento
    sono_horas: "",
    alimentacao: "",
    consumo_agua: "",
    estresse: "",
    alcool_cigarro: "",
    motivacao: "",
    preferencia_instrucao: "",
    
    // Pilar 7: Logística
    local_treino: "",
    tempo_disponivel: "",
    horario_preferido: "",
    tipo_treino_preferido: "",
    
    // Pilar 8: Final
    comentarios_finais: "",
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(v => v !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Insert anamnesis data with new fields
      const { error: anamnesisError } = await supabase
        .from("anamnesis")
        .insert([{
          client_id: user.id,
          // Pilar 1
          age: parseInt(formData.age) || null,
          gender: formData.gender || null,
          profession: formData.profession || null,
          contato: formData.contato || null,
          daily_sitting_hours: formData.tempo_sentado_dia ? parseInt(formData.tempo_sentado_dia.split(' ')[0]) : null,
          
          // Pilar 2
          peso_kg: parseFloat(formData.peso_kg) || null,
          altura_cm: parseFloat(formData.altura_cm) || null,
          autoimagem: formData.autoimagem || null,
          regioes_que_deseja_melhorar: formData.regioes_que_deseja_melhorar.length > 0 ? formData.regioes_que_deseja_melhorar : null,
          
          // Pilar 3
          treina_atualmente: formData.treina_atualmente === "Sim",
          frequencia_atual: formData.frequencia_atual || null,
          tipos_de_treino_feitos: formData.tipos_de_treino_feitos.length > 0 ? formData.tipos_de_treino_feitos : null,
          time_without_training: formData.tempo_parado || null,
          
          // Pilar 4
          pain_details: formData.dores_atuais || null,
          escala_dor: parseInt(formData.escala_dor) || null,
          lesoes: formData.lesoes || null,
          cirurgias: formData.cirurgias || null,
          restricao_medica: formData.restricao_medica || null,
          liberacao_medica: formData.liberacao_medica || null,
          pain_locations: formData.problemas_articulares.length > 0 ? formData.problemas_articulares : null,
          has_joint_pain: formData.problemas_articulares.length > 0 && !formData.problemas_articulares.includes("Nenhum"),
          
          // Pilar 5
          primary_goal: formData.objetivo_principal || null,
          objetivo_secundario: formData.objetivo_secundario || null,
          prazo: formData.prazo || null,
          prioridade: parseInt(formData.prioridade) || 3,
          evento_especifico: formData.evento_especifico || null,
          
          // Pilar 6
          sono_horas: formData.sono_horas || null,
          alimentacao: formData.alimentacao || null,
          consumo_agua: formData.consumo_agua || null,
          estresse: formData.estresse || null,
          alcool_cigarro: formData.alcool_cigarro || null,
          motivacao: formData.motivacao || null,
          preferencia_instrucao: formData.preferencia_instrucao || null,
          
          // Pilar 7
          local_treino: formData.local_treino || null,
          tempo_disponivel: formData.tempo_disponivel || null,
          horario_preferido: formData.horario_preferido || null,
          tipo_treino_preferido: formData.tipo_treino_preferido || null,
          
          // Pilar 8
          comentarios_finais: formData.comentarios_finais || null,
        }]);

      if (anamnesisError) throw anamnesisError;

      // Update profile to mark anamnesis as completed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          anamnesis_completed: true,
          anamnesis_last_update: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Mostrar loading state para o usuário
      toast({
        title: "Processando...",
        description: "Estamos analisando suas informações. Aguarde alguns instantes...",
      });

      // Chamar edge function para calcular perfil da anamnese com retry automático
      let retries = 3;
      let profileCalculated = false;

      while (retries > 0 && !profileCalculated) {
        console.log(`🔄 Calculando perfil (tentativa ${4 - retries}/3)...`);
        
        const { data: profileData, error: profileCalcError } = await supabase.functions.invoke(
          'calculate-anamnesis-profile',
          { body: { clientId: user.id } }
        );

        if (profileCalcError) {
          console.error(`❌ Tentativa ${4 - retries} falhou:`, profileCalcError);
          retries--;
          
          if (retries === 0) {
            // ÚLTIMA tentativa falhou - BLOQUEAR progressão
            toast({
              title: "Erro ao processar anamnese",
              description: "Não foi possível calcular seu perfil. Entre em contato com seu personal.",
              variant: "destructive",
            });
            setLoading(false);
            return; // ✅ Bloquear fluxo
          }
          
          // Aguardar 2s antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log("✅ Perfil calculado com sucesso:", profileData);
          profileCalculated = true;
        }
      }

      // Invalidar cache para forçar reload
      await queryClient.invalidateQueries({ queryKey: ["has-workout", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["anamnesis-status", user.id] });

      // Mostrar tela de conclusão
      setShowCompletion(true);
      setIsGeneratingWorkout(true);

      // Gerar treino experimental em background
      try {
        const { data: trialData, error: trialError } = await supabase.functions.invoke(
          'generate-trial-workout',
          { body: { clientId: user.id } }
        );
        if (trialError) {
          console.error("Erro ao gerar treino experimental:", trialError);
        } else {
          console.log("✅ Treino experimental gerado:", trialData);
        }
      } catch (e) {
        console.error("Erro no treino experimental:", e);
      }

      // Enviar email de boas-vindas em background
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { 
            clientId: user.id,
            platformUrl: window.location.origin + '/auth/login',
          }
        });
      } catch (e) {
        console.error("Erro ao enviar email:", e);
      }

      // Invalidar novamente após gerar treino
      await queryClient.invalidateQueries({ queryKey: ["has-workout", user.id] });
      setTrialWorkoutReady(true);
      setIsGeneratingWorkout(false);

    } catch (error: any) {
      console.error("Error submitting anamnesis:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate("/client/dashboard", { replace: true });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Pilar 1: Identificação
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Identificação"
              description="Vamos começar conhecendo você melhor"
            />

            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="Ex: 29"
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero *</Label>
              <RadioCardGroup value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                {["Masculino", "Feminino", "Não-binário", "Prefiro não dizer"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profissão</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => updateField("profession", e.target.value)}
                placeholder="Qual sua profissão?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">Contato (WhatsApp ou Email)</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => updateField("contato", e.target.value)}
                placeholder="(99) 99999-9999 ou email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Tempo sentado por dia</Label>
              <RadioCardGroup value={formData.tempo_sentado_dia} onValueChange={(value) => updateField("tempo_sentado_dia", value)}>
                {["Menos de 2 horas", "2 a 4 horas", "4 a 6 horas", "6 a 8 horas", "Mais de 8 horas"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>
          </div>
        );

      case 2: // Pilar 2: Composição Corporal
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Composição Corporal"
              description="Informações sobre seu corpo atual"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso_kg}
                  onChange={(e) => updateField("peso_kg", e.target.value)}
                  placeholder="Ex: 75.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  value={formData.altura_cm}
                  onChange={(e) => updateField("altura_cm", e.target.value)}
                  placeholder="Ex: 175"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Como você se enxerga hoje?</Label>
              <RadioCardGroup value={formData.autoimagem} onValueChange={(value) => updateField("autoimagem", value)}>
                {["Abaixo do peso", "Peso normal", "Sobrepeso", "Obesidade", "Não sei avaliar"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Regiões que deseja melhorar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {["Peito", "Costas", "Ombros", "Braços", "Abdômen", "Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilhas", "Mobilidade", "Postura"].map((regiao) => (
                  <div key={regiao} className="flex items-center space-x-2">
                    <Checkbox
                      id={`regiao-${regiao}`}
                      checked={formData.regioes_que_deseja_melhorar.includes(regiao)}
                      onCheckedChange={() => toggleArrayField("regioes_que_deseja_melhorar", regiao)}
                    />
                    <Label htmlFor={`regiao-${regiao}`} className="text-sm">{regiao}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Pilar 3: Histórico de Treino
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Histórico de Treino"
              description="Conte-nos sobre sua experiência com atividades físicas"
            />

            <div className="space-y-2">
              <Label>Você treina atualmente?</Label>
              <RadioCardGroup value={formData.treina_atualmente} onValueChange={(value) => updateField("treina_atualmente", value)}>
                {["Sim", "Não"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Frequência atual</Label>
              <RadioCardGroup value={formData.frequencia_atual} onValueChange={(value) => updateField("frequencia_atual", value)}>
                {["0 vezes/semana", "1 vez/semana", "2 vezes/semana", "3 vezes/semana", "4 vezes/semana", "5 vezes/semana", "6+ vezes/semana"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Tipos de treino que já realizou</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {["Musculação", "Funcional", "Crossfit", "Corrida", "Lutas", "Pilates", "Yoga", "HIIT", "Esportes coletivos"].map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tipo-${tipo}`}
                      checked={formData.tipos_de_treino_feitos.includes(tipo)}
                      onCheckedChange={() => toggleArrayField("tipos_de_treino_feitos", tipo)}
                    />
                    <Label htmlFor={`tipo-${tipo}`} className="text-sm">{tipo}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Caso esteja parado, há quanto tempo?</Label>
              <RadioCardGroup value={formData.tempo_parado} onValueChange={(value) => updateField("tempo_parado", value)}>
                {["Não estou parado", "Menos de 1 mês", "1 a 3 meses", "3 a 6 meses", "6 a 12 meses", "Mais de 1 ano"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>
          </div>
        );

      case 4: // Pilar 4: Limitações e Segurança
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Limitações e Segurança"
              description="Informações importantes para sua segurança no treino"
            />

            <div className="space-y-2">
              <Label htmlFor="dores">Dores atuais</Label>
              <Textarea
                id="dores"
                value={formData.dores_atuais}
                onChange={(e) => updateField("dores_atuais", e.target.value)}
                placeholder="Descreva qualquer dor que esteja sentindo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="escala_dor">Escala de dor (0 a 10)</Label>
              <p className="text-sm text-muted-foreground">0 = sem dor | 10 = dor extrema</p>
              <Input
                id="escala_dor"
                type="number"
                min="0"
                max="10"
                value={formData.escala_dor}
                onChange={(e) => updateField("escala_dor", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesoes">Lesões</Label>
              <Textarea
                id="lesoes"
                value={formData.lesoes}
                onChange={(e) => updateField("lesoes", e.target.value)}
                placeholder="Descreva lesões que já teve..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cirurgias">Cirurgias</Label>
              <Textarea
                id="cirurgias"
                value={formData.cirurgias}
                onChange={(e) => updateField("cirurgias", e.target.value)}
                placeholder="Descreva cirurgias que já fez..."
              />
            </div>

            <div className="space-y-2">
              <Label>Possui alguma restrição médica?</Label>
              <RadioCardGroup value={formData.restricao_medica} onValueChange={(value) => updateField("restricao_medica", value)}>
                {["Sim", "Não", "Não sei"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Possui liberação médica?</Label>
              <RadioCardGroup value={formData.liberacao_medica} onValueChange={(value) => updateField("liberacao_medica", value)}>
                {["Sim", "Não", "Não se aplica"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Problemas articulares / posturais</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {["Lombar", "Joelho", "Quadril", "Ombro", "Cervical", "Tornozelo", "Nenhum"].map((problema) => (
                  <div key={problema} className="flex items-center space-x-2">
                    <Checkbox
                      id={`problema-${problema}`}
                      checked={formData.problemas_articulares.includes(problema)}
                      onCheckedChange={() => toggleArrayField("problemas_articulares", problema)}
                    />
                    <Label htmlFor={`problema-${problema}`} className="text-sm">{problema}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Pilar 5: Objetivos
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Objetivos"
              description="Defina suas metas e expectativas"
            />

            <div className="space-y-2">
              <Label>Objetivo principal</Label>
              <RadioCardGroup value={formData.objetivo_principal} onValueChange={(value) => updateField("objetivo_principal", value)}>
                {["Emagrecimento", "Hipertrofia", "Condicionamento", "Saúde", "Performance", "Mobilidade"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Objetivo secundário</Label>
              <RadioCardGroup value={formData.objetivo_secundario} onValueChange={(value) => updateField("objetivo_secundario", value)}>
                {["Nenhum", "Emagrecimento", "Hipertrofia", "Condicionamento", "Saúde", "Performance", "Mobilidade"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Prazo desejado</Label>
              <RadioCardGroup value={formData.prazo} onValueChange={(value) => updateField("prazo", value)}>
                {["30 dias", "3 meses", "6 meses", "1 ano", "Sem prazo"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Prioridade (1 a 5)</Label>
              <p className="text-sm text-muted-foreground">Quanto isso é prioritário para você?</p>
              <RadioCardGroup value={formData.prioridade} onValueChange={(value) => updateField("prioridade", value)}>
                {["1", "2", "3", "4", "5"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option} {option === "5" ? "(Máxima)" : option === "1" ? "(Mínima)" : ""}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento">Treina para algum evento específico?</Label>
              <Input
                id="evento"
                value={formData.evento_especifico}
                onChange={(e) => updateField("evento_especifico", e.target.value)}
                placeholder="Ex: Casamento, competição, viagem..."
              />
            </div>
          </div>
        );

      case 6: // Pilar 6: Hábitos e Comportamento
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Hábitos e Comportamento"
              description="Entenda como seu estilo de vida impacta seus resultados"
            />

            <div className="space-y-2">
              <Label>Horas de sono por noite</Label>
              <RadioCardGroup value={formData.sono_horas} onValueChange={(value) => updateField("sono_horas", value)}>
                {["Menos de 5 horas", "5 a 6 horas", "6 a 7 horas", "7 a 8 horas", "Mais de 8 horas"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Como avalia sua alimentação?</Label>
              <RadioCardGroup value={formData.alimentacao} onValueChange={(value) => updateField("alimentacao", value)}>
                {["Muito ruim", "Ruim", "Regular", "Boa", "Muito boa"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Consumo diário de água</Label>
              <RadioCardGroup value={formData.consumo_agua} onValueChange={(value) => updateField("consumo_agua", value)}>
                {["Menos de 1 litro", "1 a 2 litros", "2 a 3 litros", "Mais de 3 litros"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Nível de estresse</Label>
              <RadioCardGroup value={formData.estresse} onValueChange={(value) => updateField("estresse", value)}>
                {["Baixo", "Moderado", "Alto"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Consumo de álcool / cigarro</Label>
              <RadioCardGroup value={formData.alcool_cigarro} onValueChange={(value) => updateField("alcool_cigarro", value)}>
                {["Não consumo", "Álcool ocasional", "Álcool frequente", "Cigarro", "Álcool e cigarro"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>O que mais te motiva?</Label>
              <RadioCardGroup value={formData.motivacao} onValueChange={(value) => updateField("motivacao", value)}>
                {["Resultados", "Saúde", "Estética", "Disciplina", "Bem-estar", "Performance"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Como prefere receber instruções?</Label>
              <RadioCardGroup value={formData.preferencia_instrucao} onValueChange={(value) => updateField("preferencia_instrucao", value)}>
                {["Explicado em detalhes", "Direto ao ponto"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>
          </div>
        );

      case 7: // Pilar 7: Logística
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Logística"
              description="Organize sua rotina de treinos"
            />

            <div className="space-y-2">
              <Label>Onde pretende treinar?</Label>
              <RadioCardGroup value={formData.local_treino} onValueChange={(value) => updateField("local_treino", value)}>
                {["Academia", "Condomínio", "Casa", "Estúdio", "Ar livre"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Tempo disponível por sessão</Label>
              <RadioCardGroup value={formData.tempo_disponivel} onValueChange={(value) => updateField("tempo_disponivel", value)}>
                {["30 minutos", "45 minutos", "60 minutos", "Mais de 60 minutos"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Horário preferido</Label>
              <RadioCardGroup value={formData.horario_preferido} onValueChange={(value) => updateField("horario_preferido", value)}>
                {["Manhã", "Tarde", "Noite", "Horários flexíveis"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>

            <div className="space-y-2">
              <Label>Tipo de treino preferido</Label>
              <RadioCardGroup value={formData.tipo_treino_preferido} onValueChange={(value) => updateField("tipo_treino_preferido", value)}>
                {["Musculação", "Funcional", "Cardio", "Mobilidade", "HIIT", "Mix combinado"].map((option) => (
                  <RadioCardItem key={option} value={option}>
                    {option}
                  </RadioCardItem>
                ))}
              </RadioCardGroup>
            </div>
          </div>
        );

      case 8: // Pilar 8: Final
        return (
          <div className="space-y-4">
            <AnamnesisStepHeader
              title="Comentários Finais"
              description="Algo mais que gostaria de compartilhar?"
            />

            <div className="space-y-2">
              <Label htmlFor="comentarios">Comentários finais</Label>
              <Textarea
                id="comentarios"
                value={formData.comentarios_finais}
                onChange={(e) => updateField("comentarios_finais", e.target.value)}
                placeholder="Escreva algo que não foi perguntado, mas é importante..."
                rows={6}
              />
            </div>

            <div className="rounded-lg bg-primary/10 p-4 mt-6">
              <p className="text-sm text-center">
                🎯 Você está quase lá! Revise suas respostas e clique em <strong>Concluir</strong> para finalizar sua anamnese.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center p-2 sm:p-4 md:p-6">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center px-4 sm:px-6 py-6">
          <CardTitle className="text-2xl sm:text-3xl">Queremos conhecer você melhor</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            Responda algumas perguntas para personalizarmos seu treino
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:px-6 pb-6">
          <AnamnesisProgress currentStep={currentStep} totalSteps={totalSteps} />
          
          {renderStep()}

          <AnamnesisNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={() => {
              setCurrentStep(prev => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNext={() => {
              setCurrentStep(prev => Math.min(totalSteps, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnamnesis;
