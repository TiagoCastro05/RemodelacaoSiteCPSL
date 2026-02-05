-- Migração para adicionar coluna destaques às tabelas
-- Esta coluna armazena até 3 subtítulos com títulos e textos associados

-- Adicionar coluna destaques à tabela conteudo_institucional (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conteudo_institucional' 
        AND column_name = 'destaques'
    ) THEN
        ALTER TABLE conteudo_institucional 
        ADD COLUMN destaques TEXT;
    END IF;
END $$;

-- Adicionar coluna destaques à tabela noticias_eventos (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'noticias_eventos' 
        AND column_name = 'destaques'
    ) THEN
        ALTER TABLE noticias_eventos 
        ADD COLUMN destaques TEXT;
    END IF;
END $$;

-- Adicionar coluna destaques à tabela itens_secoes_personalizadas (se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'itens_secoes_personalizadas' 
        AND column_name = 'destaques'
    ) THEN
        ALTER TABLE itens_secoes_personalizadas 
        ADD COLUMN destaques TEXT;
    END IF;
END $$;

-- Comentários sobre a coluna destaques
COMMENT ON COLUMN conteudo_institucional.destaques IS 'Array JSON com até 3 subtítulos, cada um com titulo e texto. Formato: [{"titulo": "...", "texto": "..."}, ...]';
COMMENT ON COLUMN noticias_eventos.destaques IS 'Array JSON com até 3 subtítulos, cada um com titulo e texto. Formato: [{"titulo": "...", "texto": "..."}, ...]';
COMMENT ON COLUMN itens_secoes_personalizadas.destaques IS 'Array JSON com até 3 subtítulos, cada um com titulo e texto. Formato: [{"titulo": "...", "texto": "..."}, ...]';
