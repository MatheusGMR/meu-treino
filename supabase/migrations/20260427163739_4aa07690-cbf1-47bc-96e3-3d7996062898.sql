-- ===== Fase 1: Enums e colunas novas em agent_videos =====

CREATE TYPE public.pilar_video_enum AS ENUM (
  'mobilidade', 'fortalecimento', 'resistido', 'alongamento', 'encerramento',
  'dor', 'modo_seguro', 'intro', 'progressao', 'fim'
);

CREATE TYPE public.momento_video_enum AS ENUM (
  'abertura', 'antes_bloco', 'antes_exercicio', 'intervalo', 'pos_sessao', 'sessao_inteira'
);

ALTER TABLE public.agent_videos
  ADD COLUMN pilar public.pilar_video_enum,
  ADD COLUMN momento public.momento_video_enum,
  ADD COLUMN obrigatorio boolean NOT NULL DEFAULT false,
  ADD COLUMN gatilho text,
  ADD COLUMN sessoes_alvo integer[],
  ADD COLUMN bloco_alvo integer CHECK (bloco_alvo IS NULL OR bloco_alvo IN (1,2,3)),
  ADD COLUMN exercise_id uuid REFERENCES public.exercises(id) ON DELETE SET NULL,
  ADD COLUMN ordem_sequencia integer NOT NULL DEFAULT 0;

CREATE INDEX idx_agent_videos_pilar_inscat_momento
  ON public.agent_videos (pilar, recommended_for_ins_cat, momento)
  WHERE active = true;

CREATE INDEX idx_agent_videos_exercise ON public.agent_videos (exercise_id)
  WHERE exercise_id IS NOT NULL;

-- ===== Atualizar os 7 vídeos já existentes com os novos metadados =====

UPDATE public.agent_videos SET pilar='intro', momento='abertura', obrigatorio=true,
  sessoes_alvo='{1}', gatilho='Sessão 1 — todos os clientes, abertura'
  WHERE video_code = 'VID-INTRO-01';

UPDATE public.agent_videos SET pilar='intro', momento='abertura', obrigatorio=true,
  sessoes_alvo='{1}', ordem_sequencia=1, gatilho='Sessão 1 — todos os clientes, após VID-INTRO-01'
  WHERE video_code = 'VID-INTRO-02';

UPDATE public.agent_videos SET pilar='progressao', momento='abertura', obrigatorio=true,
  sessoes_alvo='{13}', bloco_alvo=2, gatilho='Sessão 13 — abertura do Bloco 2'
  WHERE video_code = 'VID-PROG-B2';

UPDATE public.agent_videos SET pilar='progressao', momento='abertura', obrigatorio=true,
  sessoes_alvo='{25}', bloco_alvo=3, gatilho='Sessão 25 — abertura do Bloco 3'
  WHERE video_code = 'VID-PROG-B3';

UPDATE public.agent_videos SET pilar='fim', momento='abertura', obrigatorio=true,
  sessoes_alvo='{36}', gatilho='Sessão 36 — encerramento do protocolo'
  WHERE video_code = 'VID-FIM-01';

UPDATE public.agent_videos SET pilar='dor', momento='abertura', obrigatorio=true,
  gatilho='Dor D2 reportada no check-in — abertura da sessão'
  WHERE video_code = 'VID-DOR-01';

UPDATE public.agent_videos SET pilar='encerramento', momento='pos_sessao', obrigatorio=true,
  gatilho='I3 — toda sessão até a 6 e nas marcadoras 12/18/24'
  WHERE video_code = 'VID-ENC-I3-03';

-- ===== Seed: ~50 vídeos skeleton (sem URL) =====

INSERT INTO public.agent_videos
  (video_code, title, description, pilar, momento, recommended_for_ins_cat, recommended_for_dor_cat, obrigatorio, gatilho, sessoes_alvo, bloco_alvo, ordem_sequencia, active)
