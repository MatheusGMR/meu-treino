-- CORREÇÃO 6.1: Adicionar colunas para dados calculados pela IA
ALTER TABLE public.anamnesis
ADD COLUMN IF NOT EXISTS imc_calculado NUMERIC,
ADD COLUMN IF NOT EXISTS imc_categoria TEXT,
ADD COLUMN IF NOT EXISTS nivel_experiencia TEXT,
ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.anamnesis.imc_calculado IS 'IMC calculado pela IA com base em peso e altura';
COMMENT ON COLUMN public.anamnesis.imc_categoria IS 'Categoria do IMC (Abaixo do peso, Peso normal, Sobrepeso, Obesidade)';
COMMENT ON COLUMN public.anamnesis.nivel_experiencia IS 'Nível de experiência inferido pela IA (Iniciante, Iniciante+, Intermediário)';
COMMENT ON COLUMN public.anamnesis.calculated_at IS 'Timestamp da última análise/cálculo pela IA';