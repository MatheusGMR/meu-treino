-- Adiciona workout_type para roteamento entre agente standard vs protocolo
ALTER TABLE public.client_workouts
  ADD COLUMN IF NOT EXISTS workout_type workout_type_enum NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_client_workouts_workout_type
  ON public.client_workouts(workout_type) WHERE workout_type = 'protocolo_destravamento';