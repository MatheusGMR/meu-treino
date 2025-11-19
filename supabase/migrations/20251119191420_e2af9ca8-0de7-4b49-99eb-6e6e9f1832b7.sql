-- FASE 1: Refatoração do Banco de Dados

-- 1. Criar tabela VOLUMES
CREATE TABLE IF NOT EXISTS public.volumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  num_series INTEGER NOT NULL CHECK (num_series > 0),
  num_exercises INTEGER NOT NULL CHECK (num_exercises > 0),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela METHODS
CREATE TABLE IF NOT EXISTS public.methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  reps_min INTEGER NOT NULL CHECK (reps_min > 0),
  reps_max INTEGER NOT NULL CHECK (reps_max >= reps_min),
  rest_seconds INTEGER NOT NULL CHECK (rest_seconds >= 0),
  load_level TEXT NOT NULL CHECK (load_level IN ('Alta', 'Média', 'Baixa')),
  cadence_contraction INTEGER NOT NULL CHECK (cadence_contraction >= 0),
  cadence_pause INTEGER NOT NULL CHECK (cadence_pause >= 0),
  cadence_stretch INTEGER NOT NULL CHECK (cadence_stretch >= 0),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar volume e método padrão para migração de dados existentes
INSERT INTO public.volumes (name, num_series, num_exercises, created_by) 
VALUES ('Volume Padrão (Migração)', 3, 1, NULL);

INSERT INTO public.methods (name, reps_min, reps_max, rest_seconds, load_level, cadence_contraction, cadence_pause, cadence_stretch, created_by)
VALUES ('Método Padrão (Migração)', 8, 12, 60, 'Média', 2, 1, 2, NULL);

-- 4. Refatorar tabela EXERCISES
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS contraindication TEXT;
ALTER TABLE public.exercises RENAME COLUMN media_url TO video_url;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS intensity;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS equipment;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS print_name;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS description;
ALTER TABLE public.exercises DROP COLUMN IF EXISTS media_type;

-- 5. Refatorar tabela SESSION_EXERCISES
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS volume_id UUID REFERENCES public.volumes(id);
ALTER TABLE public.session_exercises ADD COLUMN IF NOT EXISTS method_id UUID REFERENCES public.methods(id);

-- Migrar dados existentes
UPDATE public.session_exercises SET 
  volume_id = (SELECT id FROM public.volumes WHERE name = 'Volume Padrão (Migração)' LIMIT 1),
  method_id = (SELECT id FROM public.methods WHERE name = 'Método Padrão (Migração)' LIMIT 1)
WHERE volume_id IS NULL OR method_id IS NULL;

-- Tornar campos obrigatórios
ALTER TABLE public.session_exercises ALTER COLUMN volume_id SET NOT NULL;
ALTER TABLE public.session_exercises ALTER COLUMN method_id SET NOT NULL;

-- Remover campos antigos
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS sets;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS reps;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS rest_time;
ALTER TABLE public.session_exercises DROP COLUMN IF EXISTS notes;

-- 6. Refatorar tabela SESSIONS
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.sessions SET name = description WHERE name IS NULL;
ALTER TABLE public.sessions ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS session_type;

-- 7. RLS Policies para VOLUMES
ALTER TABLE public.volumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal e Admin gerenciam volumes"
ON public.volumes
FOR ALL
USING (
  public.has_role(auth.uid(), 'personal'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 8. RLS Policies para METHODS
ALTER TABLE public.methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Personal e Admin gerenciam métodos"
ON public.methods
FOR ALL
USING (
  public.has_role(auth.uid(), 'personal'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);