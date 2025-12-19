-- Dados migrados do MySQL para PostgreSQL (Supabase)
-- Booleanos convertidos: 1 → true, 0 → false

-- Contactos Institucionais
INSERT INTO contactos_institucionais (id, tipo, valor, descricao, ativo, ordem, atualizado_por, data_atualizacao) VALUES
(1, 'morada', 'Estrada da Igreja, nº468, Lanheses, Viana do Castelo, Portugal', 'Morada', true, 1, NULL, '2025-12-02 12:21:49'),
(2, 'telefone', '258 739 900', 'Telefone', true, 2, NULL, '2025-12-02 12:21:49'),
(3, 'email', 'geral@cpslanheses.pt', 'Email', true, 3, NULL, '2025-12-02 12:21:49'),
(4, 'horario_secretaria', 'SEG-SEX: 09:30 - 17:00', 'Horário Secretaria', true, 4, NULL, '2025-12-02 12:21:49');

-- Conteúdo Institucional
INSERT INTO conteudo_institucional (id, secao, titulo, subtitulo, conteudo, imagem, video_url, ordem, ativo, atualizado_por, data_atualizacao) VALUES
(1, 'sobre_nos', 'Sobre Nós', NULL, NULL, NULL, NULL, 1, true, NULL, '2025-12-02 12:21:49'),
(2, 'valores', 'Valores', NULL, NULL, NULL, NULL, 2, true, NULL, '2025-12-02 12:21:49'),
(3, 'visao_missao', 'Visão e Missão', NULL, NULL, NULL, NULL, 3, true, NULL, '2025-12-02 12:21:49'),
(4, 'compromisso', 'Compromisso', NULL, NULL, NULL, NULL, 4, true, NULL, '2025-12-02 12:21:49');

-- Projetos
INSERT INTO projetos (id, titulo, descricao, data_inicio, data_fim, imagem_destaque, url_externa, ativo, ordem, criado_por, data_criacao, data_atualizacao) VALUES
(1, 'Incríveis Pessoas Comuns', 'Projeto incriveis pessoas comuns', '2020-10-12', NULL, 'https://www.incriveispessoascomuns.pt/assets/img/logotipo.webp', 'https://www.incriveispessoascomuns.pt', true, 0, 1, '2025-12-18 15:33:06', '2025-12-18 15:50:19'),
(3, 'youtube', 'adadad', '1212-02-21', '0001-02-21', 'https://yt3.googleusercontent.com/3s6evpqAiDU9tQR4sC2siJippbH2RWVPnwHgyl4V0th2iuQz0VDQZbUhQBGmsxLYo-mjG6TqZQ=s900-c-k-c0x00ffffff-no-rj', 'https://www.youtube.com', true, 0, 1, '2025-12-18 15:54:33', '2025-12-18 15:54:33');

-- Utilizadores (Admin já existe, adicionar apenas Tiago)
INSERT INTO utilizadores (id, nome, email, password_hash, tipo, ativo, data_criacao, data_atualizacao, criado_por) VALUES
(2, 'Tiago', 'tiago@gmail.com', '$2a$10$cf4n8kvekUkl7Y1bFbixMuH3c27RK8h2prSxfTL/vWZP.zfG8E8ze', 'Gestor', true, '2025-12-18 15:05:32', '2025-12-18 15:05:32', 1)
ON CONFLICT (id) DO NOTHING;

-- Ajustar sequências (importante para próximos INSERTs)
SELECT setval('contactos_institucionais_id_seq', (SELECT MAX(id) FROM contactos_institucionais));
SELECT setval('conteudo_institucional_id_seq', (SELECT MAX(id) FROM conteudo_institucional));
SELECT setval('projetos_id_seq', (SELECT MAX(id) FROM projetos));
SELECT setval('utilizadores_id_seq', (SELECT MAX(id) FROM utilizadores));

-- Mensagem de sucesso
SELECT 'Dados importados com sucesso! ✅' as status;
