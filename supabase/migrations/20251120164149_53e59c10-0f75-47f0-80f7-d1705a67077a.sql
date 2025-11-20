-- Criar ENUMs para métodos de treinamento
CREATE TYPE method_objective AS ENUM (
  'Hipertrofia',
  'Força',
  'Resistência',
  'Potência',
  'Hipertrofia + Força',
  'Força + Hipertrofia',
  'Equilíbrio / Hipertrofia',
  'Hipertrofia pesada',
  'Força + Potência'
);

CREATE TYPE method_risk_level AS ENUM (
  'Baixo risco',
  'Médio risco',
  'Alto risco',
  'Alto risco de fadiga'
);

CREATE TYPE method_energy_cost AS ENUM (
  'Alto',
  'Médio',
  'Baixo'
);

-- Adicionar novas colunas à tabela methods
ALTER TABLE methods 
ADD COLUMN reps_description text,
ADD COLUMN objective method_objective,
ADD COLUMN risk_level method_risk_level NOT NULL DEFAULT 'Baixo risco',
ADD COLUMN video_url text,
ADD COLUMN energy_cost method_energy_cost NOT NULL DEFAULT 'Médio',
ADD COLUMN recommended_combination text;

-- Popular tabela com os 13 métodos do Excel
INSERT INTO methods (
  name, reps_min, reps_max, reps_description, rest_seconds, load_level,
  cadence_contraction, cadence_pause, cadence_stretch,
  objective, risk_level, video_url, energy_cost, recommended_combination
) VALUES
  -- 1. Repetições Clássicas
  ('Repetições Clássicas', 6, 12, NULL, 60, 'Média', 2, 0, 2,
   'Hipertrofia', 'Baixo risco', 'https://www.youtube.com/watch?v=E6rZK8C9b5o',
   'Médio', 'Usado individualmente'),
  
  -- 2. Força Máxima
  ('Força Máxima', 1, 5, NULL, 120, 'Alta', 1, 0, 1,
   'Força', 'Médio risco', 'https://www.youtube.com/watch?v=op9kVnSso6Q',
   'Alto', 'Combine com cargas altas'),
  
  -- 3. Resistência Muscular
  ('Resistência Muscular', 15, 30, NULL, 30, 'Baixa', 2, 1, 2,
   'Resistência', 'Baixo risco', 'https://www.youtube.com/watch?v=M1gE6ZCy3r0',
   'Baixo', 'Ideal com supersets'),
  
  -- 4. Treino de Potência
  ('Treino de Potência', 1, 5, NULL, 120, 'Média', 1, 0, 1,
   'Potência', 'Alto risco', 'https://www.youtube.com/watch?v=qKx2B8Q8cBk',
   'Médio', 'Usado individualmente'),
  
  -- 5. Piramidal Crescente
  ('Piramidal Crescente', 6, 12, '12-10-8-6 reps (piramidal)', 60, 'Média', 2, 0, 2,
   'Hipertrofia + Força', 'Médio risco', 'https://www.youtube.com/watch?v=3V1YgJ7Gf5g',
   'Médio', 'Pode ser combinado com Drop-set'),
  
  -- 6. Piramidal Decrescente
  ('Piramidal Decrescente', 6, 12, '6-8-10-12 reps (piramidal)', 60, 'Alta', 2, 0, 2,
   'Força + Hipertrofia', 'Médio risco', 'https://www.youtube.com/watch?v=3V1YgJ7Gf5g',
   'Alto', 'Pode ser combinado com Drop-set'),
  
  -- 7. Drop Set
  ('Drop Set', 8, 12, 'Falha + Reduções (drop-set)', 0, 'Baixa', 2, 0, 2,
   'Hipertrofia', 'Alto risco de fadiga', 'https://www.youtube.com/watch?v=UoC_O3HzsH0',
   'Baixo', 'Usado individualmente'),
  
  -- 8. Bi-set
  ('Bi-set', 8, 15, NULL, 60, 'Média', 2, 1, 2,
   'Hipertrofia', 'Médio risco', 'https://www.youtube.com/watch?v=k2H2r2kB6Rs',
   'Médio', 'Usado individualmente'),
  
  -- 9. Tri-set
  ('Tri-set', 8, 15, NULL, 60, 'Média', 2, 1, 2,
   'Hipertrofia', 'Médio risco', 'https://www.youtube.com/watch?v=kgR1JrXPd9o',
   'Médio', 'Usado individualmente'),
  
  -- 10. Super-set Antagonista
  ('Super-set Antagonista', 8, 12, NULL, 60, 'Média', 2, 0, 2,
   'Equilíbrio / Hipertrofia', 'Baixo risco', 'https://www.youtube.com/watch?v=Bp3xygx0tq4',
   'Médio', 'Usado individualmente'),
  
  -- 11. Treino GVT
  ('Treino GVT', 10, 10, '10×10 (German Volume Training)', 60, 'Média', 3, 0, 1,
   'Hipertrofia pesada', 'Alto risco de fadiga', 'https://www.youtube.com/watch?v=VLRkzIFrf2A',
   'Médio', 'Usado individualmente'),
  
  -- 12. Rest-Pause
  ('Rest-Pause', 4, 6, '4-6 reps + mini séries (rest-pause)', 20, 'Alta', 1, 0, 1,
   'Força + Hipertrofia', 'Alto risco', 'https://www.youtube.com/watch?v=oY7zjzXgdf4',
   'Alto', 'Combine com cargas altas'),
  
  -- 13. Cluster Training
  ('Cluster Training', 1, 3, '1-3 reps por cluster', 10, 'Alta', 1, 0, 1,
   'Força + Potência', 'Alto risco', 'https://www.youtube.com/watch?v=aGev5Qn2yBM',
   'Alto', 'Combine com cargas altas');