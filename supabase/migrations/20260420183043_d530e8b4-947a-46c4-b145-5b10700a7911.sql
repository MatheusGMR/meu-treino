
-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE public.dor_categoria AS ENUM ('D0', 'D1', 'D2', 'D3');
CREATE TYPE public.inseguranca_categoria AS ENUM ('I1', 'I2', 'I3');
CREATE TYPE public.tempo_categoria AS ENUM ('T1', 'T2', 'T3');
CREATE TYPE public.disposicao_categoria AS ENUM ('OK', 'Moderada', 'Comprometida');
CREATE TYPE public.autonomia_nivel AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.perfil_comportamental AS ENUM (
  'P01_empurrado_pela_dor',
  'P02_assustado_com_tempo',
  'P03_frustrado',
  'P04_estreante',
  'P05_sobrecarregado',
  'P06_deslocado'
);
CREATE TYPE public.rotina_tipo AS ENUM ('pre_trabalho', 'pos_trabalho', 'livre');
CREATE TYPE public.periodo_preferido AS ENUM ('manha', 'tarde', 'noite');
CREATE TYPE public.condicao_medica_flag AS ENUM (
  'CARDIACO', 'HIPERTENSAO', 'DIABETES', 'ASMA',
  'OSTEOPOROSE', 'HERNIA_DISCO', 'GESTANTE', 'POS_CIRURGICO', 'OUTRO'
);
CREATE TYPE public.alert_type_enum AS ENUM (
  'frequencia_zero',
  'frequencia_baixa',
  'dor_persistente',
  'sessao_sem_feedback',
  'revisao_nivel_I3',
  'alerta_medico',
  'condicao_cardiaca',
  'inconsistencia_checkin',
  'divergencia_conduta'
);
CREATE TYPE public.alert_severity_enum AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.alert_status_enum AS ENUM ('aberto', 'em_revisao', 'resolvido');
CREATE TYPE public.milestone_type_enum AS ENUM (
  'inicio',
  'revisao_I3',
  'encerra_bloco',
  'inicia_bloco',
  'checkpoint_jmp',
  'encerra_protocolo'
);
CREATE TYPE public.template_moment_enum AS ENUM (
  'pre_sessao', 'pos_sessao', 'marco', 'alerta', 'encerramento'
);

-- ============================================================================
-- ANAMNESIS — novas colunas
-- ============================================================================

ALTER TABLE public.anamnesis
  ADD COLUMN IF NOT EXISTS dor_cat public.dor_categoria,
  ADD COLUMN IF NOT EXISTS dor_local TEXT[],
  ADD COLUMN IF NOT EXISTS ins_cat public.inseguranca_categoria,
  ADD COLUMN IF NOT EXISTS autonomia public.autonomia_nivel,
  ADD COLUMN IF NOT EXISTS perfil_primario public.perfil_comportamental,
  ADD COLUMN IF NOT EXISTS motivacao_real TEXT,
  ADD COLUMN IF NOT EXISTS experiencia_previa BOOLEAN,
  ADD COLUMN IF NOT EXISTS abandono_previo BOOLEAN,
  ADD COLUMN IF NOT EXISTS rotina_tipo public.rotina_tipo,
  ADD COLUMN IF NOT EXISTS periodo_preferido public.periodo_preferido,
  ADD COLUMN IF NOT EXISTS compromisso INTEGER,
  ADD COLUMN IF NOT EXISTS frequencia_esperada INTEGER,
  ADD COLUMN IF NOT EXISTS alert_medical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS condicao public.condicao_medica_flag[],
  ADD COLUMN IF NOT EXISTS medicamento TEXT,
  ADD COLUMN IF NOT EXISTS user_vocab TEXT[];

-- ============================================================================
-- TABLE: daily_checkin_sessions (check-in v2 contextual + categórico)
-- ============================================================================

CREATE TABLE public.daily_checkin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  schedule_id UUID,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_checkin TIME NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::time,
  dia_util BOOLEAN NOT NULL DEFAULT true,
  contexto_pergunta TEXT,
  pergunta_exibida TEXT,
  transcription TEXT,
  -- Extração categórica feita pela IA
  tempo_cat public.tempo_categoria,
  dor_cat_dia public.dor_categoria,
  dor_local_dia TEXT[],
  disposicao public.disposicao_categoria,
  vocab_capturado TEXT[],
  ai_summary TEXT,
  ai_raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_sessions_client_date ON public.daily_checkin_sessions(client_id, checkin_date DESC);
