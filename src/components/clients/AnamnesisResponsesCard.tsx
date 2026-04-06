import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Anamnesis = Tables<"anamnesis">;

interface AnamnesisResponsesCardProps {
  anamnesis: Anamnesis;
}

export const AnamnesisResponsesCard = ({ anamnesis }: AnamnesisResponsesCardProps) => {
  const formatArray = (arr: string[] | null) => arr?.join(", ") || "Não informado";
  const display = (value: string | number | null | undefined) => value != null && value !== "" ? String(value) : "Não informado";
  const displayBool = (value: boolean | null) => value === null ? "Não informado" : value ? "Sim" : "Não";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Respostas da Anamnese</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="personal">
            <AccordionTrigger>Informações Pessoais</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Idade</p>
                  <p className="text-muted-foreground">{display(anamnesis.age)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Gênero</p>
                  <p className="text-muted-foreground">{display(anamnesis.gender)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Profissão</p>
                  <p className="text-muted-foreground">{display(anamnesis.profession)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Contato</p>
                  <p className="text-muted-foreground">{display(anamnesis.contato)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Horas sentado por dia</p>
                  <p className="text-muted-foreground">{display(anamnesis.daily_sitting_hours)}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="body">
            <AccordionTrigger>Composição Corporal</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Peso (kg)</p>
                  <p className="text-muted-foreground">{display(anamnesis.peso_kg)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Altura (cm)</p>
                  <p className="text-muted-foreground">{display(anamnesis.altura_cm)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">IMC calculado</p>
                  <p className="text-muted-foreground">{anamnesis.imc_calculado ? Number(anamnesis.imc_calculado).toFixed(1) : "Não calculado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Categoria IMC</p>
                  <p className="text-muted-foreground">{display(anamnesis.imc_categoria)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Autoimagem</p>
                  <p className="text-muted-foreground">{display(anamnesis.autoimagem)}</p>
                </div>
              </div>
              {anamnesis.regioes_que_deseja_melhorar && anamnesis.regioes_que_deseja_melhorar.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Regiões que deseja melhorar</p>
                  <p className="text-muted-foreground">{formatArray(anamnesis.regioes_que_deseja_melhorar)}</p>
                </div>
              )}
              {(anamnesis.current_body_type || anamnesis.desired_body_type) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Tipo corporal atual</p>
                    <p className="text-muted-foreground">{display(anamnesis.current_body_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tipo corporal desejado</p>
                    <p className="text-muted-foreground">{display(anamnesis.desired_body_type)}</p>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="activity">
            <AccordionTrigger>Histórico de Treino</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Treina atualmente</p>
                  <p className="text-muted-foreground">{displayBool(anamnesis.treina_atualmente)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Frequência atual</p>
                  <p className="text-muted-foreground">{display(anamnesis.frequencia_atual)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tempo sem treinar</p>
                  <p className="text-muted-foreground">{display(anamnesis.time_without_training)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nível de experiência</p>
                  <p className="text-muted-foreground">{display(anamnesis.nivel_experiencia)}</p>
                </div>
              </div>
              {anamnesis.tipos_de_treino_feitos && anamnesis.tipos_de_treino_feitos.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Tipos de treino já realizados</p>
                  <p className="text-muted-foreground">{formatArray(anamnesis.tipos_de_treino_feitos)}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health">
            <AccordionTrigger>Limitações e Saúde</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {(anamnesis.has_joint_pain || anamnesis.has_injury_or_surgery || 
                (anamnesis.medical_restrictions && anamnesis.medical_restrictions.length > 0) ||
                anamnesis.restricao_medica) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este cliente possui restrições de saúde. Revise cuidadosamente antes de prescrever exercícios.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Dor nas articulações</p>
                  <p className="text-muted-foreground">{displayBool(anamnesis.has_joint_pain)}</p>
                  {anamnesis.pain_locations && anamnesis.pain_locations.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Locais de dor / problemas articulares</p>
                      <p className="text-muted-foreground">{formatArray(anamnesis.pain_locations)}</p>
                    </>
                  )}
                  {anamnesis.pain_details && (
                    <>
                      <p className="text-sm font-medium mt-2">Detalhes da dor</p>
                      <p className="text-muted-foreground">{anamnesis.pain_details}</p>
                    </>
                  )}
                  {anamnesis.escala_dor != null && anamnesis.escala_dor > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Escala de dor</p>
                      <p className="text-muted-foreground">{anamnesis.escala_dor}/10</p>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">Lesões</p>
                  <p className="text-muted-foreground">{display(anamnesis.lesoes)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Cirurgias</p>
                  <p className="text-muted-foreground">{display(anamnesis.cirurgias)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Restrição médica</p>
                  <p className="text-muted-foreground">{display(anamnesis.restricao_medica)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Liberação médica</p>
                  <p className="text-muted-foreground">{display(anamnesis.liberacao_medica)}</p>
                </div>

                {anamnesis.has_injury_or_surgery && (
                  <div>
                    <p className="text-sm font-medium">Lesão ou cirurgia prévia</p>
                    <p className="text-muted-foreground">{displayBool(anamnesis.has_injury_or_surgery)}</p>
                    {anamnesis.injury_type && (
                      <>
                        <p className="text-sm font-medium mt-2">Tipo</p>
                        <p className="text-muted-foreground">{anamnesis.injury_type}</p>
                      </>
                    )}
                    {anamnesis.injury_details && (
                      <>
                        <p className="text-sm font-medium mt-2">Detalhes</p>
                        <p className="text-muted-foreground">{anamnesis.injury_details}</p>
                      </>
                    )}
                  </div>
                )}

                {anamnesis.medical_restrictions && anamnesis.medical_restrictions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Restrições médicas (lista)</p>
                    <p className="text-muted-foreground">{formatArray(anamnesis.medical_restrictions)}</p>
                    {anamnesis.medical_restrictions_details && (
                      <>
                        <p className="text-sm font-medium mt-2">Detalhes</p>
                        <p className="text-muted-foreground">{anamnesis.medical_restrictions_details}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="goals">
            <AccordionTrigger>Objetivos</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Objetivo principal</p>
                  <p className="text-muted-foreground">{display(anamnesis.primary_goal)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Objetivo secundário</p>
                  <p className="text-muted-foreground">{display(anamnesis.objetivo_secundario)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Prazo</p>
                  <p className="text-muted-foreground">{display(anamnesis.prazo)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Prioridade</p>
                  <p className="text-muted-foreground">{display(anamnesis.prioridade)}</p>
                </div>
              </div>
              {anamnesis.evento_especifico && (
                <div>
                  <p className="text-sm font-medium">Evento específico</p>
                  <p className="text-muted-foreground">{anamnesis.evento_especifico}</p>
                </div>
              )}
              {anamnesis.secondary_goals && anamnesis.secondary_goals.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Objetivos secundários (lista)</p>
                  <p className="text-muted-foreground">{formatArray(anamnesis.secondary_goals)}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lifestyle">
            <AccordionTrigger>Hábitos e Estilo de Vida</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Sono</p>
                  <p className="text-muted-foreground">{display(anamnesis.sono_horas || anamnesis.sleep_quality)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Alimentação</p>
                  <p className="text-muted-foreground">{display(anamnesis.alimentacao || anamnesis.nutrition_quality)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Consumo de água</p>
                  <p className="text-muted-foreground">{display(anamnesis.consumo_agua || anamnesis.water_intake)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nível de estresse</p>
                  <p className="text-muted-foreground">{display(anamnesis.estresse)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Álcool / Cigarro</p>
                  <p className="text-muted-foreground">{display(anamnesis.alcool_cigarro)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Motivação</p>
                  <p className="text-muted-foreground">{display(anamnesis.motivacao)}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="logistics">
            <AccordionTrigger>Logística e Preferências</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Local de treino</p>
                  <p className="text-muted-foreground">{display(anamnesis.local_treino || anamnesis.training_location)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tempo disponível</p>
                  <p className="text-muted-foreground">{display(anamnesis.tempo_disponivel)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Horário preferido</p>
                  <p className="text-muted-foreground">{display(anamnesis.horario_preferido)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo de treino preferido</p>
                  <p className="text-muted-foreground">{display(anamnesis.tipo_treino_preferido || anamnesis.workout_preference)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Preferência de instrução</p>
                  <p className="text-muted-foreground">{display(anamnesis.preferencia_instrucao)}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {anamnesis.comentarios_finais && (
            <AccordionItem value="comments">
              <AccordionTrigger>Comentários Finais</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{anamnesis.comentarios_finais}</p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};