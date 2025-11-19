import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import logoJmFull from "@/assets/logo-jm-full.png";

const ClientAnamnesis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Informações Pessoais
    age: "",
    gender: "",
    profession: "",
    has_children: false,
    
    // Step 2: Perfil Profissional
    work_type: "",
    work_shift: "",
    daily_sitting_hours: "",
    
    // Step 3: Atividade Física
    activity_level: "",
    previous_weight_training: false,
    time_without_training: "",
    training_location: "",
    workout_preference: "",
    
    // Step 4: Saúde
    has_joint_pain: false,
    pain_locations: [] as string[],
    pain_details: "",
    has_injury_or_surgery: false,
    injury_type: "",
    injury_details: "",
    medical_restrictions: [] as string[],
    medical_restrictions_details: "",
    
    // Step 5: Objetivos e Estilo de Vida
    primary_goal: "",
    secondary_goals: [] as string[],
    current_body_type: "",
    desired_body_type: "",
    sleep_quality: "",
    nutrition_quality: "",
    water_intake: "",
    
    // Step 6: Perfil Comportamental
    discipline_level: "",
    handles_challenges: "",
    wants_personalized_plan: false,
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
      // Insert anamnesis data
      const { error: anamnesisError } = await supabase
        .from("anamnesis")
        .insert([{
          client_id: user.id,
          age: parseInt(formData.age) || null,
          gender: formData.gender || null,
          profession: formData.profession || null,
          has_children: formData.has_children,
          work_type: formData.work_type || null,
          work_shift: formData.work_shift || null,
          daily_sitting_hours: parseInt(formData.daily_sitting_hours) || null,
          activity_level: formData.activity_level || null,
          previous_weight_training: formData.previous_weight_training,
          time_without_training: formData.time_without_training || null,
          training_location: formData.training_location || null,
          workout_preference: formData.workout_preference || null,
          has_joint_pain: formData.has_joint_pain,
          pain_locations: formData.pain_locations.length > 0 ? formData.pain_locations : null,
          pain_details: formData.pain_details || null,
          has_injury_or_surgery: formData.has_injury_or_surgery,
          injury_type: formData.injury_type || null,
          injury_details: formData.injury_details || null,
          medical_restrictions: formData.medical_restrictions.length > 0 ? formData.medical_restrictions : null,
          medical_restrictions_details: formData.medical_restrictions_details || null,
          primary_goal: formData.primary_goal || null,
          secondary_goals: formData.secondary_goals.length > 0 ? formData.secondary_goals : null,
          current_body_type: parseInt(formData.current_body_type) || null,
          desired_body_type: parseInt(formData.desired_body_type) || null,
          sleep_quality: formData.sleep_quality || null,
          nutrition_quality: formData.nutrition_quality || null,
          water_intake: formData.water_intake || null,
          discipline_level: formData.discipline_level || null,
          handles_challenges: formData.handles_challenges || null,
          wants_personalized_plan: formData.wants_personalized_plan,
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

      toast({
        title: "Anamnese concluída!",
        description: "Suas informações foram salvas com sucesso.",
      });

      navigate("/dashboard");
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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="Digite sua idade"
              />
            </div>

            <div className="space-y-2">
              <Label>Gênero</Label>
              <RadioGroup value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Masculino" id="masc" />
                  <Label htmlFor="masc">Masculino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Feminino" id="fem" />
                  <Label htmlFor="fem">Feminino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Outro" id="outro" />
                  <Label htmlFor="outro">Outro</Label>
                </div>
              </RadioGroup>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has_children"
                checked={formData.has_children}
                onCheckedChange={(checked) => updateField("has_children", checked)}
              />
              <Label htmlFor="has_children">Tem filhos</Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de trabalho</Label>
              <RadioGroup value={formData.work_type} onValueChange={(value) => updateField("work_type", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Escritório" id="office" />
                  <Label htmlFor="office">Escritório</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Físico" id="physical" />
                  <Label htmlFor="physical">Físico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Misto" id="mixed" />
                  <Label htmlFor="mixed">Misto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Home Office" id="home" />
                  <Label htmlFor="home">Home Office</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Turno de trabalho</Label>
              <RadioGroup value={formData.work_shift} onValueChange={(value) => updateField("work_shift", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Diurno" id="day" />
                  <Label htmlFor="day">Diurno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Noturno" id="night" />
                  <Label htmlFor="night">Noturno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Alternado" id="alt" />
                  <Label htmlFor="alt">Alternado</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sitting">Horas sentado por dia</Label>
              <Input
                id="sitting"
                type="number"
                value={formData.daily_sitting_hours}
                onChange={(e) => updateField("daily_sitting_hours", e.target.value)}
                placeholder="Ex: 8"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nível de atividade física</Label>
              <RadioGroup value={formData.activity_level} onValueChange={(value) => updateField("activity_level", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sedentário" id="sed" />
                  <Label htmlFor="sed">Sedentário</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Leve" id="light" />
                  <Label htmlFor="light">Leve</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Moderado" id="mod" />
                  <Label htmlFor="mod">Moderado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Intenso" id="int" />
                  <Label htmlFor="int">Intenso</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="prev_training"
                checked={formData.previous_weight_training}
                onCheckedChange={(checked) => updateField("previous_weight_training", checked)}
              />
              <Label htmlFor="prev_training">Já treinou musculação antes</Label>
            </div>

            <div className="space-y-2">
              <Label>Tempo sem treinar</Label>
              <RadioGroup value={formData.time_without_training} onValueChange={(value) => updateField("time_without_training", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Menos de 1 mês" id="t1" />
                  <Label htmlFor="t1">Menos de 1 mês</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-6 meses" id="t2" />
                  <Label htmlFor="t2">1-6 meses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="6-12 meses" id="t3" />
                  <Label htmlFor="t3">6-12 meses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Mais de 1 ano" id="t4" />
                  <Label htmlFor="t4">Mais de 1 ano</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Preferência de local</Label>
              <RadioGroup value={formData.training_location} onValueChange={(value) => updateField("training_location", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Academia" id="gym" />
                  <Label htmlFor="gym">Academia</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Casa" id="house" />
                  <Label htmlFor="house">Casa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ambos" id="both" />
                  <Label htmlFor="both">Ambos</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="joint_pain"
                checked={formData.has_joint_pain}
                onCheckedChange={(checked) => updateField("has_joint_pain", checked)}
              />
              <Label htmlFor="joint_pain">Sente dores articulares</Label>
            </div>

            {formData.has_joint_pain && (
              <>
                <div className="space-y-2">
                  <Label>Locais de dor</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Joelho", "Ombro", "Costas", "Pescoço", "Quadril", "Punho"].map((loc) => (
                      <div key={loc} className="flex items-center space-x-2">
                        <Checkbox
                          id={loc}
                          checked={formData.pain_locations.includes(loc)}
                          onCheckedChange={() => toggleArrayField("pain_locations", loc)}
                        />
                        <Label htmlFor={loc}>{loc}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pain_details">Detalhes sobre as dores</Label>
                  <Textarea
                    id="pain_details"
                    value={formData.pain_details}
                    onChange={(e) => updateField("pain_details", e.target.value)}
                    placeholder="Descreva suas dores..."
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="injury"
                checked={formData.has_injury_or_surgery}
                onCheckedChange={(checked) => updateField("has_injury_or_surgery", checked)}
              />
              <Label htmlFor="injury">Teve lesões ou cirurgias</Label>
            </div>

            {formData.has_injury_or_surgery && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="injury_type">Tipo de lesão/cirurgia</Label>
                  <Input
                    id="injury_type"
                    value={formData.injury_type}
                    onChange={(e) => updateField("injury_type", e.target.value)}
                    placeholder="Ex: Cirurgia no joelho"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injury_details">Detalhes</Label>
                  <Textarea
                    id="injury_details"
                    value={formData.injury_details}
                    onChange={(e) => updateField("injury_details", e.target.value)}
                    placeholder="Conte mais sobre a lesão ou cirurgia..."
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Restrições médicas</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Hipertensão", "Diabetes", "Problemas cardíacos", "Asma", "Nenhuma"].map((rest) => (
                  <div key={rest} className="flex items-center space-x-2">
                    <Checkbox
                      id={rest}
                      checked={formData.medical_restrictions.includes(rest)}
                      onCheckedChange={() => toggleArrayField("medical_restrictions", rest)}
                    />
                    <Label htmlFor={rest}>{rest}</Label>
                  </div>
                ))}
              </div>
            </div>

            {formData.medical_restrictions.length > 0 && !formData.medical_restrictions.includes("Nenhuma") && (
              <div className="space-y-2">
                <Label htmlFor="med_details">Detalhes sobre restrições</Label>
                <Textarea
                  id="med_details"
                  value={formData.medical_restrictions_details}
                  onChange={(e) => updateField("medical_restrictions_details", e.target.value)}
                  placeholder="Forneça mais informações..."
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo principal</Label>
              <RadioGroup value={formData.primary_goal} onValueChange={(value) => updateField("primary_goal", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Emagrecimento" id="g1" />
                  <Label htmlFor="g1">Emagrecimento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Hipertrofia" id="g2" />
                  <Label htmlFor="g2">Ganho de massa muscular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Condicionamento" id="g3" />
                  <Label htmlFor="g3">Condicionamento físico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Saúde" id="g4" />
                  <Label htmlFor="g4">Saúde e bem-estar</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Objetivos secundários (opcional)</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Flexibilidade", "Força", "Resistência", "Mobilidade"].map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.secondary_goals.includes(goal)}
                      onCheckedChange={() => toggleArrayField("secondary_goals", goal)}
                    />
                    <Label htmlFor={goal}>{goal}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_body">Tipo corporal atual (1-9)</Label>
              <Input
                id="current_body"
                type="number"
                min="1"
                max="9"
                value={formData.current_body_type}
                onChange={(e) => updateField("current_body_type", e.target.value)}
                placeholder="1 = muito magro, 9 = obeso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_body">Tipo corporal desejado (1-9)</Label>
              <Input
                id="desired_body"
                type="number"
                min="1"
                max="9"
                value={formData.desired_body_type}
                onChange={(e) => updateField("desired_body_type", e.target.value)}
                placeholder="1 = muito magro, 9 = obeso"
              />
            </div>

            <div className="space-y-2">
              <Label>Qualidade do sono</Label>
              <RadioGroup value={formData.sleep_quality} onValueChange={(value) => updateField("sleep_quality", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ruim" id="s1" />
                  <Label htmlFor="s1">Ruim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Regular" id="s2" />
                  <Label htmlFor="s2">Regular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Boa" id="s3" />
                  <Label htmlFor="s3">Boa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Excelente" id="s4" />
                  <Label htmlFor="s4">Excelente</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Qualidade da alimentação</Label>
              <RadioGroup value={formData.nutrition_quality} onValueChange={(value) => updateField("nutrition_quality", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ruim" id="n1" />
                  <Label htmlFor="n1">Ruim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Regular" id="n2" />
                  <Label htmlFor="n2">Regular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Boa" id="n3" />
                  <Label htmlFor="n3">Boa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Excelente" id="n4" />
                  <Label htmlFor="n4">Excelente</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Ingestão de água</Label>
              <RadioGroup value={formData.water_intake} onValueChange={(value) => updateField("water_intake", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Menos de 1L" id="w1" />
                  <Label htmlFor="w1">Menos de 1L</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1-2L" id="w2" />
                  <Label htmlFor="w2">1-2L</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2-3L" id="w3" />
                  <Label htmlFor="w3">2-3L</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Mais de 3L" id="w4" />
                  <Label htmlFor="w4">Mais de 3L</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nível de disciplina</Label>
              <RadioGroup value={formData.discipline_level} onValueChange={(value) => updateField("discipline_level", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Baixo" id="d1" />
                  <Label htmlFor="d1">Baixo - preciso de bastante motivação</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Médio" id="d2" />
                  <Label htmlFor="d2">Médio - geralmente mantenho consistência</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Alto" id="d3" />
                  <Label htmlFor="d3">Alto - sou muito disciplinado</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Como lida com desafios?</Label>
              <RadioGroup value={formData.handles_challenges} onValueChange={(value) => updateField("handles_challenges", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Desisto facilmente" id="c1" />
                  <Label htmlFor="c1">Desisto facilmente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Persisto com dificuldade" id="c2" />
                  <Label htmlFor="c2">Persisto com dificuldade</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Enfrento bem" id="c3" />
                  <Label htmlFor="c3">Enfrento bem</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Amo desafios" id="c4" />
                  <Label htmlFor="c4">Amo desafios</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Preferência de treino</Label>
              <RadioGroup value={formData.workout_preference} onValueChange={(value) => updateField("workout_preference", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Sozinho" id="p1" />
                  <Label htmlFor="p1">Prefiro treinar sozinho</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Com parceiro" id="p2" />
                  <Label htmlFor="p2">Gosto de treinar com parceiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Em grupo" id="p3" />
                  <Label htmlFor="p3">Prefiro treinos em grupo</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="personalized"
                checked={formData.wants_personalized_plan}
                onCheckedChange={(checked) => updateField("wants_personalized_plan", checked)}
              />
              <Label htmlFor="personalized">Desejo receber um plano personalizado baseado nesta anamnese</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Informações Pessoais";
      case 2: return "Perfil Profissional";
      case 3: return "Atividade Física";
      case 4: return "Saúde";
      case 5: return "Objetivos e Estilo de Vida";
      case 6: return "Perfil Comportamental";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoJmFull} alt="JM" className="h-12" />
          </div>
          <CardTitle>Anamnese - Primeira vez</CardTitle>
          <CardDescription>
            Precisamos conhecer você melhor. Preencha a anamnese para personalizar seu treino.
          </CardDescription>
          <div className="mt-4">
            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Etapa {currentStep} de {totalSteps}: {getStepTitle()}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                disabled={loading}
              >
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Concluir"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnamnesis;
