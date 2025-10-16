-- ===== TABELA: subscription_plans =====
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  trial_days INTEGER DEFAULT 0,
  stripe_price_id TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== TABELA: personal_subscriptions =====
CREATE TABLE IF NOT EXISTS public.personal_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal vê própria assinatura"
ON public.personal_subscriptions FOR SELECT
TO authenticated
USING (personal_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema cria assinaturas"
ON public.personal_subscriptions FOR INSERT
TO authenticated
WITH CHECK (personal_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema atualiza assinaturas"
ON public.personal_subscriptions FOR UPDATE
TO authenticated
USING (true);

-- ===== TABELA: client_payment_configs =====
CREATE TABLE IF NOT EXISTS public.client_payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, personal_id)
);

ALTER TABLE public.client_payment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal gerencia preços de clientes"
ON public.client_payment_configs FOR ALL
TO authenticated
USING (personal_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ===== TABELA: client_subscriptions =====
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  config_id UUID REFERENCES public.client_payment_configs(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver assinaturas relacionadas"
ON public.client_subscriptions FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() OR 
  personal_id = auth.uid() OR 
  has_role(auth.uid(), 'admin')
);

-- ===== TABELA: payment_history =====
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('personal', 'client')),
  amount NUMERIC(10,2) NOT NULL,
  admin_commission NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver próprio histórico"
ON public.payment_history FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ===== TABELA: commission_settings =====
CREATE TABLE IF NOT EXISTS public.commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  commission_percentage NUMERIC(5,2) DEFAULT 5.00,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(personal_id)
);

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia comissões"
ON public.commission_settings FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Inserir comissão padrão global (5%)
INSERT INTO public.commission_settings (personal_id, commission_percentage)
VALUES (null, 5.00)
ON CONFLICT DO NOTHING;