-- Adicionar coluna criado_por e data_criacao à tabela conteudo_institucional
-- Para manter consistência com as outras tabelas

ALTER TABLE conteudo_institucional 
ADD COLUMN IF NOT EXISTS criado_por INTEGER,
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Mensagem de sucesso
SELECT 'Colunas criado_por e data_criacao adicionadas com sucesso! ✅' as status;
