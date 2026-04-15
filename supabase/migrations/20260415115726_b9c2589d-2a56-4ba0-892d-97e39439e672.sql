
-- Table for tracking knowledge base files
CREATE TABLE public.ai_knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  config_id uuid REFERENCES public.ai_agent_config(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_type text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner e admins gerenciam arquivos de conhecimento"
  ON public.ai_knowledge_files
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos autenticados podem ler arquivos de conhecimento"
  ON public.ai_knowledge_files
  FOR SELECT
  TO authenticated
  USING (true);

-- Storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-knowledge', 'ai-knowledge', false);

CREATE POLICY "Users upload own knowledge files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ai-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own knowledge files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ai-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own knowledge files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ai-knowledge' AND auth.uid()::text = (storage.foldername(name))[1]);
