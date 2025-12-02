# 🚀 Como Começar - Próximos Passos

## ✅ O que já está pronto

### Backend (100% Completo)

- ✅ Base de dados MySQL com schema completo
- ✅ Servidor Node.js/Express configurado
- ✅ Sistema de autenticação JWT
- ✅ Todas as rotas API implementadas:
  - Autenticação (login, logout, change password)
  - Utilizadores (CRUD - Admin apenas)
  - Projetos (CRUD)
  - Notícias/Eventos (CRUD)
  - Respostas Sociais (CRUD)
  - Transparência (upload PDFs)
  - Contactos (GET info + enviar formulário)
  - Mensagens (listar, responder, eliminar)
  - Media (upload, GET, DELETE)
  - Conteúdo Institucional (GET, UPDATE)
- ✅ Upload de ficheiros (imagens, vídeos, PDFs)
- ✅ Sistema de emails (nodemailer)
- ✅ Middleware de segurança (helmet, cors, rate-limit)
- ✅ Validação de inputs

### Frontend (Estrutura Base)

- ✅ Projeto React criado (`client/`)
- ✅ Estrutura de pastas definida

### Documentação

- ✅ README.md principal
- ✅ FRONTEND_GUIDE.md (guia completo do frontend)
- ✅ API_EXAMPLES.md (exemplos de uso da API)
- ✅ DESIGN_GUIDE.md (paleta de cores, componentes CSS)
- ✅ TROUBLESHOOTING.md (resolução de problemas)
- ✅ IMPLEMENTATION_PLAN.md (plano faseado)

## 🎯 Próximos Passos (Por Ordem)

### 1️⃣ Configurar Ambiente de Desenvolvimento

```bash
# 1. Copiar .env.example para .env
cp .env.example .env

# 2. Editar .env com as suas configurações:
#    - DB_PASSWORD (password do MySQL)
#    - JWT_SECRET (gerar chave forte)
#    - EMAIL_* (configurações de email)

# 3. Criar base de dados
mysql -u root -p < database/schema.sql

# 4. Instalar dependências
npm run install-all
```

### 2️⃣ Testar Backend

```bash
# Iniciar servidor
npm run server

# Testar health check
# Abrir no browser: http://localhost:5000/api/health

# Deverá ver: {"success": true, "message": "API CPSL a funcionar!"}
```

### 3️⃣ Implementar Frontend Básico

Siga o guia em `FRONTEND_GUIDE.md`. Começar por:

1. **Configurar serviços API** (`client/src/services/api.js`)
2. **Criar Contexts** (AuthContext, AccessibilityContext)
3. **Criar página de Login** (`client/src/pages/Login.jsx`)
4. **Criar layout da Home** (`client/src/pages/Home.jsx`)

```bash
# Instalar dependências adicionais do React
cd client
npm install react-router-dom axios react-icons

# Iniciar desenvolvimento
npm start
```

### 4️⃣ Implementar Página Pública (Home)

Componentes prioritários:

1. Navbar com menu de navegação
2. Hero Section (início)
3. Sobre Nós (instituição)
4. Respostas Sociais
5. Projetos
6. Notícias
7. Contactos (com formulário)
8. Footer

### 5️⃣ Implementar Dashboard Admin

Componentes prioritários:

1. Login funcional
2. Dashboard layout (sidebar + header)
3. Gestão de Conteúdo Institucional
4. Gestão de Notícias
5. Gestão de Projetos
6. Gestão de Mensagens

### 6️⃣ Adicionar Acessibilidade

1. Menu de acessibilidade fixo
2. Controle de tamanho de fonte
3. Alto contraste
4. Navegação por teclado

### 7️⃣ Testes e Ajustes

1. Testar em diferentes browsers
2. Testar responsividade
3. Validar acessibilidade
4. Corrigir bugs

### 8️⃣ Deploy

Ver `TROUBLESHOOTING.md` para guia de deploy.

## 📚 Documentos Importantes

| Ficheiro                 | Descrição                                    |
| ------------------------ | -------------------------------------------- |
| `README.md`              | Visão geral do projeto                       |
| `FRONTEND_GUIDE.md`      | Guia completo de implementação do frontend   |
| `API_EXAMPLES.md`        | Exemplos de como usar cada endpoint da API   |
| `DESIGN_GUIDE.md`        | Paleta de cores, tipografia, componentes CSS |
| `TROUBLESHOOTING.md`     | Resolução de problemas comuns                |
| `IMPLEMENTATION_PLAN.md` | Plano detalhado por fases                    |
| `database/schema.sql`    | Schema completo da base de dados             |