CREATE INDEX idx_checkin_sessions_dor ON public.daily_checkin_sessions(client_id, dor_cat_dia) WHERE dor_cat_dia IS NOT NULL;

ALTER TABLE public.daily_checkin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes gerenciam próprios check-ins v2"
  ON public.daily_checkin_sessions FOR ALL
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Personals e admins veem check-ins de clientes"
  ON public.daily_checkin_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = daily_checkin_sessions.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================================
-- TABLE: protocol_milestones (marcos do protocolo)
-- ============================================================================

CREATE TABLE public.protocol_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_number INTEGER NOT NULL UNIQUE,
  milestone_type public.milestone_type_enum NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_video_codes TEXT[],
  client_message_template TEXT,
  jmp_action TEXT,
  triggers_alert BOOLEAN DEFAULT false,
  alert_type public.alert_type_enum,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados veem marcos"
  ON public.protocol_milestones FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Apenas admins gerenciam marcos"
  ON public.protocol_milestones FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- TABLE: agent_communication_templates
-- ============================================================================

CREATE TABLE public.agent_communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_primario public.perfil_comportamental,
  ins_cat public.inseguranca_categoria,
  moment public.template_moment_enum NOT NULL,
  tone TEXT,
  verbos_chave TEXT[],
  reforcar TEXT[],
  evitar TEXT[],
  template TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_lookup ON public.agent_communication_templates(perfil_primario, ins_cat, moment) WHERE active = true;

ALTER TABLE public.agent_communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem templates"
  ON public.agent_communication_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins gerenciam templates"
  ON public.agent_communication_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- TABLE: agent_videos (biblioteca de vídeos do protocolo)
-- ============================================================================

CREATE TABLE public.agent_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  duration_seconds INTEGER,
  mandatory_at_session INTEGER,
  recommended_for_ins_cat public.inseguranca_categoria,
  recommended_for_dor_cat public.dor_categoria,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem vídeos do agente"
  ON public.agent_videos FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins gerenciam vídeos do agente"
  ON public.agent_videos FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- TABLE: agent_alerts (alertas em tempo real para JMP)
-- ============================================================================

CREATE TABLE public.agent_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  alert_type public.alert_type_enum NOT NULL,
  severity public.alert_severity_enum NOT NULL DEFAULT 'media',
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  status public.alert_status_enum NOT NULL DEFAULT 'aberto',
  resolution_note TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_status ON public.agent_alerts(status, created_at DESC);
CREATE INDEX idx_alerts_client ON public.agent_alerts(client_id, created_at DESC);
CREATE INDEX idx_alerts_type_open ON public.agent_alerts(alert_type) WHERE status = 'aberto';

ALTER TABLE public.agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam alertas"
  ON public.agent_alerts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Personals veem alertas dos próprios clientes"
  ON public.agent_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = agent_alerts.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
  );

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_alerts;

-- ============================================================================
-- TABLE: client_exercise_first_use
-- ============================================================================

CREATE TABLE public.client_exercise_first_use (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  first_session_id UUID,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  video_shown BOOLEAN DEFAULT false,
  video_shown_at TIMESTAMPTZ,
  UNIQUE (client_id, exercise_id)
);

CREATE INDEX idx_first_use_client ON public.client_exercise_first_use(client_id);

ALTER TABLE public.client_exercise_first_use ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes veem próprio histórico de primeiro uso"
  ON public.client_exercise_first_use FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = client_exercise_first_use.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sistema insere primeiro uso"
  ON public.client_exercise_first_use FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Cliente atualiza próprio primeiro uso"
  ON public.client_exercise_first_use FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- TABLE: client_protocol_progress
-- ============================================================================

CREATE TABLE public.client_protocol_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  client_workout_id UUID,
  sessao_atual INTEGER NOT NULL DEFAULT 0,
  total_sessoes INTEGER NOT NULL DEFAULT 36,
  bloco_atual INTEGER NOT NULL DEFAULT 1,
  dor_consecutiva INTEGER NOT NULL DEFAULT 0,
  frequencia_semanal INTEGER NOT NULL DEFAULT 0,
  ultima_sessao_completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ativo',
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_progress_client ON public.client_protocol_progress(client_id);

