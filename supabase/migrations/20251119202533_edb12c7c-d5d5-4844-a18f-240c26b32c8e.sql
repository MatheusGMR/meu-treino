-- FASE 1: Criar estrutura de banco de dados para Sistema de Anamnese

-- 1.1 Criar tabela de anamnese
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identificação
  age INTEGER,
  gender TEXT,
  profession TEXT,
  daily_sitting_hours INTEGER,
  
  -- Nível de atividade
  activity_level TEXT, -- sedentary, lightly_active, regularly_active, athlete
  time_without_training TEXT, -- never, less_6_months, 6_12_months, more_1_year
  training_location TEXT, -- home, gym, both
  
  -- Experiência e limitações
  previous_weight_training BOOLEAN,
  has_joint_pain BOOLEAN,
  pain_locations TEXT[], -- lombar, joelhos, ombros, outras
  pain_details TEXT,
  has_injury_or_surgery BOOLEAN,
  injury_type TEXT, -- recent, old, none
  injury_details TEXT,
  medical_restrictions TEXT[], -- hipertensao, diabetes, hormonal, cardiac, gestante, others
  medical_restrictions_details TEXT,
  
  -- Objetivos
  primary_goal TEXT, -- weight_loss, muscle_gain, definition, pain_relief, conditioning, health_longevity
  secondary_goals TEXT[], -- energy, self_esteem, sleep, stress
  
  -- Autoavaliação corporal (1-5)
  current_body_type INTEGER CHECK (current_body_type BETWEEN 1 AND 5),
  desired_body_type INTEGER CHECK (desired_body_type BETWEEN 1 AND 5),
  
  -- Hábitos
  sleep_quality TEXT, -- great, regular, poor
  nutrition_quality TEXT, -- very_poor, medium, good
  water_intake TEXT, -- less_1L, 1_2L, more_2L
  
  -- Perfil comportamental
  discipline_level TEXT, -- disciplined, motivated_but_inconsistent, needs_constant_support
  workout_preference TEXT, -- short_intense, long_light
  handles_challenges TEXT, -- loves, depends, prefers_controlled
  
  -- Perfil profissional
  work_shift TEXT, -- morning, afternoon, night, alternating
  work_type TEXT, -- physical, sedentary, mixed
  has_children BOOLEAN,
  
  -- Resultados calculados
  calculated_profile TEXT,
  profile_confidence_score NUMERIC CHECK (profile_confidence_score BETWEEN 0 AND 100),
  dimension_scores JSONB,
  
  -- Conclusão
  wants_personalized_plan BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Criar tabela de perfis predefinidos
CREATE TABLE IF NOT EXISTS public.anamnesis_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_number INTEGER UNIQUE NOT NULL CHECK (profile_number BETWEEN 1 AND 10),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy TEXT NOT NULL,
  typical_combination JSONB NOT NULL,
  risk_factors TEXT[],
  recommended_training_type TEXT[],
  recommended_intensity TEXT,
  recommended_frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Criar tabela de recomendações por perfil
CREATE TABLE IF NOT EXISTS public.anamnesis_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.anamnesis_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- training, nutrition, lifestyle, medical
  priority TEXT NOT NULL, -- high, medium, low
  recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Atualizar tabela profiles com campos de anamnese
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS anamnesis_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anamnesis_profile TEXT,
ADD COLUMN IF NOT EXISTS anamnesis_last_update TIMESTAMPTZ;

-- 1.5 RLS Policies

-- Políticas para anamnesis
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem inserir própria anamnese"
ON public.anamnesis
FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clientes podem atualizar própria anamnese"
ON public.anamnesis
FOR UPDATE
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clientes podem ver própria anamnese"
ON public.anamnesis
FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.client_assignments
    WHERE client_assignments.client_id = anamnesis.client_id
    AND client_assignments.personal_id = auth.uid()
    AND client_assignments.status = 'Ativo'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Políticas para anamnesis_profiles (público para leitura)
