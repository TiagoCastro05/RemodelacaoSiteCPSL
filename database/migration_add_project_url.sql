-- Adicionar campo URL aos projetos
-- Execute este script no MySQL para adicionar a funcionalidade de hiperligações

USE cpsl_db;

-- Adicionar coluna url_externa à tabela Projetos
ALTER TABLE Projetos 
ADD COLUMN url_externa VARCHAR(500) NULL AFTER imagem_destaque;

-- Comentário da coluna
ALTER TABLE Projetos 
MODIFY COLUMN url_externa VARCHAR(500) NULL 
COMMENT 'URL externa para mais informações sobre o projeto';

SELECT 'Coluna url_externa adicionada com sucesso!' AS status;
