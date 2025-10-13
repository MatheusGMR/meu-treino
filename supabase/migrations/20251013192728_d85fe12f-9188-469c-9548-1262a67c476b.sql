-- Tabela para rastrear conclusões de exercícios e séries
CREATE TABLE IF NOT EXISTS session_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workout_id UUID REFERENCES client_workouts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sets_completed INTEGER,
  reps_completed TEXT,
  weight_used NUMERIC,
  notes TEXT,
  rest_time_used INTEGER,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_completions_client ON session_completions(client_id);
CREATE INDEX IF NOT EXISTS idx_session_completions_workout ON session_completions(client_workout_id);
CREATE INDEX IF NOT EXISTS idx_session_completions_date ON session_completions(completed_at);

ALTER TABLE session_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes veem próprias conclusões"
ON session_completions FOR SELECT
USING (client_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('personal', 'admin')
));

CREATE POLICY "Clientes criam próprias conclusões"
ON session_completions FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clientes atualizam próprias conclusões"
ON session_completions FOR UPDATE
USING (client_id = auth.uid());

-- Tabela para controlar qual sessão fazer em cada dia
CREATE TABLE IF NOT EXISTS daily_workout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workout_id UUID REFERENCES client_workouts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  scheduled_for DATE NOT NULL,
  session_order INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_workout_id, scheduled_for)
);

CREATE INDEX IF NOT EXISTS idx_daily_schedule_client ON daily_workout_schedule(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_schedule_date ON daily_workout_schedule(scheduled_for);

ALTER TABLE daily_workout_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes veem próprio schedule"
ON daily_workout_schedule FOR SELECT
USING (client_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('personal', 'admin')
));

CREATE POLICY "Personals criam schedules"
ON daily_workout_schedule FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('personal', 'admin')
));

CREATE POLICY "Sistema atualiza schedules"
ON daily_workout_schedule FOR UPDATE
USING (client_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('personal', 'admin')
));

-- Trigger para incrementar completed_sessions
CREATE OR REPLACE FUNCTION increment_completed_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
    UPDATE client_workouts
    SET completed_sessions = completed_sessions + 1
    WHERE id = NEW.client_workout_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_session_completed
AFTER UPDATE ON daily_workout_schedule
FOR EACH ROW
EXECUTE FUNCTION increment_completed_sessions();