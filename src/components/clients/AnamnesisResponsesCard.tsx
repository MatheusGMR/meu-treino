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
                  <p className="text-muted-foreground">{anamnesis.age || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Gênero</p>
                  <p className="text-muted-foreground">{anamnesis.gender || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Profissão</p>
                  <p className="text-muted-foreground">{anamnesis.profession || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tem filhos</p>
                  <p className="text-muted-foreground">
                    {anamnesis.has_children === null ? "Não informado" : anamnesis.has_children ? "Sim" : "Não"}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="professional">
            <AccordionTrigger>Perfil Profissional</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Tipo de trabalho</p>
                  <p className="text-muted-foreground">{anamnesis.work_type || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Turno</p>
                  <p className="text-muted-foreground">{anamnesis.work_shift || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Horas sentado por dia</p>
                  <p className="text-muted-foreground">{anamnesis.daily_sitting_hours || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Lida com desafios</p>
                  <p className="text-muted-foreground">{anamnesis.handles_challenges || "Não informado"}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="activity">
            <AccordionTrigger>Atividade Física</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nível de atividade</p>
                  <p className="text-muted-foreground">{anamnesis.activity_level || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tempo sem treinar</p>
                  <p className="text-muted-foreground">{anamnesis.time_without_training || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Local de treino</p>
                  <p className="text-muted-foreground">{anamnesis.training_location || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Treinou musculação antes</p>
                  <p className="text-muted-foreground">
                    {anamnesis.previous_weight_training === null ? "Não informado" : anamnesis.previous_weight_training ? "Sim" : "Não"}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="health">
            <AccordionTrigger>Estado de Saúde</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {(anamnesis.has_joint_pain || anamnesis.has_injury_or_surgery || anamnesis.medical_restrictions) && (
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
                  <p className="text-muted-foreground">
                    {anamnesis.has_joint_pain === null ? "Não informado" : anamnesis.has_joint_pain ? "Sim" : "Não"}
                  </p>
                  {anamnesis.pain_locations && anamnesis.pain_locations.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-2">Locais de dor</p>
                      <p className="text-muted-foreground">{formatArray(anamnesis.pain_locations)}</p>
                    </>
                  )}
                  {anamnesis.pain_details && (
                    <>
                      <p className="text-sm font-medium mt-2">Detalhes</p>
                      <p className="text-muted-foreground">{anamnesis.pain_details}</p>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Lesão ou cirurgia</p>
                  <p className="text-muted-foreground">
                    {anamnesis.has_injury_or_surgery === null ? "Não informado" : anamnesis.has_injury_or_surgery ? "Sim" : "Não"}
                  </p>
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
                {anamnesis.medical_restrictions && anamnesis.medical_restrictions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Restrições médicas</p>
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
              <div>
                <p className="text-sm font-medium">Objetivo principal</p>
                <p className="text-muted-foreground">{anamnesis.primary_goal || "Não informado"}</p>
              </div>
              {anamnesis.secondary_goals && anamnesis.secondary_goals.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Objetivos secundários</p>
                  <p className="text-muted-foreground">{formatArray(anamnesis.secondary_goals)}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lifestyle">
            <AccordionTrigger>Estilo de Vida</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Qualidade do sono</p>
                  <p className="text-muted-foreground">{anamnesis.sleep_quality || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Qualidade da alimentação</p>
                  <p className="text-muted-foreground">{anamnesis.nutrition_quality || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ingestão de água</p>
                  <p className="text-muted-foreground">{anamnesis.water_intake || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nível de disciplina</p>
                  <p className="text-muted-foreground">{anamnesis.discipline_level || "Não informado"}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="behavior">
            <AccordionTrigger>Perfil Comportamental</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Preferência de treino</p>
                <p className="text-muted-foreground">{anamnesis.workout_preference || "Não informado"}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="body">
            <AccordionTrigger>Avaliação Corporal</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Tipo corporal atual</p>
                  <p className="text-muted-foreground">{anamnesis.current_body_type || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tipo corporal desejado</p>
                  <p className="text-muted-foreground">{anamnesis.desired_body_type || "Não informado"}</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
