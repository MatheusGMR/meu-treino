ALTER TABLE public.daily_workout_schedule 
ADD COLUMN IF NOT EXISTS difficulty_rating text,
ADD COLUMN IF NOT EXISTS abandon_reason text,
ADD COLUMN IF NOT EXISTS completed_exercises_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_weight_lifted numeric DEFAULT 0;