VALUES
-- ========== I1 (5 vídeos base) ==========
('VID-MOB-I1-01', 'Mobilidade — Visão geral I1', 'Por que aquecer e como respirar durante a mobilidade.', 'mobilidade', 'antes_bloco', 'I1', NULL, false, 'I1 — antes do bloco de mobilidade', NULL, NULL, 0, true),
('VID-FORT-I1-01', 'Fortalecimento — Visão geral I1', 'Como executar exercícios de força sem máquina.', 'fortalecimento', 'antes_bloco', 'I1', NULL, false, 'I1 — antes do bloco de fortalecimento', NULL, NULL, 0, true),
('VID-RES-I1-01', 'Resistido — Visão geral I1', 'Como abordar a área de musculação com confiança.', 'resistido', 'antes_bloco', 'I1', NULL, false, 'I1 — antes do bloco resistido', NULL, NULL, 0, true),
('VID-ALONG-I1-01', 'Alongamento — Visão geral I1', 'Por que alongar e como respirar.', 'alongamento', 'antes_bloco', 'I1', NULL, false, 'I1 — antes do bloco de alongamento', NULL, NULL, 0, true),
('VID-ENC-I1-01', 'Encerramento I1 — Bom trabalho', 'Mensagem curta de fechamento.', 'encerramento', 'pos_sessao', 'I1', NULL, false, 'I1 — opcional ao final da sessão', NULL, NULL, 0, true),

-- ========== I2 (12 vídeos) ==========
('VID-MOB-I2-01', 'Mobilidade I2 — Como começar devagar', 'Reduza a amplitude se sentir desconforto.', 'mobilidade', 'antes_bloco', 'I2', NULL, false, 'I2 — antes do bloco de mobilidade', NULL, NULL, 0, true),
('VID-MOB-I2-02', 'Mobilidade I2 — Respiração consciente', 'Respiração diafragmática durante a mobilidade.', 'mobilidade', 'intervalo', 'I2', NULL, false, 'I2 — intervalo entre exercícios de mobilidade', NULL, NULL, 0, true),
('VID-FORT-I2-01', 'Fortalecimento I2 — Postura básica', 'Postura neutra, joelhos e core.', 'fortalecimento', 'antes_bloco', 'I2', NULL, false, 'I2 — antes do bloco de fortalecimento', NULL, NULL, 0, true),
('VID-FORT-I2-02', 'Fortalecimento I2 — Quando parar', 'Sinais de fadiga vs sinais de alerta.', 'fortalecimento', 'antes_exercicio', 'I2', NULL, false, 'I2 — antes do primeiro exercício de fortalecimento', NULL, NULL, 0, true),
('VID-RES-I2-01', 'Resistido I2 — Setup de máquina', 'Como ajustar banco, pinos e respiração.', 'resistido', 'antes_exercicio', 'I2', NULL, false, 'I2 — primeira vez do exercício resistido', NULL, NULL, 0, true),
('VID-RES-I2-02', 'Resistido I2 — Carga progressiva', 'Como subir carga com segurança.', 'resistido', 'antes_bloco', 'I2', NULL, false, 'I2 — antes do bloco resistido', NULL, NULL, 0, true),
('VID-RES-I2-03', 'Resistido I2 — Pausa entre séries', 'Use a pausa para respirar e recuperar.', 'resistido', 'intervalo', 'I2', NULL, false, 'I2 — intervalo entre séries', NULL, NULL, 0, true),
('VID-ALONG-I2-01', 'Alongamento I2 — Não force', 'Vá até a tensão, não até a dor.', 'alongamento', 'antes_bloco', 'I2', NULL, false, 'I2 — antes do bloco de alongamento', NULL, NULL, 0, true),
('VID-ALONG-I2-02', 'Alongamento I2 — Pós-treino', 'Como fechar a sessão alongando.', 'alongamento', 'pos_sessao', 'I2', NULL, false, 'I2 — após a sessão', NULL, NULL, 0, true),
('VID-ENC-I2-01', 'Encerramento I2 — Boa sessão', 'Reforço positivo curto.', 'encerramento', 'pos_sessao', 'I2', NULL, false, 'I2 — opcional ao final', NULL, NULL, 0, true),
('VID-ENC-I2-02', 'Encerramento I2 — Marco do bloco', 'Mensagem ao terminar um bloco.', 'encerramento', 'pos_sessao', 'I2', NULL, false, 'I2 — sessões 12, 24', '{12,24}', NULL, 0, true),
('VID-ENC-I2-03', 'Encerramento I2 — Hidratação', 'Lembrete de hidratação pós-treino.', 'encerramento', 'pos_sessao', 'I2', NULL, false, 'I2 — opcional', NULL, NULL, 0, true),

