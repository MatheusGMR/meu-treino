-- Remove números do final dos nomes dos exercícios
UPDATE exercises 
SET name = TRIM(REGEXP_REPLACE(name, '\s+\d+$', '', 'g'))
WHERE name ~ '\s+\d+$';