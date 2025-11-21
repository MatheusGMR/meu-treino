-- Add new columns to exercises table for enhanced exercise data
-- These columns support better exercise cataloging and recommendations

-- Add exercise_id column (unique identifier from external sources)
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS exercise_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS variations TEXT[],
ADD COLUMN IF NOT EXISTS suggested_volume JSONB,
ADD COLUMN IF NOT EXISTS suggested_methods TEXT[],
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS difficulty_progression TEXT[],
ADD COLUMN IF NOT EXISTS common_mistakes TEXT[],
ADD COLUMN IF NOT EXISTS coaching_cues TEXT[],
ADD COLUMN IF NOT EXISTS target_audience TEXT[];

-- Add comments to document each column
COMMENT ON COLUMN public.exercises.exercise_id IS 'Identificador único do exercício de fontes externas (ex: CSV, APIs)';
COMMENT ON COLUMN public.exercises.slug IS 'URL-friendly slug for SEO and routing (ex: supino-reto-barra)';
COMMENT ON COLUMN public.exercises.short_description IS 'Descrição curta do exercício (1-2 frases) para listagens';
COMMENT ON COLUMN public.exercises.long_description IS 'Descrição detalhada do exercício incluindo técnica e benefícios';
COMMENT ON COLUMN public.exercises.variations IS 'Variações do exercício (ex: ["Com halteres", "Inclinado", "Com pegada fechada"])';
COMMENT ON COLUMN public.exercises.suggested_volume IS 'Volume sugerido em formato JSON (ex: {"series": "3-4", "reps": "8-12", "rest": "60-90s"})';
COMMENT ON COLUMN public.exercises.suggested_methods IS 'Métodos de treinamento sugeridos (ex: ["Drop Set", "Pirâmide", "Rest-Pause"])';
COMMENT ON COLUMN public.exercises.tags IS 'Tags para categorização e busca (ex: ["push", "compound", "beginner-friendly"])';
COMMENT ON COLUMN public.exercises.difficulty_progression IS 'Progressões de dificuldade do exercício';
COMMENT ON COLUMN public.exercises.common_mistakes IS 'Erros comuns na execução do exercício';
COMMENT ON COLUMN public.exercises.coaching_cues IS 'Dicas de coaching para execução correta';
COMMENT ON COLUMN public.exercises.target_audience IS 'Público-alvo recomendado (ex: ["Iniciantes", "Reabilitação"])';

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_id ON public.exercises(exercise_id) WHERE exercise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON public.exercises(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_tags ON public.exercises USING GIN(tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_suggested_methods ON public.exercises USING GIN(suggested_methods) WHERE suggested_methods IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_target_audience ON public.exercises USING GIN(target_audience) WHERE target_audience IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_suggested_volume ON public.exercises USING GIN(suggested_volume) WHERE suggested_volume IS NOT NULL;

-- Add index for full-text search on descriptions
CREATE INDEX IF NOT EXISTS idx_exercises_description_search ON public.exercises 
USING gin(to_tsvector('portuguese', COALESCE(short_description, '') || ' ' || COALESCE(long_description, '')));

COMMENT ON INDEX idx_exercises_exercise_id IS 'Índice para busca rápida por exercise_id externo';
COMMENT ON INDEX idx_exercises_slug IS 'Índice para busca por slug (URLs amigáveis)';
COMMENT ON INDEX idx_exercises_tags IS 'Índice GIN para busca eficiente por tags';
COMMENT ON INDEX idx_exercises_suggested_methods IS 'Índice GIN para busca por métodos sugeridos';
COMMENT ON INDEX idx_exercises_target_audience IS 'Índice GIN para filtrar por público-alvo';
COMMENT ON INDEX idx_exercises_description_search IS 'Índice full-text search para descrições em português';