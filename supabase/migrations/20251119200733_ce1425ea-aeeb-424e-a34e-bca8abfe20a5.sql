-- Criar tabela de mapeamento de restrições médicas
CREATE TABLE IF NOT EXISTS public.medical_condition_exercise_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condition_keyword TEXT NOT NULL,
  restricted_exercise_groups TEXT[] NOT NULL,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('warning', 'danger', 'critical')),
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.medical_condition_exercise_restrictions ENABLE ROW LEVEL SECURITY;

-- Policy para personals e admins lerem
CREATE POLICY "Personals e admins podem ver restrições"
ON public.medical_condition_exercise_restrictions
FOR SELECT
USING (
  has_role(auth.uid(), 'personal'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy para admins gerenciarem
CREATE POLICY "Admins podem gerenciar restrições"
ON public.medical_condition_exercise_restrictions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Inserir dados iniciais de restrições comuns
INSERT INTO public.medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation) VALUES
  ('hipertensão', ARRAY['Outro'], 'warning', 'Evitar exercícios que elevem muito a pressão arterial. Monitorar frequência cardíaca.'),
  ('pressão alta', ARRAY['Outro'], 'warning', 'Evitar exercícios que elevem muito a pressão arterial. Monitorar frequência cardíaca.'),
  ('hérnia', ARRAY['Abdômen', 'Costas'], 'danger', 'Contraindicado exercícios que pressionem região abdominal ou sobrecarreguem a coluna.'),
  ('hérnia de disco', ARRAY['Abdômen', 'Costas'], 'danger', 'Evitar sobrecarga na coluna vertebral. Exercícios com impacto são contraindicados.'),
  ('problema cardíaco', ARRAY['Outro'], 'critical', 'CRÍTICO: Consultar médico antes de iniciar qualquer atividade física.'),
  ('cardíaco', ARRAY['Outro'], 'critical', 'CRÍTICO: Consultar médico antes de iniciar qualquer atividade física.'),
  ('cardiopatia', ARRAY['Outro'], 'critical', 'CRÍTICO: Consultar médico antes de iniciar qualquer atividade física.'),
  ('lesão joelho', ARRAY['Pernas', 'Glúteos'], 'warning', 'Evitar exercícios de impacto e sobrecarga nos joelhos. Priorizar exercícios controlados.'),
  ('problema joelho', ARRAY['Pernas', 'Glúteos'], 'warning', 'Evitar exercícios de impacto e sobrecarga nos joelhos.'),
  ('lesão coluna', ARRAY['Costas', 'Pernas', 'Abdômen'], 'danger', 'Evitar sobrecarga na coluna vertebral. Exercícios com peso devem ser supervisionados.'),
  ('problema coluna', ARRAY['Costas', 'Pernas', 'Abdômen'], 'danger', 'Evitar sobrecarga na coluna vertebral.'),
  ('escoliose', ARRAY['Costas'], 'warning', 'Atenção a exercícios unilaterais. Focar em fortalecimento simétrico.'),
  ('lordose', ARRAY['Costas', 'Abdômen'], 'warning', 'Evitar hiperextensão da coluna. Fortalecer abdômen.'),
  ('cifose', ARRAY['Costas', 'Peito'], 'warning', 'Evitar exercícios que curvem ainda mais a coluna.'),
  ('tendinite', ARRAY['Ombros', 'Peito', 'Costas'], 'warning', 'Evitar movimentos repetitivos e sobrecarga na região afetada.'),
  ('bursite', ARRAY['Ombros'], 'warning', 'Evitar elevações acima da cabeça e movimentos que comprimam a articulação.'),
  ('artrose', ARRAY['Pernas', 'Ombros'], 'warning', 'Evitar impacto. Priorizar exercícios controlados e de baixo impacto.'),
  ('diabetes', ARRAY['Outro'], 'warning', 'Monitorar glicemia antes e após exercícios. Evitar jejum prolongado.'),
  ('asma', ARRAY['Outro'], 'warning', 'Ter broncodilatador sempre disponível. Evitar ambientes muito frios ou com poluição.'),
  ('obesidade', ARRAY['Pernas'], 'warning', 'Iniciar com exercícios de baixo impacto. Progressão gradual da intensidade.'),
  ('gestante', ARRAY['Abdômen', 'Costas'], 'critical', 'CRÍTICO: Liberação médica obrigatória. Evitar decúbito dorsal após 1º trimestre.');

-- Criar tabela de log de validações de atribuição (para auditoria)
CREATE TABLE IF NOT EXISTS public.workout_assignment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workout_id UUID REFERENCES public.client_workouts(id) ON DELETE CASCADE,
  validation_result JSONB NOT NULL,
  override_reason TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.workout_assignment_validations ENABLE ROW LEVEL SECURITY;

-- Policy para personals verem seus logs
CREATE POLICY "Personals veem próprios logs de validação"
ON public.workout_assignment_validations
FOR SELECT
USING (
  assigned_by = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Policy para criar logs
CREATE POLICY "Sistema cria logs de validação"
ON public.workout_assignment_validations
FOR INSERT
WITH CHECK (
  assigned_by = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);