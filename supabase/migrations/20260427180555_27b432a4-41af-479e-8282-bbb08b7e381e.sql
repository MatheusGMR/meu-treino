-- Add movement_vector column to exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS movement_vector text;

CREATE INDEX IF NOT EXISTS idx_exercises_movement_vector
  ON public.exercises(movement_vector);

-- Function to compute next sequential ID for protocol exercise external_id
CREATE OR REPLACE FUNCTION public.next_protocol_exercise_seq(
  _block text,
  _equip text,
  _safety text,
  _level text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_max int;
BEGIN
  v_prefix := upper(_block) || upper(_equip) || upper(_safety) || upper(_level);

  SELECT COALESCE(MAX(NULLIF(regexp_replace(substring(external_id from length(v_prefix)+1), '\D', '', 'g'), '')::int), 0)
    INTO v_max
  FROM public.exercises
  WHERE external_id LIKE v_prefix || '%';

  RETURN v_prefix || lpad((v_max + 1)::text, 3, '0');
END;
$$;