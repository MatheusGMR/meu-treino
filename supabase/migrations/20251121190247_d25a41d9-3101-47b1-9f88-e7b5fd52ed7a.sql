-- Popular tabela medical_condition_exercise_restrictions com restrições básicas

-- Restrições para dor no joelho
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor no joelho', ARRAY['Pernas', 'Quadríceps', 'Posterior']::text[], 'warning', 'Evite agachamentos profundos e saltos. Prefira exercícios de baixo impacto e fortalecimento isométrico.'),
  ('joelho', ARRAY['Pernas', 'Quadríceps']::text[], 'warning', 'Monitore exercícios que exigem flexão profunda do joelho');

-- Restrições para dor nas costas/lombar
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor nas costas', ARRAY['Lombar', 'Costas']::text[], 'danger', 'Evite exercícios com carga axial na coluna. Fortaleça o core antes de progressões.'),
  ('dor lombar', ARRAY['Lombar', 'Costas', 'Pernas']::text[], 'danger', 'Evite flexão e extensão lombar sob carga. Priorize estabilização.'),
  ('hérnia de disco', ARRAY['Lombar', 'Costas', 'Pernas']::text[], 'critical', 'Contraindicação para exercícios com carga axial. Consulta médica obrigatória.'),
  ('lombar', ARRAY['Lombar', 'Costas']::text[], 'warning', 'Atenção redobrada em exercícios que solicitam região lombar');

-- Restrições para dor no ombro
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor no ombro', ARRAY['Ombros', 'Peito']::text[], 'warning', 'Evite abdução acima de 90° e rotação externa sob carga. Fortaleça manguito rotador.'),
  ('ombro', ARRAY['Ombros', 'Peito', 'Costas']::text[], 'warning', 'Evite movimentos que causem desconforto ou impacto no ombro'),
  ('tendinite ombro', ARRAY['Ombros', 'Peito']::text[], 'danger', 'Evite movimentos repetitivos acima da cabeça');

-- Restrições cardíacas
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('problema cardíaco', ARRAY['Cardio', 'Alto Impacto', 'HIIT']::text[], 'critical', 'Exercícios de alta intensidade contraindicados. Liberação médica obrigatória.'),
  ('cardiopatia', ARRAY['Cardio', 'Alto Impacto']::text[], 'critical', 'Consulta cardiológica obrigatória antes de qualquer atividade física'),
  ('hipertensão', ARRAY['Alto Impacto']::text[], 'warning', 'Evite manobra de Valsalva e exercícios isométricos intensos. Monitore PA.');

-- Restrições para diabetes
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('diabetes', ARRAY[]::text[], 'warning', 'Monitore glicemia antes e depois. Evite exercícios em jejum prolongado.');

-- Restrições para quadril
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor no quadril', ARRAY['Pernas', 'Glúteos', 'Quadríceps']::text[], 'warning', 'Evite amplitude extrema e rotação sob carga'),
  ('quadril', ARRAY['Pernas', 'Glúteos']::text[], 'warning', 'Cuidado com exercícios que exigem rotação e flexão profunda do quadril');

-- Restrições para punho/cotovelo
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor no punho', ARRAY['Peito', 'Ombros', 'Tríceps']::text[], 'warning', 'Evite apoio direto no punho. Use variações com barra ou halteres.'),
  ('punho', ARRAY['Peito', 'Ombros']::text[], 'warning', 'Ajuste pegada e apoio para reduzir carga no punho'),
  ('dor no cotovelo', ARRAY['Bíceps', 'Tríceps']::text[], 'warning', 'Evite extensão completa sob carga e movimentos balísticos.'),
  ('cotovelo', ARRAY['Bíceps', 'Tríceps']::text[], 'warning', 'Reduza amplitude e carga em exercícios de cotovelo');

-- Restrições para tornozelo
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('dor no tornozelo', ARRAY['Panturrilha', 'Pernas']::text[], 'warning', 'Evite saltos e impacto. Fortaleça antes de progredir.'),
  ('tornozelo', ARRAY['Panturrilha', 'Pernas']::text[], 'warning', 'Evite exercícios com impacto ou instabilidade');

-- Restrições gerais
INSERT INTO medical_condition_exercise_restrictions (condition_keyword, restricted_exercise_groups, severity_level, recommendation)
VALUES 
  ('artrose', ARRAY['Pernas', 'Quadríceps']::text[], 'warning', 'Prefira exercícios de baixo impacto. Evite amplitudes extremas.'),
  ('bursite', ARRAY['Ombros', 'Quadril']::text[], 'warning', 'Evite movimentos repetitivos e compressão da bursa'),
  ('tendinite', ARRAY['Ombros', 'Cotovelos', 'Joelhos']::text[], 'danger', 'Repouso relativo. Evite movimentos que causem dor.');
