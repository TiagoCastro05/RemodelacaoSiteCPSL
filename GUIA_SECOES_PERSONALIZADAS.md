# 📋 Guia de Implementação - Seções Personalizadas

## 1️⃣ Migrações da Base de Dados

Executa estas migrações na tua base de dados Supabase (na ordem):

### Migração 1: Adicionar coluna conteudo às respostas sociais

```sql
-- Ficheiro: database/migration-add-conteudo-respostas.sql
ALTER TABLE respostas_sociais
ADD COLUMN IF NOT EXISTS conteudo TEXT;
```

### Migração 2: Criar tabelas de seções personalizadas

```sql
-- Ficheiro: database/migration-secoes-personalizadas.sql
-- (Executar o ficheiro completo)
```

**Como executar:**

1. Acede ao Supabase SQL Editor: https://app.supabase.com/project/osmvbxwupblbkydosvqt/sql
2. Copia e cola o conteúdo de cada ficheiro .sql
3. Clica em "Run" para executar

Ou pela linha de comandos:

```powershell
# Migração 1
psql postgresql://postgres:cpslipvc@db.osmvbxwupblbkydosvqt.supabase.co:5432/postgres -f database/migration-add-conteudo-respostas.sql

# Migração 2
psql postgresql://postgres:cpslipvc@db.osmvbxwupblbkydosvqt.supabase.co:5432/postgres -f database/migration-secoes-personalizadas.sql
```

## 2️⃣ Estrutura de Tabelas Criadas

### `secoes_personalizadas`

Armazena as definições das seções customizadas:

- `id` - ID único
- `nome` - Nome interno (ex: 'galeria', 'equipa')
- `titulo` - Título exibido no site (ex: 'Galeria', 'Nossa Equipa')
- `slug` - Para âncora no site (#slug)
- `descricao` - Descrição opcional
- `icone` - Emoji ou ícone (ex: '📸', '👥')
- `ordem` - Ordem de exibição no menu
- `tipo_layout` - 'cards', 'lista', 'galeria', 'texto'
- `tem_formulario` - Se inclui formulário de contacto
- `config_formulario` - Configuração do formulário (JSON)

### `itens_secoes_personalizadas`

Armazena o conteúdo de cada seção:

- `id` - ID único
- `secao_id` - FK para secoes_personalizadas
- `titulo` - Título do item
- `subtitulo` - Subtítulo/resumo
- `conteudo` - Conteúdo HTML (rich text)
- `imagem` - URL da imagem
- `video_url` - URL de vídeo opcional
- `link_externo` - Link externo opcional
- `ordem` - Ordem de exibição

### `submissoes_formularios_secoes`

Armazena submissões de formulários:

- `id` - ID único
- `secao_id` - FK para secoes_personalizadas
- `dados` - Dados do formulário (JSON)
- `respondido` - Se foi respondido
- `resposta` - Resposta dada
- `data_submissao` - Data de submissão

## 3️⃣ Código Backend Criado

### ✅ Ficheiro: `server/routes/secoesPersonalizadas.js`

Endpoints REST para CRUD de seções:

**GET** `/api/secoes-personalizadas` - Lista todas as seções ativas
**GET** `/api/secoes-personalizadas/:id` - Obtém uma seção específica
**GET** `/api/secoes-personalizadas/:id/itens` - Lista itens de uma seção
**POST** `/api/secoes-personalizadas` - Cria nova seção
**POST** `/api/secoes-personalizadas/:id/itens` - Adiciona item a uma seção
**PUT** `/api/secoes-personalizadas/:id` - Atualiza seção
**PUT** `/api/secoes-personalizadas/:secaoId/itens/:itemId` - Atualiza item
**DELETE** `/api/secoes-personalizadas/:id` - Elimina seção (soft delete)
**DELETE** `/api/secoes-personalizadas/:secaoId/itens/:itemId` - Elimina item

### ✅ Registado em `server/server.js`

```javascript
app.use("/api/secoes-personalizadas", require("./routes/secoesPersonalizadas"));
```

## 4️⃣ Código Frontend Criado

### ✅ Página: `client/src/pages/CustomSectionsManagement.jsx`

Interface para gerir seções personalizadas:

- Listar todas as seções
- Criar nova seção
- Editar seção existente
- Eliminar seção
- Link para gerir itens de cada seção

### ✅ Página: `client/src/pages/SectionItemsManagement.jsx`

Interface para gerir conteúdo de cada seção:

- Listar itens da seção
- Criar novo item com:
  - Upload de imagem
  - Título e subtítulo
  - RichTextEditor para conteúdo
  - URL de vídeo opcional
  - Link externo opcional
- Editar item existente
- Eliminar item

### ✅ Rotas adicionadas em `client/src/pages/Dashboard.jsx`

- `/dashboard/secoes` - Gestão de seções
- `/dashboard/secoes/:secaoId/itens` - Gestão de itens

### ✅ Botão no Admin Bar

Novo botão "➕ Seções Personalizadas" na barra de administração

## 5️⃣ Como Usar

### Criar uma nova seção personalizada:

1. **Acede ao Dashboard** → Clica em "➕ Seções Personalizadas"

2. **Clica em "➕ Nova Seção"** e preenche:

   - **Título**: Nome que aparece no site (ex: "Galeria de Fotos")
   - **Nome interno**: identificador único sem espaços (ex: "galeria")
   - **Slug**: para âncora no site (ex: "galeria" → `#galeria`)
   - **Ícone**: emoji que aparece no menu (ex: 📸)
   - **Tipo de Layout**: escolhe entre:
     - **Cards** - Grade de cartões
     - **Lista** - Lista vertical
     - **Galeria** - Grade de imagens
     - **Texto** - Texto corrido
   - **Incluir formulário**: checkbox se queres formulário de contacto

3. **Adiciona conteúdo à seção**:
   - Clica no botão 📝 da seção
   - Clica em "➕ Novo Item"
   - Preenche:
     - Upload de imagem
     - Título e subtítulo
     - Conteúdo (com formatação HTML)
     - Opcionais: URL de vídeo, link externo

### A seção será automaticamente:

- ✅ Adicionada ao menu de navegação (quando implementares no Home.jsx)
- ✅ Renderizada com o layout escolhido
- ✅ Editável inline quando em modo admin
- ✅ Clicável para ver detalhes em modal

## 6️⃣ Próximos Passos (a implementar)

### TODO: Renderizar seções no site público

Precisas adicionar no `Home.jsx`:

1. **Fetch das seções**:

```javascript
const [secoesPersonalizadas, setSecoesPersonalizadas] = useState([]);

useEffect(() => {
  const fetchSecoesPersonalizadas = async () => {
    const response = await api.get("/secoes-personalizadas");
    if (response.data.success) {
      setSecoesPersonalizadas(response.data.data);
    }
  };
  fetchSecoesPersonalizadas();
}, []);
```

2. **Atualizar Header** para incluir seções dinâmicas

3. **Renderizar cada seção** com base no `tipo_layout`

## 📊 Exemplo de Uso

### Criar seção "Galeria de Fotos":

```
Título: Galeria de Fotos
Nome: galeria
Slug: galeria
Ícone: 📸
Layout: galeria
```

### Adicionar fotos:

```
Item 1:
- Imagem: [upload foto1.jpg]
- Título: Festa de Natal 2024
- Subtítulo: Celebração com a comunidade

Item 2:
- Imagem: [upload foto2.jpg]
- Título: Atividades de Verão
- Subtítulo: Passeio ao ar livre
```

## ✅ Checklist de Implementação

- [x] Criar tabelas na base de dados
- [x] Criar rotas backend
- [x] Registar rotas no server
- [x] Criar página de gestão de seções
- [x] Criar página de gestão de itens
- [x] Adicionar rotas no Dashboard
- [x] Adicionar botão no admin bar
- [ ] Executar migrações SQL
- [ ] Renderizar seções no Home.jsx
- [ ] Adicionar seções ao Header dinamicamente
- [ ] Implementar layouts diferentes (cards, lista, galeria, texto)
- [ ] Implementar formulários customizáveis

---

**Criado em:** 23 de Dezembro de 2025
**Ficheiros envolvidos:**

- Backend: `server/routes/secoesPersonalizadas.js`, `server/server.js`
- Frontend: `client/src/pages/CustomSectionsManagement.jsx`, `client/src/pages/SectionItemsManagement.jsx`, `client/src/pages/Dashboard.jsx`
- Database: `database/migration-secoes-personalizadas.sql`, `database/migration-add-conteudo-respostas.sql`
