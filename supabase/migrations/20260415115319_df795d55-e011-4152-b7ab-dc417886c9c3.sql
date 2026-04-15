
CREATE TABLE public.ai_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  config_type text NOT NULL DEFAULT 'global',
  system_prompt text,
  personality text,
  tone text,
  macro_instructions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e personals gerenciam config do agente"
  ON public.ai_agent_config
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos autenticados podem ler config do agente"
  ON public.ai_agent_config
  FOR SELECT
  TO authenticated
  USING (true);
