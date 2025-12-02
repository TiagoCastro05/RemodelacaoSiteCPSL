# Plano de Implementação - Website CPSL

## ✅ FASE 1: SETUP E CONFIGURAÇÃO (Concluído)

- [x] Estrutura de pastas criada
- [x] Base de dados MySQL configurada (schema.sql)
- [x] Backend Node.js/Express configurado
- [x] Sistema de autenticação (JWT)
- [x] Todas as rotas API criadas
- [x] Middleware de segurança (helmet, cors, rate-limit)
- [x] Upload de ficheiros (multer)
- [x] Sistema de emails (nodemailer)
- [x] Projeto React criado

## 📋 FASE 2: FRONTEND - ESTRUTURA BASE

### 2.1 Configuração Inicial do React

```bash
cd client
npm install react-router-dom axios react-icons
```

- [ ] Configurar React Router
- [ ] Criar estrutura de pastas (components, pages, contexts, services)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar serviço API (axios)

### 2.2 Contexts

- [ ] AuthContext (gestão de autenticação)
- [ ] AccessibilityContext (contraste, tamanho de fonte)
- [ ] ThemeContext (opcional)

### 2.3 Componentes Comuns

- [ ] Navbar
- [ ] Footer
- [ ] Button
- [ ] Modal
- [ ] Loader/Spinner
- [ ] AlertMessage/Toast

## 🎨 FASE 3: FRONTEND - PÁGINA PÚBLICA

### 3.1 Layout Principal

- [ ] Navbar scroll-down com menu de navegação
- [ ] Footer com informações de contacto
- [ ] Menu de acessibilidade (fixo)

### 3.2 Seções da Home (scroll-down)

#### Hero Section

- [ ] Logo e título principal
- [ ] Imagem/vídeo de destaque
- [ ] Botão CTA

#### Instituição

- [ ] Subsecções: Sobre Nós, Valores, Visão e Missão, Compromisso
- [ ] Navegação por tabs ou accordion
- [ ] Texto editável pelo admin
- [ ] Imagem/vídeo de apoio

#### Respostas Sociais

- [ ] Grid com cards dos serviços
- [ ] Modal/página detalhada de cada serviço
- [ ] Imagens e descrições editáveis
- [ ] ERPI, Centro de Dia, SAD, Creche

#### Projetos

- [ ] Carousel ou grid de projetos
- [ ] Filtro por projeto ativo/concluído
- [ ] Modal com detalhes completos
- [ ] Galeria de imagens

#### Notícias e Eventos

- [ ] Grid de notícias recentes
- [ ] Filtros por tipo e data
- [ ] Paginação
- [ ] Modal/página de notícia completa
- [ ] Galeria de imagens

#### Contactos

- [ ] Formulário de contacto
- [ ] Informações de contacto (morada, telefone, email, horário)
- [ ] Mapa integrado (Google Maps opcional)
- [ ] Validação de formulário

## 🔐 FASE 4: FRONTEND - ÁREA ADMIN

### 4.1 Página de Login

- [ ] Formulário de login
- [ ] Validação
- [ ] Mensagens de erro
- [ ] Redirect após login

### 4.2 Layout do Dashboard

- [ ] Sidebar com navegação
- [ ] Header com nome do utilizador e logout
- [ ] Breadcrumbs
- [ ] Design responsivo

### 4.3 Dashboard Home

- [ ] Estatísticas gerais
- [ ] Mensagens não respondidas
- [ ] Notícias recentes
- [ ] Links rápidos

### 4.4 Gestão de Utilizadores (Admin apenas)

- [ ] Listar utilizadores
- [ ] Criar novo utilizador
- [ ] Editar utilizador
- [ ] Eliminar utilizador
- [ ] Validação de formulários

### 4.5 Gestão de Projetos

- [ ] Listar projetos
- [ ] Criar projeto
- [ ] Editar projeto
- [ ] Eliminar projeto
- [ ] Upload de imagens
- [ ] Adicionar múltiplas imagens/vídeos
- [ ] Ordenação (drag & drop opcional)

