-- Remove constraints antigos que só permitem 1-5
ALTER TABLE anamnesis 
DROP CONSTRAINT IF EXISTS anamnesis_current_body_type_check;

ALTER TABLE anamnesis 
DROP CONSTRAINT IF EXISTS anamnesis_desired_body_type_check;

-- Adiciona novos constraints permitindo 1-9 e NULL
ALTER TABLE anamnesis 
ADD CONSTRAINT anamnesis_current_body_type_check 
CHECK (current_body_type IS NULL OR (current_body_type >= 1 AND current_body_type <= 9));

ALTER TABLE anamnesis 
ADD CONSTRAINT anamnesis_desired_body_type_check 
CHECK (desired_body_type IS NULL OR (desired_body_type >= 1 AND desired_body_type <= 9));