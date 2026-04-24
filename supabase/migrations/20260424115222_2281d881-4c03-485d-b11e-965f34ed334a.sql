CREATE TYPE public.support_video_category AS ENUM (
  'educacional',
  'motivacional',
  'tecnica',
  'recuperacao',
  'nutricao',
  'protocolo'
);

CREATE TYPE public.support_video_source AS ENUM ('youtube', 'vimeo', 'upload');

CREATE TABLE public.support_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.support_video_category NOT NULL,
  source public.support_video_source NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer,
  tags text[] DEFAULT '{}'::text[],
  suggested_for_dor_cat public.dor_categoria,
  suggested_for_ins_cat public.inseguranca_categoria,
  suggested_for_exercise_group public.exercise_group,
  suggested_when text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem vídeos de apoio ativos"
ON public.support_videos FOR SELECT TO authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins gerenciam vídeos de apoio"
ON public.support_videos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_support_videos_updated_at
BEFORE UPDATE ON public.support_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_videos_category ON public.support_videos(category) WHERE active = true;
CREATE INDEX idx_support_videos_tags ON public.support_videos USING GIN(tags);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-videos', 'support-videos', true, 104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Vídeos de apoio são publicamente legíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-videos');

CREATE POLICY "Admins fazem upload de vídeos de apoio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins atualizam vídeos de apoio"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'support-videos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins removem vídeos de apoio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-videos' AND public.has_role(auth.uid(), 'admin'::app_role));