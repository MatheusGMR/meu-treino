-- Adicionar novas colunas à tabela volumes
ALTER TABLE volumes
ADD COLUMN IF NOT EXISTS series_min integer,
ADD COLUMN IF NOT EXISTS series_max integer,
ADD COLUMN IF NOT EXISTS exercise_min integer,
ADD COLUMN IF NOT EXISTS exercise_max integer,
ADD COLUMN IF NOT EXISTS weekly_volume_description text,
ADD COLUMN IF NOT EXISTS movement_pattern text,
ADD COLUMN IF NOT EXISTS goal text,
ADD COLUMN IF NOT EXISTS min_weekly_sets integer,
ADD COLUMN IF NOT EXISTS optimal_weekly_sets integer,
ADD COLUMN IF NOT EXISTS max_weekly_sets integer;

-- Popular com os 10 volumes convertidos do Excel
INSERT INTO volumes (
  name, num_series, num_exercises,
  series_min, series_max, exercise_min, exercise_max,
  weekly_volume_description, movement_pattern, goal,
  min_weekly_sets, optimal_weekly_sets, max_weekly_sets
) VALUES
  ('Volume Baixo', 2, 1, 2, 6, 1, 3, '6–10 séries/semana', 'Push/Pull/Lower', 'Força / Iniciante', 6, 8, 10),
  ('Volume Moderado', 7, 3, 7, 15, 3, 6, '10–18 séries/semana', 'Push/Pull/Lower', 'Hipertrofia / Intermediário', 10, 14, 18),
  ('Volume Alto', 15, 6, 15, 20, 6, 10, '18–25 séries/semana', 'Push/Pull/Lower', 'Hipertrofia / Avançado', 18, 22, 25),
  ('Volume Extremo', 20, 10, 20, 30, 10, 15, '25–35 séries/semana', 'Dividido por músculos', 'Atletas / Avançado', 25, 30, 35),
  ('Hipertrofia Básica', 8, 4, 8, 12, 4, 6, '12–15 séries/semana', 'Full Body / Upper/Lower', 'Hipertrofia', 12, 14, 15),
  ('Força Pesada', 3, 2, 3, 5, 2, 3, '8–12 séries/semana', 'Full Body', 'Força', 8, 10, 12),
  ('Resistência', 12, 5, 12, 20, 5, 8, '15–20 séries/semana', 'Circuito', 'Resistência', 15, 18, 20),
  ('Manutenção (Iniciante)', 4, 2, 4, 8, 2, 4, '6–10 séries/semana', 'Full Body', 'Iniciante', 6, 8, 10),
  ('Progressão (Intermediário)', 10, 5, 10, 15, 5, 8, '12–18 séries/semana', 'Upper/Lower', 'Intermediário', 12, 15, 18),
  ('Otimização (Avançado)', 16, 8, 16, 25, 8, 12, '20–30 séries/semana', 'Push/Pull/Legs', 'Avançado', 20, 25, 30);