ALTER TABLE public.anamnesis_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver perfis"
ON public.anamnesis_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar perfis"
ON public.anamnesis_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para anamnesis_recommendations
ALTER TABLE public.anamnesis_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver recomendações"
ON public.anamnesis_recommendations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar recomendações"
ON public.anamnesis_recommendations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed dos 10 perfis predefinidos baseados no PDF
INSERT INTO public.anamnesis_profiles (profile_number, name, description, strategy, typical_combination, risk_factors, recommended_training_type, recommended_intensity, recommended_frequency) VALUES
(1, 'Sedentário com sobrepeso e dores', 
'Cliente com histórico de inatividade prolongada, sobrepeso significativo e presença de dores articulares ou lombares. Geralmente possui restrições médicas como hipertensão ou diabetes.',
'Progressão gradual com foco em condicionamento básico e fortalecimento funcional. Priorizar movimentos de baixo impacto e conscientização corporal.',
'{"activity_level": ["sedentary"], "current_body_type": [4, 5], "has_joint_pain": true, "medical_restrictions": ["hipertensao", "diabetes"]}',
ARRAY['Sobrecarga articular', 'Desmotivação por resultados lentos', 'Risco cardiovascular'],
ARRAY['Funcional adaptado', 'Circuito leve', 'Pilates'],
'low',
'2-3x por semana'),

(2, 'Sedentário sem dores',
'Cliente sem experiência em musculação, mas sem limitações físicas significativas. Pode ter sobrepeso leve ou estar no peso normal.',
'Introdução progressiva à musculação com foco em criar hábito. Iniciar com cargas leves e muita técnica.',
'{"activity_level": ["sedentary"], "has_joint_pain": false, "has_injury_or_surgery": false, "primary_goal": ["health_longevity", "conditioning"]}',
ARRAY['Abandono precoce', 'Lesões por falta de técnica'],
ARRAY['Musculação básica', 'Funcional', 'Mobilidade'],
'low',
'2-3x por semana'),

(3, 'Ex-atleta parado há muito tempo',
'Cliente com histórico esportivo, mas inativo há mais de 1 ano. Geralmente mantém boa memória muscular, mas pode ter lesões antigas.',
'Retomada cautelosa respeitando limitações atuais. Foco em recondicionamento antes de intensidade.',
'{"time_without_training": ["more_1_year"], "previous_weight_training": true, "activity_level": ["sedentary", "lightly_active"], "has_injury_or_surgery": true}',
ARRAY['Querer voltar com intensidade do passado', 'Reagravamento de lesões antigas'],
ARRAY['Musculação progressiva', 'Funcional', 'Reabilitação'],
'moderate',
'3-4x por semana'),

(4, 'Trabalhador braçal ou atleta amador ativo',
'Cliente com alta atividade física diária (trabalho ou esporte amador), mas busca resultados estéticos ou de performance específicos.',
'Treino complementar sem overtraining. Foco em áreas não trabalhadas na atividade principal.',
'{"activity_level": ["regularly_active", "athlete"], "work_type": ["physical"], "primary_goal": ["muscle_gain", "definition"]}',
ARRAY['Overtraining', 'Desequilíbrios musculares'],
ARRAY['Musculação específica', 'Reforço muscular', 'Mobilidade'],
'moderate',
'3-4x por semana'),

(5, 'Iniciante motivado sem restrições',
'Cliente jovem ou de meia-idade sem histórico de lesões, com disponibilidade de tempo e alta motivação.',
'Aproveitamento da motivação inicial para criar base sólida. Progressão rápida mas técnica.',
'{"activity_level": ["lightly_active", "regularly_active"], "has_joint_pain": false, "discipline_level": ["disciplined", "motivated_but_inconsistent"], "primary_goal": ["muscle_gain", "definition"]}',
ARRAY['Overtraining por excesso de motivação', 'Lesões por querer progredir rápido'],
ARRAY['Musculação progressiva', 'Hipertrofia', 'Funcional'],
'moderate',
'4-5x por semana'),

