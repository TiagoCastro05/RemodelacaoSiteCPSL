-- Migração: Adicionar coluna 'destaques' à tabela respostas_sociais
-- Data: 2026
-- Descrição: Permite guardar blocos personalizados (título + texto) nas respostas sociais

-- Adicionar coluna destaques se não existir
ALTER TABLE respostas_sociais
ADD COLUMN IF NOT EXISTS destaques TEXT;

COMMENT ON COLUMN respostas_sociais.destaques IS 'Blocos personalizados (JSON) com titulo/texto para destaque no topo do modal';