### 4.6 Gestão de Notícias/Eventos

- [ ] Listar notícias
- [ ] Criar notícia
- [ ] Editor de texto rico (opcional: TinyMCE, Quill)
- [ ] Editar notícia
- [ ] Eliminar notícia
- [ ] Publicar/despublicar
- [ ] Upload de media
- [ ] Categorias/tipos

### 4.7 Gestão de Respostas Sociais

- [ ] Listar serviços
- [ ] Criar serviço
- [ ] Editar serviço
- [ ] Eliminar serviço
- [ ] Upload de imagens
- [ ] Ordenação

### 4.8 Gestão de Conteúdo Institucional

- [ ] Editar "Sobre Nós"
- [ ] Editar "Valores"
- [ ] Editar "Visão e Missão"
- [ ] Editar "Compromisso"
- [ ] Upload de imagens/vídeos
- [ ] Edição inline (opcional)

### 4.9 Gestão de Mensagens

- [ ] Listar mensagens
- [ ] Ver detalhes da mensagem
- [ ] Responder por email
- [ ] Marcar como respondida
- [ ] Eliminar mensagem
- [ ] Filtros (respondida/não respondida)

### 4.10 Gestão de Transparência

- [ ] Listar documentos
- [ ] Upload de PDFs
- [ ] Organizar por ano
- [ ] Eliminar documento

### 4.11 Configurações

- [ ] Alterar password
- [ ] Editar contactos institucionais
- [ ] Configurações de acessibilidade
- [ ] Dados do perfil

## ♿ FASE 5: ACESSIBILIDADE

### 5.1 Funcionalidades

- [ ] Menu de acessibilidade fixo
- [ ] Aumentar/diminuir tamanho de fonte
- [ ] Alto contraste
- [ ] Navegação por teclado completa
- [ ] Skip to content
- [ ] Focus visível em todos os elementos interativos

### 5.2 Semântica e ARIA

- [ ] Usar tags HTML5 semânticas
- [ ] ARIA labels em elementos interativos
- [ ] Alt text em todas as imagens
- [ ] Roles apropriados
- [ ] Landmarks

### 5.3 Testes

- [ ] Testar com leitores de ecrã
- [ ] Testar navegação por teclado
- [ ] Validar HTML
- [ ] Lighthouse accessibility score > 90

## 🎨 FASE 6: DESIGN E UX

### 6.1 Estilos

- [ ] Aplicar paleta de cores CPSL
- [ ] Tipografia consistente
- [ ] Espaçamentos uniformes
- [ ] Design responsivo (mobile, tablet, desktop)
- [ ] Animações suaves

### 6.2 Componentes Visuais

- [ ] Cards com hover effects
- [ ] Botões com estados (hover, active, disabled)
- [ ] Formulários estilizados
- [ ] Modais
- [ ] Tooltips
- [ ] Loading states

### 6.3 Imagens

- [ ] Otimizar imagens (compressão)
- [ ] Lazy loading
- [ ] Placeholders durante carregamento
- [ ] Fallback para imagens quebradas

## 🧪 FASE 7: TESTES

### 7.1 Testes Funcionais

- [ ] Testar login/logout
- [ ] Testar CRUD de todos os recursos
- [ ] Testar upload de ficheiros
- [ ] Testar formulário de contacto
- [ ] Testar filtros e pesquisas
- [ ] Testar paginação

### 7.2 Testes de Permissões

- [ ] Verificar rotas protegidas
- [ ] Testar permissões Admin vs Gestor
- [ ] Testar expiração de token

### 7.3 Testes Responsivos

- [ ] Testar em mobile (iOS e Android)
- [ ] Testar em tablet
- [ ] Testar em desktop (Chrome, Firefox, Safari, Edge)

### 7.4 Testes de Performance

- [ ] Lighthouse score > 80
- [ ] Tempos de carregamento < 3s
- [ ] Otimização de bundle size