(6, 'Cliente com objetivo estético definido',
'Cliente experiente focado em hipertrofia ou definição muscular. Já treina há algum tempo e busca refinamento.',
'Periodização estruturada com foco em hipertrofia ou definição. Treino avançado e controle nutricional.',
'{"previous_weight_training": true, "activity_level": ["regularly_active", "athlete"], "primary_goal": ["muscle_gain", "definition"], "discipline_level": ["disciplined"]}',
ARRAY['Estagnação de resultados', 'Overtraining', 'Lesões por carga excessiva'],
ARRAY['Hipertrofia periodizada', 'Definição muscular', 'Divisão de treino'],
'high',
'5-6x por semana'),

(7, 'Terceira idade ativa',
'Cliente acima de 60 anos buscando manutenção de saúde, mobilidade e qualidade de vida.',
'Treino funcional com foco em prevenção de quedas, manutenção de massa muscular e mobilidade articular.',
'{"age": 60, "primary_goal": ["health_longevity", "pain_relief"], "activity_level": ["lightly_active", "regularly_active"]}',
ARRAY['Quedas', 'Sarcopenia', 'Osteoporose', 'Lesões articulares'],
ARRAY['Funcional adaptado', 'Fortalecimento', 'Equilíbrio', 'Mobilidade'],
'low',
'3x por semana'),

(8, 'Gestante ou pós-parto',
'Cliente gestante ou em recuperação pós-parto buscando manter condicionamento e prevenir dores.',
'Treino adaptado por trimestre (gestante) ou fase de recuperação (pós-parto). Foco em core, assoalho pélvico e postura.',
'{"medical_restrictions": ["gestante"], "primary_goal": ["health_longevity", "pain_relief"], "gender": "feminino"}',
ARRAY['Diástase abdominal', 'Dores lombares', 'Incontinência', 'Contrações prematuras'],
ARRAY['Funcional adaptado', 'Pilates', 'Fortalecimento de core', 'Mobilidade'],
'low',
'2-3x por semana'),

(9, 'Profissional com rotina intensa',
'Cliente com pouco tempo livre devido a trabalho ou família. Busca eficiência e treinos curtos.',
'Treinos de alta eficiência (30-45min). Foco em compostos e circuitos. Flexibilidade de horários.',
'{"work_shift": ["alternating", "night"], "has_children": true, "workout_preference": ["short_intense"], "discipline_level": ["motivated_but_inconsistent"]}',
ARRAY['Abandono por falta de tempo', 'Sono irregular', 'Overtraining compensatório'],
ARRAY['HIIT', 'Circuito metabólico', 'Funcional intenso', 'Treino ABC curto'],
'high',
'3x por semana'),

(10, 'Reabilitação pós-lesão',
'Cliente em processo de recuperação de lesão ou cirurgia. Necessita treino terapêutico e progressão cautelosa.',
'Reabilitação funcional progressiva. Trabalho conjunto com fisioterapeuta. Fortalecimento da região afetada e prevenção de compensações.',
'{"has_injury_or_surgery": true, "injury_type": ["recent"], "primary_goal": ["pain_relief", "conditioning"]}',
ARRAY['Reagravamento da lesão', 'Compensações musculares', 'Retorno precoce'],
ARRAY['Reabilitação funcional', 'Fortalecimento específico', 'Mobilidade', 'Propriocepção'],
'low',
'3x por semana');

-- Seed de recomendações por perfil (exemplos para alguns perfis)
INSERT INTO public.anamnesis_recommendations (profile_id, category, priority, recommendation)
SELECT 
  id,
  'training',
  'high',
  CASE profile_number
    WHEN 1 THEN 'Inicie com exercícios de baixo impacto como caminhada, bicicleta ergométrica e exercícios na água. Progrida gradualmente para musculação com máquinas guiadas.'
    WHEN 2 THEN 'Comece com treino ABC básico, 3x por semana. Priorize aprendizado de técnica sobre carga. Use máquinas guiadas nas primeiras semanas.'
    WHEN 3 THEN 'Inicie com 50-60% da carga que usava antigamente. Foque em recondicionamento por 4-6 semanas antes de aumentar intensidade.'
    WHEN 5 THEN 'Estruture treino progressivo com divisão ABC ou ABCD. Aumente carga semanalmente mas sempre priorizando técnica perfeita.'
    WHEN 6 THEN 'Implemente periodização com fases de volume e intensidade. Considere divisão ABCDE com 2 grupos musculares por treino.'
    WHEN 7 THEN 'Foque em exercícios funcionais que simulem movimentos do dia a dia. Inclua trabalho de equilíbrio em todas as sessões.'
    WHEN 9 THEN 'Utilize treinos de 30-40min com super-séries e bi-sets. Priorize exercícios compostos que trabalhem múltiplos grupos musculares.'
    WHEN 10 THEN 'Siga protocolo de reabilitação progressivo: mobilidade → fortalecimento isométrico → fortalecimento dinâmico → fortalecimento funcional.'
  END
