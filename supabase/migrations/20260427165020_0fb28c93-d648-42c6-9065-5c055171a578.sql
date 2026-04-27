
-- ============================================================
-- FASE 1.1 — ENUMS NOVOS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.exercise_kind_enum AS ENUM ('PAI', 'SUB');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pain_region_enum AS ENUM ('L0', 'L1', 'L2', 'L3', 'L_MULTI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.treino_letra_enum AS ENUM ('A', 'B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.nivel_experiencia_enum AS ENUM ('iniciante', 'intermediario', 'avancado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.autonomia_enum AS ENUM ('A1', 'A2', 'A3');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.session_status_enum AS ENUM ('CONCLUIDA', 'AUTO_CONCLUIDA', 'PARCIAL', 'AUSENTE', 'PRESUMIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.perception_signal_enum AS ENUM ('ESPONTANEO_LEVE', 'RANDOMICO_LEVE', 'RANDOMICO_NORMAL', 'RANDOMICO_PESADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estender alert_type_enum
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'gatilho_potencial';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'pesado_recorrente';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'dor_nova';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'dor_escalada';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'ausencia';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.alert_type_enum ADD VALUE IF NOT EXISTS 'nao_concluiu';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- FASE 1.2 — Estender tabela `exercises`
-- ============================================================

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS kind public.exercise_kind_enum,
  ADD COLUMN IF NOT EXISTS parent_exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pain_region public.pain_region_enum,
  ADD COLUMN IF NOT EXISTS treino_letra public.treino_letra_enum,
  ADD COLUMN IF NOT EXISTS bloco_protocolo integer,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fixed_base boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_exercises_protocol_lookup
  ON public.exercises (protocol_only, bloco_protocolo, treino_letra, kind, pain_region)
  WHERE protocol_only = true;

CREATE INDEX IF NOT EXISTS idx_exercises_parent
  ON public.exercises (parent_exercise_id) WHERE parent_exercise_id IS NOT NULL;

-- ============================================================
-- FASE 1.3 — Estender `anamnesis`
-- ============================================================

ALTER TABLE public.anamnesis
  ADD COLUMN IF NOT EXISTS autonomia public.autonomia_enum,
  ADD COLUMN IF NOT EXISTS flag_frustrado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS multi_dor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nivel_experiencia_norm public.nivel_experiencia_enum;

-- Trigger para normalizar nivel_experiencia (texto → enum)
CREATE OR REPLACE FUNCTION public.normalize_nivel_experiencia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
BEGIN
  v_text := lower(coalesce(NEW.nivel_experiencia, ''));
  IF v_text LIKE '%avan%' OR v_text LIKE '%expert%' THEN
    NEW.nivel_experiencia_norm := 'avancado';
  ELSIF v_text LIKE '%inter%' OR v_text LIKE '%medio%' OR v_text LIKE '%médio%' THEN
    NEW.nivel_experiencia_norm := 'intermediario';
  ELSE
    NEW.nivel_experiencia_norm := 'iniciante';
  END IF;
  -- multi_dor: array de dor_local com mais de 1 item
  IF NEW.dor_local IS NOT NULL AND array_length(NEW.dor_local, 1) > 1 THEN
    NEW.multi_dor := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_nivel_experiencia ON public.anamnesis;
CREATE TRIGGER trg_normalize_nivel_experiencia
  BEFORE INSERT OR UPDATE OF nivel_experiencia, dor_local
  ON public.anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_nivel_experiencia();

-- Backfill para registros existentes
UPDATE public.anamnesis
SET nivel_experiencia_norm = CASE
  WHEN lower(coalesce(nivel_experiencia,'')) LIKE '%avan%' THEN 'avancado'::nivel_experiencia_enum
  WHEN lower(coalesce(nivel_experiencia,'')) LIKE '%inter%' OR lower(coalesce(nivel_experiencia,'')) LIKE '%medio%' OR lower(coalesce(nivel_experiencia,'')) LIKE '%médio%' THEN 'intermediario'::nivel_experiencia_enum
  ELSE 'iniciante'::nivel_experiencia_enum
END
WHERE nivel_experiencia_norm IS NULL;

-- ============================================================
-- FASE 1.4 — Estender `daily_workout_schedule`
-- ============================================================

ALTER TABLE public.daily_workout_schedule
  ADD COLUMN IF NOT EXISTS session_status public.session_status_enum NOT NULL DEFAULT 'CONCLUIDA';

-- ============================================================
-- FASE 1.5 — Tabela `volume_outputs` (matriz JMP 30 combinações)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.volume_outputs (
  output_id text PRIMARY KEY,
  tempo_cat public.tempo_categoria NOT NULL,
  dor_cat public.dor_categoria NOT NULL,
  disposicao public.disposicao_categoria,
  modo_d3 boolean NOT NULL DEFAULT false,
  n_ex_min integer NOT NULL,
  n_ex_max integer NOT NULL,
  series_min integer NOT NULL,
  series_max integer NOT NULL,
  reps integer NOT NULL DEFAULT 12,
  mob_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  fort_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  resist_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  along_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT volume_outputs_unique_key UNIQUE (tempo_cat, dor_cat, disposicao)
);

ALTER TABLE public.volume_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem volume_outputs"
  ON public.volume_outputs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam volume_outputs"
  ON public.volume_outputs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_volume_outputs_updated_at
  BEFORE UPDATE ON public.volume_outputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FASE 2.1 — `client_exercise_load_history`
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_exercise_load_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  current_load_kg numeric NOT NULL DEFAULT 0,
  previous_load_kg numeric,
  last_progression_at timestamptz,
  progression_count integer NOT NULL DEFAULT 0,
  decided_by uuid, -- quem aprovou o aumento (JMP)
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, exercise_id)
);

ALTER TABLE public.client_exercise_load_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente vê própria carga"
  ON public.client_exercise_load_history FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = client_exercise_load_history.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Treinadores e admins gerenciam carga"
  ON public.client_exercise_load_history FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'personal'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'personal'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER trg_load_history_updated_at
  BEFORE UPDATE ON public.client_exercise_load_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- FASE 2.2 — `session_perception_signals`
-- ============================================================

CREATE TABLE IF NOT EXISTS public.session_perception_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  schedule_id uuid REFERENCES public.daily_workout_schedule(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  signal_type public.perception_signal_enum NOT NULL,
  sessao_num integer,
  load_at_signal numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perception_client_exercise
  ON public.session_perception_signals (client_id, exercise_id, created_at DESC);

ALTER TABLE public.session_perception_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cliente registra próprios sinais"
  ON public.session_perception_signals FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Cliente e treinador veem sinais"
  ON public.session_perception_signals FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = session_perception_signals.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger: 2 sinais LEVE consecutivos → alerta gatilho_potencial
CREATE OR REPLACE FUNCTION public.check_gatilho_potencial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_exercise_name text;
  v_current_load numeric;
BEGIN
  IF NEW.signal_type NOT IN ('ESPONTANEO_LEVE', 'RANDOMICO_LEVE') THEN
    RETURN NEW;
  END IF;

  -- Conta sinais LEVE consecutivos no mesmo exercício, do mais recente até interromper
  WITH ordered AS (
    SELECT signal_type, created_at,
      row_number() OVER (ORDER BY created_at DESC) AS rn
    FROM session_perception_signals
    WHERE client_id = NEW.client_id AND exercise_id = NEW.exercise_id
  )
  SELECT count(*) INTO v_count
  FROM ordered
  WHERE rn <= 2 AND signal_type IN ('ESPONTANEO_LEVE', 'RANDOMICO_LEVE');

  IF v_count >= 2 THEN
    SELECT name INTO v_exercise_name FROM exercises WHERE id = NEW.exercise_id;
    SELECT current_load_kg INTO v_current_load
      FROM client_exercise_load_history
      WHERE client_id = NEW.client_id AND exercise_id = NEW.exercise_id;

    INSERT INTO agent_alerts (client_id, alert_type, severity, title, description, payload)
    VALUES (
      NEW.client_id,
      'gatilho_potencial'::alert_type_enum,
      'media'::alert_severity_enum,
      'Gatilho de progressão potencial',
      format('Cliente reportou "Ficou leve" 2x consecutivos em %s. Avaliar aumento de carga.', coalesce(v_exercise_name, 'exercício')),
      jsonb_build_object(
        'exercise_id', NEW.exercise_id,
        'exercise_name', v_exercise_name,
        'current_load_kg', v_current_load,
        'sessao_num', NEW.sessao_num
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_gatilho_potencial ON public.session_perception_signals;
CREATE TRIGGER trg_check_gatilho_potencial
  AFTER INSERT ON public.session_perception_signals
  FOR EACH ROW EXECUTE FUNCTION public.check_gatilho_potencial();

-- ============================================================
-- FASE 2.3 — `random_check_schedule`
-- ============================================================

CREATE TABLE IF NOT EXISTS public.random_check_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_num integer NOT NULL UNIQUE,
  treino_letra public.treino_letra_enum NOT NULL,
  primary_exercise_slot text NOT NULL, -- 'SUPINO_MAQUINA', 'REMADA_MAQUINA', 'LEG_PRESS', 'CADEIRA_EXTENSORA', 'CADEIRA_FLEXORA'
  fase integer NOT NULL,
  posicao_descricao text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.random_check_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados leem random_check_schedule"
  ON public.random_check_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam random_check_schedule"
  ON public.random_check_schedule FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- SEED — calendário de randômicos (doc Feedback & Progressão pp. 4–5)
-- ============================================================

INSERT INTO public.random_check_schedule (sessao_num, treino_letra, primary_exercise_slot, fase, posicao_descricao) VALUES
  (3,  'A', 'SUPINO_MAQUINA',     1, 'Pré-entrada do intervalo (F1→F2)'),
  (5,  'B', 'LEG_PRESS',          2, 'Início da calibração'),
  (7,  'A', 'REMADA_MAQUINA',     2, 'Meio da calibração'),
  (9,  'B', 'CADEIRA_EXTENSORA',  2, 'Meio da calibração'),
  (11, 'A', 'SUPINO_MAQUINA',     2, 'Pré-ativação do gatilho (F2→F3)'),
  (13, 'B', 'LEG_PRESS',          3, 'Início da progressão'),
  (17, 'A', 'REMADA_MAQUINA',     3, 'Meio da progressão'),
  (21, 'B', 'CADEIRA_FLEXORA',    3, 'Meio da progressão'),
  (23, 'A', 'SUPINO_MAQUINA',     3, 'Pré-consolidação (F3→F4)'),
  (27, 'B', 'LEG_PRESS',          4, 'Início da consolidação'),
  (31, 'A', 'REMADA_MAQUINA',     4, 'Meio da consolidação'),
  (35, 'B', 'LEG_PRESS',          4, 'Pré-encerramento do protocolo')
ON CONFLICT (sessao_num) DO UPDATE SET
  treino_letra = EXCLUDED.treino_letra,
  primary_exercise_slot = EXCLUDED.primary_exercise_slot,
  fase = EXCLUDED.fase,
  posicao_descricao = EXCLUDED.posicao_descricao;

-- ============================================================
-- SEED — volume_outputs (30 combinações OUT-001..OUT-030)
-- conforme doc "Outputs da Triagem v2 — 30 Combinações"
-- ============================================================

-- T1 — 30–40 min — N_Ex 3–5
INSERT INTO public.volume_outputs (output_id, tempo_cat, dor_cat, disposicao, modo_d3, n_ex_min, n_ex_max, series_min, series_max, reps, mob_rule, fort_rule, resist_rule, along_rule) VALUES
('OUT-001','T1','D0','OK',          false, 3,5, 3,4, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":0,"dor_qty":0}'),
('OUT-002','T1','D0','Moderada',    false, 3,5, 2,3, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":0,"dor_qty":0}'),
('OUT-003','T1','D0','Comprometida',false, 3,3, 2,3, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":1,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":0,"dor_qty":0}'),
('OUT-004','T1','D1','OK',          false, 3,5, 3,4, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":1,"dor_qty":1}'),
('OUT-005','T1','D1','Moderada',    false, 3,5, 2,3, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":1,"dor_qty":1}'),
('OUT-006','T1','D1','Comprometida',false, 3,3, 2,3, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":1,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":1,"dor_qty":1}'),
('OUT-007','T1','D2','OK',          false, 3,5, 3,4, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":1,"dor_qty":2}'),
('OUT-008','T1','D2','Moderada',    false, 3,5, 2,3, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":1,"dor_qty":2}'),
('OUT-009','T1','D2','Comprometida',false, 3,3, 2,3, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":1,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":1,"dor_qty":2}'),
('OUT-010','T1','D3', NULL,         true,  3,5, 2,3, 12, '{"base_fixos":3,"local_qty":3}','{"iniciante_fixos":3,"local_qty":3}','{"strategy":"REMOVE_LOCAL","remove_pai_local":true,"remove_sub_local":true}','{"musculatura_treinada":0,"dor_qty":3}'),
-- T2 — 40–50 min — N_Ex 4–6
('OUT-011','T2','D0','OK',          false, 4,6, 3,4, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":2,"dor_qty":0}'),
('OUT-012','T2','D0','Moderada',    false, 4,6, 2,3, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":2,"dor_qty":0}'),
('OUT-013','T2','D0','Comprometida',false, 4,4, 2,3, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":2,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":2,"dor_qty":0}'),
('OUT-014','T2','D1','OK',          false, 4,6, 3,4, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":2,"dor_qty":1}'),
('OUT-015','T2','D1','Moderada',    false, 4,6, 2,3, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":2,"dor_qty":1}'),
('OUT-016','T2','D1','Comprometida',false, 4,4, 2,3, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":2,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":2,"dor_qty":1}'),
('OUT-017','T2','D2','OK',          false, 4,6, 3,4, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":2,"dor_qty":2}'),
('OUT-018','T2','D2','Moderada',    false, 4,6, 2,3, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":2,"dor_qty":2}'),
('OUT-019','T2','D2','Comprometida',false, 4,4, 2,3, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":2,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":1,"dor_qty":2}'),
('OUT-020','T2','D3', NULL,         true,  4,6, 2,3, 12, '{"base_fixos":3,"local_qty":3}','{"iniciante_fixos":3,"local_qty":3}','{"strategy":"REMOVE_LOCAL","remove_pai_local":true,"remove_sub_local":true}','{"musculatura_treinada":1,"dor_qty":3}'),
-- T3 — 50–60 min — N_Ex 6–8
('OUT-021','T3','D0','OK',          false, 6,8, 4,6, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":3,"dor_qty":0}'),
('OUT-022','T3','D0','Moderada',    false, 6,6, 3,4, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":3,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":3,"dor_qty":0}'),
('OUT-023','T3','D0','Comprometida',false, 6,6, 2,3, 12, '{"base_fixos":3,"local_qty":0}','{"iniciante_fixos":2,"local_qty":0}','{"strategy":"PAI","remove_local":false}','{"musculatura_treinada":2,"dor_qty":0}'),
('OUT-024','T3','D1','OK',          false, 6,8, 4,6, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":3,"dor_qty":1}'),
('OUT-025','T3','D1','Moderada',    false, 6,8, 3,4, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":3,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":3,"dor_qty":1}'),
('OUT-026','T3','D1','Comprometida',false, 6,6, 2,3, 12, '{"base_fixos":3,"local_qty":1}','{"iniciante_fixos":2,"local_qty":1}','{"strategy":"SUB_PRIORITY","remove_local":false}','{"musculatura_treinada":3,"dor_qty":1}'),
('OUT-027','T3','D2','OK',          false, 4,6, 3,4, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":3,"dor_qty":2}'),
('OUT-028','T3','D2','Moderada',    false, 4,6, 2,3, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":3,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":3,"dor_qty":2}'),
('OUT-029','T3','D2','Comprometida',false, 4,4, 2,2, 12, '{"base_fixos":3,"local_qty":2}','{"iniciante_fixos":2,"local_qty":2}','{"strategy":"SUB_MANDATORY","remove_pai_local":true}','{"musculatura_treinada":2,"dor_qty":2}'),
('OUT-030','T3','D3', NULL,         true,  6,8, 3,4, 12, '{"base_fixos":3,"local_qty":3}','{"iniciante_fixos":3,"local_qty":3}','{"strategy":"REMOVE_LOCAL","remove_pai_local":true,"remove_sub_local":true}','{"musculatura_treinada":2,"dor_qty":3}')
ON CONFLICT (output_id) DO UPDATE SET
  n_ex_min=EXCLUDED.n_ex_min, n_ex_max=EXCLUDED.n_ex_max,
  series_min=EXCLUDED.series_min, series_max=EXCLUDED.series_max,
  mob_rule=EXCLUDED.mob_rule, fort_rule=EXCLUDED.fort_rule,
  resist_rule=EXCLUDED.resist_rule, along_rule=EXCLUDED.along_rule,
  modo_d3=EXCLUDED.modo_d3, updated_at=now();
