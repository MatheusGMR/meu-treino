-- ============= ENUMS =============
DO $$ BEGIN
  CREATE TYPE public.exercise_block_enum AS ENUM ('MOB','FORT','MS','MI','CARD','ALONG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.safety_level_enum AS ENUM ('S1','S2','S3','S4','S5');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.equipment_code_enum AS ENUM ('PC','ELAS','MAC','DIV','CONV','CAB','HAL','BAR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.workout_type_enum AS ENUM ('standard','protocolo_destravamento');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= EXERCISES =============
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS safety_level public.safety_level_enum,
  ADD COLUMN IF NOT EXISTS difficulty_code text,
  ADD COLUMN IF NOT EXISTS block public.exercise_block_enum,
  ADD COLUMN IF NOT EXISTS equipment_code public.equipment_code_enum,
  ADD COLUMN IF NOT EXISTS movement text,
  ADD COLUMN IF NOT EXISTS variation text;

CREATE UNIQUE INDEX IF NOT EXISTS exercises_external_id_unique
  ON public.exercises (external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS exercises_block_idx ON public.exercises (block);
CREATE INDEX IF NOT EXISTS exercises_safety_idx ON public.exercises (safety_level);

-- ============= WORKOUTS =============
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS workout_type public.workout_type_enum NOT NULL DEFAULT 'standard';

-- ============= SESSIONS =============
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS block public.exercise_block_enum;