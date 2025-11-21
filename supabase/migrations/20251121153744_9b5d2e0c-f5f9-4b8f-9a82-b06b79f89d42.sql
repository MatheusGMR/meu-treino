-- Adicionar colunas de tracking em exercises
ALTER TABLE exercises
  ADD COLUMN is_new BOOLEAN DEFAULT false,
  ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN source_reference TEXT,
  ADD COLUMN confidence_score NUMERIC(3,2),
  ADD COLUMN review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Adicionar colunas de tracking em methods
ALTER TABLE methods
  ADD COLUMN is_new BOOLEAN DEFAULT false,
  ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN source_reference TEXT,
  ADD COLUMN confidence_score NUMERIC(3,2),
  ADD COLUMN review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Adicionar colunas de tracking em volumes
ALTER TABLE volumes
  ADD COLUMN is_new BOOLEAN DEFAULT false,
  ADD COLUMN added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN last_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN source_reference TEXT,
  ADD COLUMN confidence_score NUMERIC(3,2),
  ADD COLUMN review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('pending', 'approved', 'rejected'));

-- Índices para performance
CREATE INDEX idx_exercises_is_new ON exercises(is_new) WHERE is_new = true;
CREATE INDEX idx_methods_is_new ON methods(is_new) WHERE is_new = true;
CREATE INDEX idx_volumes_is_new ON volumes(is_new) WHERE is_new = true;
CREATE INDEX idx_exercises_added_at ON exercises(added_at DESC);
CREATE INDEX idx_methods_added_at ON methods(added_at DESC);
CREATE INDEX idx_volumes_added_at ON volumes(added_at DESC);

-- Tabela de atualizações pendentes
CREATE TABLE pending_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('exercise', 'method', 'volume')),
  entity_data JSONB NOT NULL,
  source_reference TEXT,
  confidence_score NUMERIC(3,2),
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policy para pending_updates
ALTER TABLE pending_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar atualizações pendentes"
  ON pending_updates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para remover badge "novo" após 30 dias
CREATE OR REPLACE FUNCTION remove_new_badge_after_30_days()
RETURNS void AS $$
BEGIN
  UPDATE exercises 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
  
  UPDATE methods 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
  
  UPDATE volumes 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN exercises.is_new IS 'Indica se o exercício foi adicionado nos últimos 30 dias';
COMMENT ON COLUMN exercises.source_reference IS 'Link para publicação científica de origem';
COMMENT ON COLUMN exercises.confidence_score IS 'Score de confiança da AI (0.00 - 1.00)';
COMMENT ON TABLE pending_updates IS 'Atualizações encontradas pela AI aguardando revisão manual';