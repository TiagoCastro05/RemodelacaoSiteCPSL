-- Migration: Adicionar campo ordem à tabela Transparencia
-- Data: 2026-02-05
-- Database: PostgreSQL (Supabase)

-- Adicionar coluna ordem
ALTER TABLE transparencia 
ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_transparencia_ordem ON transparencia(ordem);

-- Inicializar ordem baseada na data_criacao (PostgreSQL syntax)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY data_criacao ASC) as new_ordem
  FROM transparencia
)
UPDATE transparencia
SET ordem = ranked.new_ordem
FROM ranked
WHERE transparencia.id = ranked.id;
