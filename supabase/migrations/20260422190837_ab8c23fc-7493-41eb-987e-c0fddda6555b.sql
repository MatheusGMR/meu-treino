ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS preparation_video_url text,
  ADD COLUMN IF NOT EXISTS preparation_description text;

CREATE OR REPLACE FUNCTION public.get_last_weight_for_exercise(
  _client_id uuid,
  _exercise_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT weight_used
  FROM public.session_completions
  WHERE client_id = _client_id
    AND exercise_id = _exercise_id
    AND weight_used IS NOT NULL
    AND weight_used > 0
  ORDER BY created_at DESC
  LIMIT 1
$$;