-- Schema PostgreSQL completo para Supabase
-- Baseado na estrutura MySQL existente

-- Tabela de Utilizadores (Users)
CREATE TABLE IF NOT EXISTS utilizadores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'Gestor' CHECK (tipo IN ('Admin', 'Gestor')),
    ativo BOOLEAN DEFAULT true,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por INTEGER
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio DATE,
    data_fim DATE,
    imagem_destaque VARCHAR(500),
    url_externa VARCHAR(500),
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Respostas Sociais
CREATE TABLE IF NOT EXISTS respostas_sociais (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    subtitulo VARCHAR(300),
    descricao TEXT,
    conteudo TEXT,
    destaques TEXT,
    objetivos TEXT,
    servicos_prestados TEXT,
    capacidade VARCHAR(100),
    horario VARCHAR(200),
    imagem_destaque VARCHAR(500),
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Notícias e Eventos
CREATE TABLE IF NOT EXISTS noticias_eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    resumo TEXT,
    conteudo TEXT,
    tipo VARCHAR(100),
    autor VARCHAR(100),
    imagem_destaque VARCHAR(500),
    publicado BOOLEAN DEFAULT true,
    data_publicacao TIMESTAMP,
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Conteúdo Institucional
CREATE TABLE IF NOT EXISTS conteudo_institucional (
    id SERIAL PRIMARY KEY,
    secao VARCHAR(100) NOT NULL,
    titulo VARCHAR(200),
    subtitulo VARCHAR(300),
    conteudo TEXT,
    imagem VARCHAR(500),
    video_url VARCHAR(500),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_por INTEGER,
    atualizado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de introdução/Home (Hero)
CREATE TABLE IF NOT EXISTS cpsl_intro (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    titulo VARCHAR(300),
    subtitulo VARCHAR(500),
    imagem_fundo VARCHAR(500),
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Media
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) CHECK (tipo IN ('imagem', 'video', 'pdf', 'link')),
    nome VARCHAR(200),
    url VARCHAR(500),
    descricao TEXT,
    tamanho VARCHAR(50),
    mime_type VARCHAR(100),
    tabela_referencia VARCHAR(50),
    id_referencia INTEGER,
    ordem INTEGER DEFAULT 0,
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contactos Institucionais
CREATE TABLE IF NOT EXISTS contactos_institucionais (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50),
    valor VARCHAR(200),
    descricao VARCHAR(200),
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    atualizado_por INTEGER,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Formulário de Contacto
CREATE TABLE IF NOT EXISTS form_contacto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    assunto VARCHAR(200),
    mensagem TEXT NOT NULL,
    respondido BOOLEAN DEFAULT false,
    resposta TEXT,
    respondido_por INTEGER,
    data_resposta TIMESTAMP,
    data_submissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transparência
CREATE TABLE IF NOT EXISTS transparencia (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    ano INTEGER,
    tipo VARCHAR(50) CHECK (tipo IN ('Relatorio', 'Contas', 'Relatorio_Atividades', 'Outro')),
    ficheiro_url VARCHAR(500),
    tamanho_ficheiro VARCHAR(50),
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Seções Personalizadas (para criar seções customizadas dinamicamente)
CREATE TABLE IF NOT EXISTS secoes_personalizadas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    tipo_layout VARCHAR(50) DEFAULT 'cards', -- 'cards', 'lista', 'galeria', 'texto', 'formulario'
    tem_formulario BOOLEAN DEFAULT false, -- Se TRUE, a seção inclui um formulário
    config_formulario JSONB, -- Configuração do formulário (campos, labels, placeholders)
    criado_por INTEGER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens das Seções Personalizadas
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

-- Criar índices para performance
CREATE INDEX idx_projetos_ativo ON projetos(ativo);
CREATE INDEX idx_respostas_sociais_ativo ON respostas_sociais(ativo);
CREATE INDEX idx_noticias_publicado ON noticias_eventos(publicado);
CREATE INDEX idx_noticias_data ON noticias_eventos(data_publicacao);
CREATE INDEX idx_media_referencia ON media(tabela_referencia, id_referencia);
CREATE INDEX idx_form_contacto_respondido ON form_contacto(respondido);
CREATE INDEX idx_transparencia_ano ON transparencia(ano);
CREATE INDEX idx_secoes_ativas ON secoes_personalizadas(ativo, ordem);
CREATE INDEX idx_itens_secao ON itens_secoes_personalizadas(secao_id, ativo, ordem);
CREATE INDEX idx_submissoes_secao ON submissoes_formularios_secoes(secao_id, respondido);

-- Inserir usuário admin padrão
-- Email: admin@cpslanheses.pt | Password: Admin123!
INSERT INTO utilizadores (nome, email, password_hash, tipo, ativo)
VALUES (
    'Administrador',
    'admin@cpslanheses.pt',
    '$2a$10$8K1p/a0dL3.CXvhxLhKGJOWiWy5yeYLJvfDR0FXX1Zr7V8YXqJ9.O',
    'Admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Schema PostgreSQL criado com sucesso! ✅' as status;
