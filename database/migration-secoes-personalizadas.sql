-- Migração para Seções Personalizadas
-- Permite criar seções customizadas dinamicamente no site

-- Tabela para armazenar as seções personalizadas
CREATE TABLE IF NOT EXISTS secoes_personalizadas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE, -- Nome interno (ex: 'galeria', 'equipa')
    titulo VARCHAR(200) NOT NULL, -- Título exibido no site (ex: 'Galeria', 'Nossa Equipa')
    slug VARCHAR(100) NOT NULL UNIQUE, -- Para âncora no site (#slug)
    descricao TEXT, -- Descrição opcional
    icone VARCHAR(50), -- Emoji ou ícone (ex: '📸', '👥')
    ordem INTEGER DEFAULT 0, -- Ordem de exibição no menu
    ativo BOOLEAN DEFAULT true,
    tipo_layout VARCHAR(50) DEFAULT 'cards', -- 'cards', 'lista', 'galeria', 'texto', 'formulario'
    tem_formulario BOOLEAN DEFAULT false, -- Se TRUE, a seção inclui um formulário
    config_formulario JSONB, -- Configuração do formulário (campos, labels, placeholders)
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para o conteúdo das seções personalizadas
CREATE TABLE IF NOT EXISTS itens_secoes_personalizadas (
    id SERIAL PRIMARY KEY,
    secao_id INTEGER NOT NULL REFERENCES secoes_personalizadas(id) ON DELETE CASCADE,
    titulo VARCHAR(300),
    subtitulo VARCHAR(500),
    conteudo TEXT,
    imagem VARCHAR(500),
    video_url VARCHAR(500),
    link_externo VARCHAR(500),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Submissões de Formulários das Seções Personalizadas
CREATE TABLE IF NOT EXISTS submissoes_formularios_secoes (
    id SERIAL PRIMARY KEY,
    secao_id INTEGER NOT NULL REFERENCES secoes_personalizadas(id) ON DELETE CASCADE,
    dados JSONB NOT NULL, -- Armazena todos os campos do formulário de forma flexível
    respondido BOOLEAN DEFAULT false,
    resposta TEXT,
    respondido_por INTEGER,
    data_resposta TIMESTAMP,
    data_submissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_secoes_ativas ON secoes_personalizadas(ativo, ordem);
CREATE INDEX idx_itens_secao ON itens_secoes_personalizadas(secao_id, ativo, ordem);
CREATE INDEX idx_submissoes_secao ON submissoes_formularios_secoes(secao_id, respondido);

-- Mensagem de sucesso
SELECT 'Tabelas de seções personalizadas criadas com sucesso! ✅' as status;