## 🎨 Design

O design está baseado no protótipo Figma: https://www.figma.com/proto/xdeBckOXYVCYd7C5jvu1gI/

**Cores principais:**

- Primária (Laranja): `#FF9966`
- Fundo: `#FFE9D9` (laranja claro)
- Texto: `#333333`

Ver `DESIGN_GUIDE.md` para paleta completa e componentes CSS prontos.

## 🔐 Segurança

**IMPORTANTE:**

1. **Nunca** fazer commit do ficheiro `.env`
2. Alterar `JWT_SECRET` para uma chave forte em produção
3. Usar passwords fortes para MySQL e utilizadores
4. Configurar HTTPS em produção
5. Fazer backups regulares da base de dados

## 📝 Estrutura da Base de Dados

### Tabelas Criadas:

1. **Utilizadores** - Admin e Gestores
2. **Projetos** - Projetos da instituição
3. **Respostas_Sociais** - Serviços oferecidos (ERPI, Centro de Dia, etc.)
4. **Transparencia** - Relatórios e documentos PDF
5. **Noticias_Eventos** - Notícias e eventos
6. **Media** - Imagens, vídeos, PDFs associados
7. **Form_Contacto** - Mensagens do formulário de contacto
8. **Conteudo_Institucional** - Conteúdo das seções (Sobre Nós, Valores, etc.)
9. **Contactos_Institucionais** - Morada, telefone, email, horário

## 🎯 Funcionalidades Principais

### Para Visitantes (Público)

- Visualizar todas as informações institucionais
- Ver projetos e respostas sociais
- Ler notícias e eventos
- Enviar mensagem via formulário
- Aceder a documentos de transparência
- Ajustar acessibilidade (contraste, fonte)

### Para Admin/Gestor (Autenticado)

- Editar todo o conteúdo do site
- Criar/editar/eliminar notícias
- Criar/editar/eliminar projetos
- Gerir respostas sociais
- Upload de imagens/vídeos/PDFs
- Responder a mensagens de contacto
- Upload de relatórios de transparência

### Apenas Admin

- Criar/editar/eliminar utilizadores (Gestores e Admins)

## 🛠 Comandos Úteis

```bash
# Desenvolvimento (backend + frontend)
npm run dev

# Apenas backend
npm run server

# Apenas frontend
cd client && npm start

# Build produção
npm run build

# Criar base de dados
mysql -u root -p < database/schema.sql

# Backup base de dados
mysqldump -u root -p cpsl_db > backup.sql
```

## 💡 Dicas

1. **Commits frequentes**: Fazer commits regulares no Git
2. **Testar continuamente**: Testar cada funcionalidade à medida que implementa
3. **Mobile First**: Começar pelo design mobile
4. **Documentar**: Comentar código complexo
5. **Seguir o plano**: Ver `IMPLEMENTATION_PLAN.md` para ordem de implementação

## 🆘 Precisa de Ajuda?

1. Ver `TROUBLESHOOTING.md` para problemas comuns
2. Ver `API_EXAMPLES.md` para exemplos de código
3. Ver `FRONTEND_GUIDE.md` para estrutura do React
4. Ver `DESIGN_GUIDE.md` para estilos CSS prontos

## 📞 Checklist Antes de Começar

- [ ] MySQL instalado e a correr
- [ ] Node.js instalado (v16+)
- [ ] Git configurado
- [ ] Editor de código (VS Code recomendado)
- [ ] Ficheiro `.env` configurado
- [ ] Base de dados criada
- [ ] Dependências instaladas (`npm run install-all`)
- [ ] Servidor backend a funcionar (http://localhost:5000/api/health)
- [ ] React a funcionar (http://localhost:3000)

## 🎉 Está Pronto!

Tudo está configurado e pronto para começar o desenvolvimento do frontend!

**Sugestão**: Comece pelo `FRONTEND_GUIDE.md` e implemente os componentes na ordem sugerida no `IMPLEMENTATION_PLAN.md`.

Boa sorte com o desenvolvimento! 🚀