FROM public.anamnesis_profiles
WHERE profile_number IN (1, 2, 3, 5, 6, 7, 9, 10);

INSERT INTO public.anamnesis_recommendations (profile_id, category, priority, recommendation)
SELECT 
  id,
  'nutrition',
  'high',
  CASE profile_number
    WHEN 1 THEN 'Consulte nutricionista para déficit calórico moderado (300-500 kcal). Priorize proteínas magras, vegetais e reduza carboidratos refinados e açúcares.'
    WHEN 2 THEN 'Mantenha alimentação equilibrada com foco em proteínas (1.6g/kg). Evite dietas radicais - foque em criar hábitos sustentáveis.'
    WHEN 6 THEN 'Para hipertrofia: superávit calórico de 200-300 kcal com 2g proteína/kg. Para definição: déficit de 300-500 kcal mantendo alta proteína.'
    WHEN 7 THEN 'Garanta ingestão adequada de proteínas (1.2g/kg) para prevenir sarcopenia. Suplementação de vitamina D e cálcio pode ser necessária.'
    WHEN 8 THEN 'Gestantes: aumente 300-500 kcal com foco em nutrientes essenciais. Pós-parto: mantenha boa nutrição especialmente se amamentando.'
  END
FROM public.anamnesis_profiles
WHERE profile_number IN (1, 2, 6, 7, 8);

INSERT INTO public.anamnesis_recommendations (profile_id, category, priority, recommendation)
SELECT 
  id,
  'lifestyle',
  'medium',
  CASE profile_number
    WHEN 1 THEN 'Priorize sono de qualidade (7-8h). Inclua caminhadas leves nos dias sem treino. Considere atividades relaxantes como yoga.'
    WHEN 5 THEN 'Garanta 7-9h de sono para recuperação. Mantenha hidratação adequada (35ml/kg). Evite álcool em excesso.'
    WHEN 9 THEN 'Otimize qualidade do sono mesmo com rotina intensa. Use finais de semana para recuperação ativa. Considere técnicas de gerenciamento de estresse.'
  END
FROM public.anamnesis_profiles
WHERE profile_number IN (1, 5, 9);

INSERT INTO public.anamnesis_recommendations (profile_id, category, priority, recommendation)
SELECT 
  id,
  'medical',
  'high',
  CASE profile_number
    WHEN 1 THEN 'Consulte cardiologista antes de iniciar treinos. Monitore pressão arterial regularmente. Mantenha acompanhamento médico contínuo.'
    WHEN 3 THEN 'Avaliação ortopédica recomendada para checar lesões antigas. Considere fisioterapia preventiva se houver compensações.'
    WHEN 8 THEN 'Gestantes: liberação médica obrigatória. Pós-parto: aguardar liberação médica (geralmente 6-8 semanas cesárea, 4-6 parto normal).'
    WHEN 10 THEN 'Acompanhamento fisioterapêutico obrigatório. Retornos médicos periódicos para avaliar evolução. Respeite rigorosamente os limites.'
  END
FROM public.anamnesis_profiles
WHERE profile_number IN (1, 3, 8, 10);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_anamnesis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER set_anamnesis_updated_at
BEFORE UPDATE ON public.anamnesis
FOR EACH ROW
EXECUTE FUNCTION update_anamnesis_updated_at();