## 🚀 FASE 8: DEPLOY E PRODUÇÃO

### 8.1 Preparação

- [ ] Criar .env de produção
- [ ] Gerar JWT_SECRET forte
- [ ] Configurar domínio e hosting
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backups automáticos da BD

### 8.2 Build

- [ ] Build do frontend (`npm run build`)
- [ ] Configurar servidor para servir React build
- [ ] Testar em ambiente de produção

### 8.3 Deploy Backend

- [ ] Deploy em servidor (VPS, AWS, Azure, etc.)
- [ ] Configurar PM2 ou similar
- [ ] Configurar logs
- [ ] Configurar monitorização

### 8.4 Deploy Frontend

- [ ] Deploy em Netlify/Vercel/hosting
- [ ] Configurar redirecionamentos
- [ ] Configurar variáveis de ambiente

### 8.5 Base de Dados

- [ ] Migrar dados para BD de produção
- [ ] Configurar backups diários
- [ ] Criar utilizador Admin inicial

### 8.6 Email

- [ ] Configurar SMTP de produção
- [ ] Testar envio de emails

## 📚 FASE 9: DOCUMENTAÇÃO E FORMAÇÃO

### 9.1 Documentação

- [ ] Manual do utilizador (Admin/Gestor)
- [ ] Guia de edição de conteúdos
- [ ] FAQ
- [ ] Troubleshooting

### 9.2 Formação

- [ ] Sessão de formação para equipa CPSL
- [ ] Video tutoriais (opcional)
- [ ] Documentação de apoio

## 🔧 FASE 10: MANUTENÇÃO E MELHORIAS

### 10.1 Monitorização

- [ ] Configurar Google Analytics
- [ ] Monitorizar erros (Sentry opcional)
- [ ] Verificar logs regularmente

### 10.2 Atualizações

- [ ] Atualizar dependências regularmente
- [ ] Patches de segurança
- [ ] Novas funcionalidades conforme necessário

### 10.3 SEO

- [ ] Meta tags
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Schema markup
- [ ] Open Graph tags

## 📝 PRIORIDADES IMEDIATAS

### Alta Prioridade

1. **Setup React completo** (Fase 2)
2. **Página pública funcional** (Fase 3)
3. **Login e dashboard básico** (Fase 4.1, 4.2)
4. **Gestão de conteúdo institucional** (Fase 4.8)

### Média Prioridade

5. **Gestão de notícias** (Fase 4.6)
6. **Gestão de projetos** (Fase 4.5)
7. **Gestão de respostas sociais** (Fase 4.7)
8. **Formulário de contacto** (Fase 3.2)

### Baixa Prioridade

9. **Funcionalidades avançadas de acessibilidade** (Fase 5)
10. **Animações e detalhes visuais** (Fase 6)
11. **Gestão de utilizadores** (Fase 4.4)
12. **Transparência** (Fase 4.10)

## ⏱ ESTIMATIVA DE TEMPO

| Fase | Descrição            | Tempo Estimado |
| ---- | -------------------- | -------------- |
| 1    | Setup (✅ Concluído) | -              |
| 2    | Frontend - Estrutura | 1-2 dias       |
| 3    | Página Pública       | 4-5 dias       |
| 4    | Área Admin           | 5-7 dias       |
| 5    | Acessibilidade       | 2-3 dias       |
| 6    | Design e UX          | 2-3 dias       |
| 7    | Testes               | 2-3 dias       |
| 8    | Deploy               | 1-2 dias       |
| 9    | Documentação         | 1-2 dias       |

**Total estimado: 3-4 semanas**

## 📞 Próximos Passos

1. Rever este plano e ajustar prioridades
2. Começar pela Fase 2 (Setup do React)
3. Implementar progressivamente cada fase
4. Testar continuamente durante o desenvolvimento
5. Fazer commits regulares no Git
6. Documentar decisões importantes

---

**Nota**: Este é um guia flexível. Ajuste conforme necessário durante o desenvolvimento.
