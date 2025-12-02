-- ========================================
-- SCHEMA DA BASE DE DADOS - CPSL WEBSITE
-- ========================================

DROP DATABASE IF EXISTS cpsl_db;
CREATE DATABASE cpsl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cpsl_db;

-- ========================================
-- TABELA UTILIZADORES
-- ========================================
CREATE TABLE Utilizadores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo ENUM('Admin', 'Gestor') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    criado_por INT,
    INDEX idx_email (email),
    INDEX idx_tipo (tipo),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA PROJETOS
-- ========================================
CREATE TABLE Projetos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    imagem_destaque VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ativo (ativo),
    INDEX idx_ordem (ordem),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA RESPOSTAS SOCIAIS
-- ========================================
CREATE TABLE Respostas_Sociais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    subtitulo VARCHAR(300),
    descricao TEXT NOT NULL,
    objetivos TEXT,
    servicos_prestados TEXT,
    capacidade VARCHAR(100),
    horario VARCHAR(200),
    imagem_destaque VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ativo (ativo),
    INDEX idx_ordem (ordem),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA TRANSPARÊNCIA
-- ========================================
CREATE TABLE Transparencia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    ano INT NOT NULL,
    tipo ENUM('Relatorio_Contas', 'Relatorio_Atividades', 'Outro') DEFAULT 'Relatorio_Contas',
    ficheiro_url VARCHAR(500) NOT NULL,
    tamanho_ficheiro VARCHAR(50),
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ano (ano),
    INDEX idx_tipo (tipo),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA NOTÍCIAS E EVENTOS
-- ========================================
CREATE TABLE Noticias_Eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(300) NOT NULL,
    resumo TEXT NOT NULL,
    conteudo TEXT,
    tipo VARCHAR(100) NOT NULL,
    autor VARCHAR(100),
    imagem_destaque VARCHAR(500),
    publicado BOOLEAN DEFAULT FALSE,
    data_publicacao TIMESTAMP NULL,
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_publicado (publicado),
    INDEX idx_data_publicacao (data_publicacao),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA MEDIA
-- ========================================
CREATE TABLE Media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo ENUM('imagem', 'video', 'pdf', 'link') NOT NULL,
    nome VARCHAR(200) NOT NULL,
    url VARCHAR(500) NOT NULL,
    descricao TEXT,
    tamanho VARCHAR(50),
    mime_type VARCHAR(100),
    tabela_referencia VARCHAR(50),
    id_referencia INT,
    ordem INT DEFAULT 0,
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referencia (tabela_referencia, id_referencia),
    INDEX idx_tipo (tipo),
    INDEX idx_ordem (ordem),
    FOREIGN KEY (criado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA FORMULÁRIO DE CONTACTO
-- ========================================
CREATE TABLE Form_Contacto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    respondido BOOLEAN DEFAULT FALSE,
    resposta TEXT,
    respondido_por INT,
    data_resposta TIMESTAMP NULL,
    data_submissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_respondido (respondido),
    INDEX idx_data_submissao (data_submissao),
    FOREIGN KEY (respondido_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA CONTEÚDO DA INSTITUIÇÃO
-- ========================================
CREATE TABLE Conteudo_Institucional (
    id INT PRIMARY KEY AUTO_INCREMENT,
    secao VARCHAR(100) NOT NULL UNIQUE,
    titulo VARCHAR(200),
    subtitulo VARCHAR(300),
    conteudo TEXT,
    imagem VARCHAR(500),
    video_url VARCHAR(500),
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    atualizado_por INT,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_secao (secao),
    INDEX idx_ativo (ativo),
    FOREIGN KEY (atualizado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- TABELA CONTACTOS DA INSTITUIÇÃO
-- ========================================
CREATE TABLE Contactos_Institucionais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    valor VARCHAR(200) NOT NULL,
    descricao VARCHAR(200),
    ativo BOOLEAN DEFAULT TRUE,
    ordem INT DEFAULT 0,
    atualizado_por INT,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo),
    FOREIGN KEY (atualizado_por) REFERENCES Utilizadores(id) ON DELETE SET NULL
);

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir Admin inicial (password: Admin123!)
-- Hash gerado com bcrypt rounds=10
INSERT INTO Utilizadores (nome, email, password_hash, tipo) VALUES 
('Administrador', 'admin@cpslanheses.pt', '$2a$10$lxroynsInmOnDMR2mUbBk.YHbPzLXGXSBrX.579jLUfHE4ddKx/M6', 'Admin');

-- Inserir seções institucionais iniciais
INSERT INTO Conteudo_Institucional (secao, titulo, ordem) VALUES
('sobre_nos', 'Sobre Nós', 1),
('valores', 'Valores', 2),
('visao_missao', 'Visão e Missão', 3),
('compromisso', 'Compromisso', 4);

-- Inserir contactos institucionais iniciais
INSERT INTO Contactos_Institucionais (tipo, valor, descricao, ordem) VALUES
('morada', 'Estrada da Igreja, nº468, Lanheses, Viana do Castelo, Portugal', 'Morada', 1),
('telefone', '258 739 900', 'Telefone', 2),
('email', 'geral@cpslanheses.pt', 'Email', 3),
('horario_secretaria', 'SEG-SEX: 09:30 - 17:00', 'Horário Secretaria', 4);
