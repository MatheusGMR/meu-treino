-- Adicionar coluna session_type à tabela sessions
ALTER TABLE sessions 
ADD COLUMN session_type session_type DEFAULT 'Musculação';