-- ========== I3 (15 vídeos com mais reforço positivo) ==========
('VID-MOB-I3-01', 'Mobilidade I3 — Você está no lugar certo', 'Mensagem de acolhimento antes de mobilizar.', 'mobilidade', 'abertura', 'I3', NULL, true, 'I3 — toda sessão até a 6, abertura do bloco', NULL, NULL, 0, true),
('VID-MOB-I3-02', 'Mobilidade I3 — Vá no seu ritmo', 'Permissão para reduzir amplitude e velocidade.', 'mobilidade', 'antes_bloco', 'I3', NULL, false, 'I3 — antes do bloco de mobilidade', NULL, NULL, 0, true),
('VID-MOB-I3-03', 'Mobilidade I3 — Respire fundo', 'Respiração para acalmar antes de começar.', 'mobilidade', 'intervalo', 'I3', NULL, false, 'I3 — intervalo entre exercícios', NULL, NULL, 0, true),
('VID-FORT-I3-01', 'Fortalecimento I3 — Comece pequeno', 'Reforço de que pouco já é muito.', 'fortalecimento', 'antes_bloco', 'I3', NULL, true, 'I3 — antes do bloco até sessão 6', NULL, NULL, 0, true),
('VID-FORT-I3-02', 'Fortalecimento I3 — Sem comparação', 'Não compare seu treino com o dos outros.', 'fortalecimento', 'antes_exercicio', 'I3', NULL, false, 'I3 — antes do primeiro exercício', NULL, NULL, 0, true),
('VID-FORT-I3-03', 'Fortalecimento I3 — Pode pausar', 'Pode pausar quando precisar, sem culpa.', 'fortalecimento', 'intervalo', 'I3', NULL, false, 'I3 — intervalo', NULL, NULL, 0, true),
('VID-RES-I3-01', 'Resistido I3 — Setup completo', 'Setup detalhado e devagar do equipamento.', 'resistido', 'antes_exercicio', 'I3', NULL, true, 'I3 — primeira vez do exercício resistido (obrigatório)', NULL, NULL, 0, true),
('VID-RES-I3-02', 'Resistido I3 — Ninguém está olhando', 'Acolhimento sobre vergonha na sala de musculação.', 'resistido', 'antes_bloco', 'I3', NULL, true, 'I3 — antes do bloco resistido até sessão 6', NULL, NULL, 0, true),
('VID-RES-I3-03', 'Resistido I3 — Carga inicial', 'Comece com a menor carga e suba aos poucos.', 'resistido', 'antes_exercicio', 'I3', NULL, false, 'I3 — antes do exercício', NULL, NULL, 0, true),
('VID-ALONG-I3-01', 'Alongamento I3 — Sinta o corpo', 'Conexão corpo-mente no alongamento.', 'alongamento', 'antes_bloco', 'I3', NULL, false, 'I3 — antes do bloco', NULL, NULL, 0, true),
('VID-ALONG-I3-02', 'Alongamento I3 — Fim da sessão', 'Fechamento gentil da sessão.', 'alongamento', 'pos_sessao', 'I3', NULL, false, 'I3 — após a sessão', NULL, NULL, 0, true),
('VID-ENC-I3-01', 'Encerramento I3 — Você fez', 'Reforço positivo forte ao terminar.', 'encerramento', 'pos_sessao', 'I3', NULL, true, 'I3 — toda sessão até a 6', NULL, NULL, 0, true),
('VID-ENC-I3-02', 'Encerramento I3 — Marco', 'Mensagem nas sessões 6/12/18/24.', 'encerramento', 'pos_sessao', 'I3', NULL, true, 'I3 — sessões 6, 12, 18, 24', '{6,12,18,24}', NULL, 0, true),
('VID-ENC-I3-04', 'Encerramento I3 — Próxima sessão', 'Convite gentil para a próxima sessão.', 'encerramento', 'pos_sessao', 'I3', NULL, false, 'I3 — opcional', NULL, NULL, 0, true),
('VID-ENC-I3-05', 'Encerramento I3 — Reconhecimento', 'Reconhecimento da coragem de continuar.', 'encerramento', 'pos_sessao', 'I3', NULL, false, 'I3 — opcional', NULL, NULL, 0, true),

