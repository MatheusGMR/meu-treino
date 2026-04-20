-- Adicionar coluna protocol_only para isolar biblioteca do Protocolo Destravamento
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS protocol_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS limitation text,
  ADD COLUMN IF NOT EXISTS limitation_detail text,
  ADD COLUMN IF NOT EXISTS substitution_id text;

-- Índice para acelerar filtros do motor do Protocolo
CREATE INDEX IF NOT EXISTS idx_exercises_protocol_only 
  ON public.exercises(protocol_only) 
  WHERE protocol_only = true;

CREATE INDEX IF NOT EXISTS idx_exercises_protocol_filters 
  ON public.exercises(protocol_only, safety_level, block, equipment_code) 
  WHERE protocol_only = true;

-- Índice para lookup de substituições
CREATE INDEX IF NOT EXISTS idx_exercises_exercise_id 
  ON public.exercises(exercise_id);

COMMENT ON COLUMN public.exercises.protocol_only IS 
  'Quando true, exercício pertence exclusivamente à biblioteca do Protocolo Destravamento e não aparece para personals regulares';
COMMENT ON COLUMN public.exercises.limitation IS 
  'Categoria de limitação (ex: Mobilidade, Cardio, Joelho) usada pelo motor do Protocolo';
COMMENT ON COLUMN public.exercises.substitution_id IS 
  'exercise_id de substituto sugerido caso o exercício seja contraindicado';