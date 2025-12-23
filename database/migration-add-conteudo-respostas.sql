-- Migração: Adicionar coluna 'conteudo' à tabela respostas_sociais
-- Data: 2025
-- Descrição: Adiciona suporte para conteúdo rico (HTML) nas respostas sociais, separado da descrição breve

-- Adicionar coluna conteudo se não existir
ALTER TABLE respostas_sociais 
ADD COLUMN IF NOT EXISTS conteudo TEXT;

-- Opcional: Migrar dados existentes de descricao para conteudo se quiser
-- UPDATE respostas_sociais SET conteudo = descricao WHERE conteudo IS NULL;

COMMENT ON COLUMN respostas_sociais.descricao IS 'Descrição breve/resumo da resposta social';
COMMENT ON COLUMN respostas_sociais.conteudo IS 'Conteúdo completo em HTML (rich text) da resposta social';