-- ========== Condição: DOR (D1, D2, D3) ==========
('VID-DOR-D1-01', 'Dor D1 — Desconforto leve', 'Como diferenciar desconforto e dor.', 'dor', 'abertura', NULL, 'D1', false, 'Check-in com D1 — opcional na abertura', NULL, NULL, 0, true),
('VID-DOR-D2-01', 'Dor D2 — Reduza intensidade', 'Cliente reportou D2: intensidade reduzida 30%.', 'dor', 'abertura', NULL, 'D2', true, 'Check-in com D2 (sem modo seguro) — abertura', NULL, NULL, 0, true),
('VID-DOR-D2-02', 'Dor D2 — Foco em mobilidade', 'Sessão prioriza mobilidade.', 'dor', 'antes_bloco', NULL, 'D2', false, 'D2 — antes do bloco', NULL, NULL, 0, true),
('VID-DOR-D3-01', 'Dor D3 — Suspendendo grupos doloridos', 'Explica por que vamos suspender o grupo afetado.', 'dor', 'abertura', NULL, 'D3', true, 'Check-in com D3 — abertura, sequência 1/3', NULL, NULL, 1, true),
('VID-DOR-D3-02', 'Dor D3 — Sessão adaptada', 'Como será a sessão adaptada de hoje.', 'dor', 'abertura', NULL, 'D3', true, 'Check-in com D3 — abertura, sequência 2/3', NULL, NULL, 2, true),
('VID-DOR-D3-03', 'Dor D3 — Quando procurar ajuda', 'Sinais que indicam buscar avaliação médica.', 'dor', 'pos_sessao', NULL, 'D3', false, 'D3 — pós-sessão', NULL, NULL, 0, true),

-- ========== Modo Seguro ==========
('VID-MS-01', 'Modo Seguro ativado', 'O que é o modo seguro e por que estamos nele.', 'modo_seguro', 'abertura', NULL, NULL, true, 'Modo seguro ativo — abertura, sequência 3/3', NULL, NULL, 3, true),
('VID-MS-02', 'Modo Seguro — Como sair', 'Como o cliente sai do modo seguro com segurança.', 'modo_seguro', 'abertura', NULL, NULL, false, 'Modo seguro ativo — opcional', NULL, NULL, 0, true);

-- ===== Fase 2: RPC do motor de regras =====

