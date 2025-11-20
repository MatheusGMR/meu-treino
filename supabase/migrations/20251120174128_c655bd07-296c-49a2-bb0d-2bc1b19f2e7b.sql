-- Expandir enum exercise_group com novos valores
ALTER TYPE exercise_group ADD VALUE IF NOT EXISTS 'Quadríceps';
ALTER TYPE exercise_group ADD VALUE IF NOT EXISTS 'Posterior';
ALTER TYPE exercise_group ADD VALUE IF NOT EXISTS 'Lombar';

-- Adicionar novos campos à tabela exercises
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS level text CHECK (level IN ('Iniciante', 'Intermediário', 'Avançado')),
  ADD COLUMN IF NOT EXISTS equipment text[],
  ADD COLUMN IF NOT EXISTS primary_muscle text,
  ADD COLUMN IF NOT EXISTS secondary_muscle text,
  ADD COLUMN IF NOT EXISTS impact_level text CHECK (impact_level IN ('Baixo', 'Médio', 'Alto')),
  ADD COLUMN IF NOT EXISTS biomechanical_class text,
  ADD COLUMN IF NOT EXISTS dominant_movement text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;