-- Criar ENUM para tipos de exercício
CREATE TYPE exercise_type_enum AS ENUM (
  'Musculação',
  'Mobilidade',
  'Cardio',
  'Alongamento'
);

-- Adicionar coluna exercise_type à tabela exercises
ALTER TABLE exercises 
ADD COLUMN exercise_type exercise_type_enum NOT NULL DEFAULT 'Musculação';

-- Atualizar exercícios existentes baseado em grupos musculares
UPDATE exercises 
SET exercise_type = 'Musculação' 
WHERE exercise_group IN ('Abdômen', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Glúteos', 'Panturrilha');