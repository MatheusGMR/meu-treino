
-- Tabela de eventos do funil de marketing
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page text,
  session_id text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir eventos (tracking público da LP)
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events FOR INSERT
  TO public
  WITH CHECK (true);

-- Apenas admins podem ver eventos
CREATE POLICY "Admins can view funnel events"
  ON public.funnel_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX idx_funnel_events_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_events_created ON public.funnel_events(created_at);
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);

-- Tabela de elegibilidade
CREATE TABLE public.eligibility_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  age integer NOT NULL,
  phone text NOT NULL,
  gender text NOT NULL,
  is_vs_gold boolean DEFAULT false,
  vs_gold_exit_date date,
  pain_shoulder boolean DEFAULT false,
  pain_lower_back boolean DEFAULT false,
  pain_knee boolean DEFAULT false,
  payment_status text DEFAULT 'pending',
  payment_provider text,
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eligibility_submissions ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode inserir
CREATE POLICY "Authenticated users can insert eligibility"
  ON public.eligibility_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários veem próprios dados, admins veem tudo
CREATE POLICY "Users see own eligibility, admins see all"
  ON public.eligibility_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem atualizar próprios dados (ex: após pagamento)
CREATE POLICY "Users can update own eligibility"
  ON public.eligibility_submissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Anônimos também podem inserir (antes do login)
CREATE POLICY "Anon can insert funnel events"
  ON public.funnel_events FOR INSERT
  TO anon
  WITH CHECK (true);