CREATE OR REPLACE FUNCTION public.get_videos_for_session_moment(
  _client_id uuid,
  _sessao_num integer,
  _momento public.momento_video_enum,
  _exercise_id uuid DEFAULT NULL,
  _bloco_atual integer DEFAULT NULL
)
RETURNS TABLE (
  video_id uuid,
  video_code text,
  title text,
  description text,
  youtube_url text,
  pilar public.pilar_video_enum,
  obrigatorio boolean,
  ordem integer,
  motivo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ins_cat public.inseguranca_categoria;
  v_dor_cat public.dor_categoria;
  v_modo_seguro boolean := false;
  v_first_use boolean := false;
BEGIN
  -- Carrega ins_cat fixa do cliente
  SELECT a.ins_cat INTO v_ins_cat
  FROM anamnesis a WHERE a.client_id = _client_id ORDER BY a.completed_at DESC NULLS LAST LIMIT 1;

  -- Carrega dor mais recente (último check-in do dia)
  SELECT c.dor_cat_dia INTO v_dor_cat
  FROM daily_checkin_sessions c
  WHERE c.client_id = _client_id AND c.checkin_date = CURRENT_DATE
  ORDER BY c.created_at DESC LIMIT 1;

  -- Modo seguro: dor_consecutiva >= 3 vira modo seguro
  SELECT COALESCE(p.dor_consecutiva, 0) >= 3 INTO v_modo_seguro
  FROM client_protocol_progress p WHERE p.client_id = _client_id;

  -- Primeira vez do exercício?
  IF _exercise_id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM client_exercise_first_use f
      WHERE f.client_id = _client_id AND f.exercise_id = _exercise_id AND f.video_shown = true
    ) INTO v_first_use;
  END IF;

  -- 1. Marcos obrigatórios por sessão (intro/progressão/fim)
  RETURN QUERY
  SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
         true AS obrigatorio, v.ordem_sequencia AS ordem,
         'marco_sessao_' || _sessao_num::text AS motivo
  FROM agent_videos v
  WHERE v.active = true
    AND v.momento = _momento
    AND v.sessoes_alvo IS NOT NULL
    AND _sessao_num = ANY(v.sessoes_alvo)
    AND v.pilar IN ('intro','progressao','fim');

  -- 2. Modo seguro ativo (sequência fixa D3 + MS)
  IF v_modo_seguro AND _momento = 'abertura' THEN
    RETURN QUERY
    SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
           true, v.ordem_sequencia, 'modo_seguro_ativo'::text
    FROM agent_videos v
    WHERE v.active = true
      AND v.video_code IN ('VID-DOR-D3-01','VID-DOR-D3-02','VID-MS-01')
    ORDER BY v.ordem_sequencia;
  -- 3. Dor (sem modo seguro): D2 ou D3 normal
  ELSIF v_dor_cat IN ('D2','D3') AND _momento = 'abertura' THEN
    RETURN QUERY
    SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
           v.obrigatorio, v.ordem_sequencia,
           ('dor_' || v_dor_cat::text)::text
    FROM agent_videos v
    WHERE v.active = true
      AND v.pilar = 'dor'
      AND v.recommended_for_dor_cat = v_dor_cat
      AND v.momento = _momento;
  END IF;

  -- 4. ENC-I3 obrigatório: I3 nas sessões 1-6 e marcadoras 12/18/24
  IF v_ins_cat = 'I3' AND _momento = 'pos_sessao'
     AND (_sessao_num <= 6 OR _sessao_num IN (12,18,24)) THEN
    RETURN QUERY
    SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
           true, v.ordem_sequencia, 'enc_i3_obrigatorio'::text
    FROM agent_videos v
    WHERE v.active = true
      AND v.pilar = 'encerramento'
      AND v.recommended_for_ins_cat = 'I3'
      AND v.obrigatorio = true
      AND (v.sessoes_alvo IS NULL OR _sessao_num = ANY(v.sessoes_alvo));
  END IF;

  -- 5. Primeira vez do exercício resistido
  IF v_first_use AND _exercise_id IS NOT NULL AND _momento = 'antes_exercicio' THEN
    RETURN QUERY
    SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
           (v_ins_cat = 'I3') AS obrigatorio,
           v.ordem_sequencia, 'primeira_vez_exercicio'::text
    FROM agent_videos v
    WHERE v.active = true
      AND v.pilar = 'resistido'
      AND v.momento = 'antes_exercicio'
      AND v.recommended_for_ins_cat = v_ins_cat
    LIMIT 1;
  END IF;

  -- 6. Vídeos opcionais do (pilar implícito, ins_cat, momento, bloco)
  RETURN QUERY
  SELECT v.id, v.video_code, v.title, v.description, v.youtube_url, v.pilar,
         v.obrigatorio, v.ordem_sequencia, 'opcional_nivel'::text
  FROM agent_videos v
  WHERE v.active = true
    AND v.momento = _momento
    AND v.recommended_for_ins_cat = v_ins_cat
    AND v.pilar NOT IN ('intro','progressao','fim','dor','modo_seguro')
    AND (v.bloco_alvo IS NULL OR v.bloco_alvo = _bloco_atual)
    AND (v.sessoes_alvo IS NULL OR _sessao_num = ANY(v.sessoes_alvo) OR array_length(v.sessoes_alvo,1) IS NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_videos_for_session_moment(uuid,integer,public.momento_video_enum,uuid,integer) TO authenticated;