ALTER TABLE public.client_protocol_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê próprio progresso"
  ON public.client_protocol_progress FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = client_protocol_progress.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Sistema gerencia progresso"
  ON public.client_protocol_progress FOR ALL
  TO authenticated
  USING (
    client_id = auth.uid()
    OR has_role(auth.uid(), 'personal'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    client_id = auth.uid()
    OR has_role(auth.uid(), 'personal'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- updated_at genérico (caso ainda não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON public.protocol_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.agent_communication_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_videos_updated BEFORE UPDATE ON public.agent_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_alerts_updated BEFORE UPDATE ON public.agent_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON public.client_protocol_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: atualiza dor_consecutiva ao inserir check-in v2
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_dor_consecutiva_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dor_anterior INTEGER;
  v_nova_dor INTEGER;
BEGIN
  IF NEW.dor_cat_dia IS NULL THEN
    RETURN NEW;
  END IF;

  -- pega dor consecutiva atual
  SELECT COALESCE(dor_consecutiva, 0) INTO v_dor_anterior
  FROM client_protocol_progress
  WHERE client_id = NEW.client_id;

  IF NEW.dor_cat_dia IN ('D2', 'D3') THEN
    v_nova_dor := COALESCE(v_dor_anterior, 0) + 1;
  ELSE
    v_nova_dor := 0;
  END IF;

  UPDATE client_protocol_progress
  SET dor_consecutiva = v_nova_dor,
      updated_at = now()
  WHERE client_id = NEW.client_id;

  -- Se dor persistente >= 3 → cria alerta
  IF v_nova_dor >= 3 THEN
    INSERT INTO agent_alerts (client_id, alert_type, severity, title, description, payload)
    VALUES (
      NEW.client_id,
      'dor_persistente',
      'alta',
      'Dor persistente detectada',
      format('Cliente reportou dor (D2/D3) em %s check-ins consecutivos.', v_nova_dor),
      jsonb_build_object('dor_consecutiva', v_nova_dor, 'ultima_dor_local', NEW.dor_local_dia)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkin_dor_consecutiva
AFTER INSERT ON public.daily_checkin_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_dor_consecutiva_and_alert();

-- ----------------------------------------------------------------------------
-- Trigger: atualiza frequência semanal ao completar sessão
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_frequencia_semanal_and_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Conta sessões completadas nos últimos 7 dias
    SELECT COUNT(*) INTO v_count
    FROM daily_workout_schedule
    WHERE client_id = NEW.client_id
      AND completed = true
      AND completed_at >= now() - interval '7 days';

    -- Atualiza progresso (cria se não existir)
    INSERT INTO client_protocol_progress (client_id, frequencia_semanal, ultima_sessao_completed_at, sessao_atual)
    VALUES (NEW.client_id, v_count, NEW.completed_at, 1)
    ON CONFLICT (client_id) DO UPDATE
    SET frequencia_semanal = v_count,
        ultima_sessao_completed_at = NEW.completed_at,
        sessao_atual = client_protocol_progress.sessao_atual + 1,
        updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_schedule_frequencia
AFTER UPDATE ON public.daily_workout_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_frequencia_semanal_and_alert();

-- ----------------------------------------------------------------------------
-- Trigger: cria alerta médico quando anamnese marca alert_medical
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_medical_alert_on_anamnesis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.alert_medical = true AND (OLD.alert_medical IS NULL OR OLD.alert_medical = false) THEN
    INSERT INTO agent_alerts (client_id, alert_type, severity, title, description, payload)
    VALUES (
      NEW.client_id,
      CASE WHEN 'CARDIACO' = ANY(NEW.condicao) THEN 'condicao_cardiaca'::alert_type_enum
           ELSE 'alerta_medico'::alert_type_enum END,
      'critica',
      'Alerta médico antes da Sessão 1',
      'Cliente sinalizou condição médica que requer revisão JMP antes de iniciar o protocolo.',
      jsonb_build_object('condicoes', NEW.condicao, 'medicamento', NEW.medicamento, 'restricoes', NEW.medical_restrictions)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_anamnesis_medical_alert
AFTER INSERT OR UPDATE ON public.anamnesis
FOR EACH ROW EXECUTE FUNCTION public.create_medical_alert_on_anamnesis();
