-- Anamnese 2.0: Adicionar novos campos à tabela anamnesis
ALTER TABLE anamnesis
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS peso_kg numeric,
  ADD COLUMN IF NOT EXISTS altura_cm numeric,
  ADD COLUMN IF NOT EXISTS autoimagem text,
  ADD COLUMN IF NOT EXISTS regioes_que_deseja_melhorar text[],
  ADD COLUMN IF NOT EXISTS treina_atualmente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequencia_atual text,
  ADD COLUMN IF NOT EXISTS tipos_de_treino_feitos text[],
  ADD COLUMN IF NOT EXISTS escala_dor integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lesoes text,
  ADD COLUMN IF NOT EXISTS cirurgias text,
  ADD COLUMN IF NOT EXISTS restricao_medica text,
  ADD COLUMN IF NOT EXISTS liberacao_medica text,
  ADD COLUMN IF NOT EXISTS objetivo_secundario text,
  ADD COLUMN IF NOT EXISTS prazo text,
  ADD COLUMN IF NOT EXISTS prioridade integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS evento_especifico text,
  ADD COLUMN IF NOT EXISTS sono_horas text,
  ADD COLUMN IF NOT EXISTS alimentacao text,
  ADD COLUMN IF NOT EXISTS consumo_agua text,
  ADD COLUMN IF NOT EXISTS estresse text,
  ADD COLUMN IF NOT EXISTS alcool_cigarro text,
  ADD COLUMN IF NOT EXISTS motivacao text,
  ADD COLUMN IF NOT EXISTS preferencia_instrucao text,
  ADD COLUMN IF NOT EXISTS local_treino text,
  ADD COLUMN IF NOT EXISTS tempo_disponivel text,
  ADD COLUMN IF NOT EXISTS horario_preferido text,
  ADD COLUMN IF NOT EXISTS tipo_treino_preferido text,
  ADD COLUMN IF NOT EXISTS comentarios_finais text;

-- Migração de dados existentes (só migrar registros que não têm os novos campos)
UPDATE anamnesis
SET 
  frequencia_atual = CASE 
    WHEN activity_level = 'Muito Ativo' THEN '6+ vezes/semana'
    WHEN activity_level = 'Ativo' THEN '4 vezes/semana'
    WHEN activity_level = 'Moderado' THEN '2 vezes/semana'
    ELSE '0 vezes/semana'
  END,
  sono_horas = CASE 
    WHEN sleep_quality = 'Boa' THEN '7 a 8 horas'
    WHEN sleep_quality = 'Regular' THEN '6 a 7 horas'
    ELSE '5 a 6 horas'
  END,
  alimentacao = CASE 
    WHEN nutrition_quality = 'Boa' THEN 'Boa'
    WHEN nutrition_quality = 'Regular' THEN 'Regular'
    ELSE 'Ruim'
  END,
  consumo_agua = CASE 
    WHEN water_intake = 'Adequada' THEN '2 a 3 litros'
    WHEN water_intake = 'Regular' THEN '1 a 2 litros'
    ELSE 'Menos de 1 litro'
  END,
  autoimagem = CASE 
    WHEN current_body_type <= 2 THEN 'Abaixo do peso'
    WHEN current_body_type BETWEEN 3 AND 4 THEN 'Peso normal'
    WHEN current_body_type BETWEEN 5 AND 6 THEN 'Sobrepeso'
    ELSE 'Obesidade'
  END,
  local_treino = training_location,
  tipo_treino_preferido = workout_preference,
  restricao_medica = CASE 
    WHEN medical_restrictions IS NOT NULL AND array_length(medical_restrictions, 1) > 0 THEN 'Sim'
    ELSE 'Não'
  END,
  treina_atualmente = COALESCE(previous_weight_training, false),
  objetivo_secundario = CASE 
    WHEN secondary_goals IS NOT NULL AND array_length(secondary_goals, 1) > 0 
    THEN secondary_goals[1]
    ELSE 'Nenhum'
  END,
  estresse = CASE 
    WHEN handles_challenges = 'Bem' THEN 'Baixo'
    WHEN handles_challenges = 'Regular' THEN 'Moderado'
    ELSE 'Alto'
  END,
  alcool_cigarro = 'Não consumo',
  preferencia_instrucao = 'Explicado em detalhes'
WHERE contato IS NULL;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_anamnesis_peso_altura 
  ON anamnesis(peso_kg, altura_cm) WHERE peso_kg IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anamnesis_objetivos 
  ON anamnesis(primary_goal, objetivo_secundario);

CREATE INDEX IF NOT EXISTS idx_anamnesis_prioridade 
  ON anamnesis(prioridade) WHERE prioridade IS NOT NULL;