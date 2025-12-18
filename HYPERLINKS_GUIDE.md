# 🔗 Guia de Hiperligações em Projetos

## ⚠️ IMPORTANTE: Executar Migração da Base de Dados

Antes de usar esta funcionalidade, **é necessário** executar a migração da base de dados para adicionar o campo `url_externa` à tabela Projetos.

### Como Executar a Migração:

#### Opção 1: MySQL Workbench

1. Abra o MySQL Workbench
2. Conecte-se ao servidor
3. Vá a **File > Open SQL Script**
4. Selecione: `database/migration_add_project_url.sql`
5. Clique em **Execute** (⚡)

#### Opção 2: Linha de Comandos

```powershell
mysql -u root -p cpsl_db < database/migration_add_project_url.sql
```

---

## ✨ Funcionalidade

Agora os projetos podem ter **hiperligações** (links externos) que redirecionam o visitante para uma página específica do projeto.

---

## 🎯 Como Usar

### 1. Adicionar Link a um Projeto

**No Dashboard:**

1. Vá para **Dashboard > Projetos**
2. Clique em **"+ Novo Projeto"** ou **"✏️ Editar"** num projeto existente
3. Preencha o campo **"🔗 Link do Projeto (Hiperligação)"**
   - Exemplo: `https://www.exemplo.com/projeto-elisa`
   - Exemplo: `https://youtube.com/watch?v=abc123`
4. Clique em **"Criar Projeto"** ou **"Atualizar Projeto"**

### 2. Indicadores Visuais

Quando um projeto tem uma hiperligação, você verá:

- **🔗 Ícone ao lado do título** do projeto
- **Card clicável** com cursor de pointer
- **Tooltip "🔗 Clique para visitar"** ao passar o mouse
- **Botão 🔗 azul** nos controles do projeto
- **Borda azul** ao passar o mouse sobre o card

### 3. Como Funciona para os Visitantes

Os visitantes podem:

- **Clicar em qualquer lugar do card** do projeto → Abre o link em nova aba
- **Clicar na imagem** do projeto → Abre o link em nova aba
- Ver o **ícone 🔗** indicando que há um link disponível

---

## 🎨 Exemplos de Uso

### Exemplo 1: Link para Página de Projeto

```
Título: Plataforma Elisa
Link: https://www.plataformaelisa.pt
```

→ Visitantes vão direto para o site da Plataforma Elisa

### Exemplo 2: Link para Vídeo do YouTube

```
Título: Vídeo do Projeto
Link: https://www.youtube.com/watch?v=abc123
```

→ Visitantes assistem ao vídeo do projeto

### Exemplo 3: Link para Documento PDF

```
Título: Relatório do Projeto
Link: https://exemplo.com/relatorio.pdf
```

→ Visitantes fazem download do relatório

### Exemplo 4: Link para Notícia

```
Título: Projeto na Imprensa
Link: https://jornal.com/noticia-projeto
```

→ Visitantes leem a notícia completa

---

## ⚙️ Configurações

### Projeto SEM hiperligação:

- Card **não clicável**
- **Sem** ícone 🔗
- **Sem** botão de link nos controles
- Cursor normal

### Projeto COM hiperligação:

- Card **clicável**
- Ícone **🔗** no título (animado)
- **Botão 🔗** azul nos controles
- Tooltip ao passar o mouse
- Borda azul ao hover
- Link abre em **nova aba**

---

## 🔧 Editar/Remover Link

### Para Alterar um Link:

1. Clique em **✏️ Editar** no projeto
2. Modifique o campo **"Link do Projeto"**
3. Clique em **"Atualizar Projeto"**

### Para Remover um Link:

1. Clique em **✏️ Editar** no projeto
2. **Apague** o conteúdo do campo "Link do Projeto"
3. Clique em **"Atualizar Projeto"**

O projeto deixará de ser clicável.

---

## 🎨 Interface Visual

### Card de Projeto COM Link:

```
┌─────────────────────────────┐
│  [Imagem do Projeto]        │ ← Clicável
│  🔗 Clique para visitar     │ ← Tooltip ao hover
├─────────────────────────────┤
│  Título do Projeto 🔗       │ ← Ícone animado
│  Descrição...               │
│  🗓️ Datas                  │
├─────────────────────────────┤
│  🔗 ✏️ 👁️ 🗑️               │ ← Botão de link
└─────────────────────────────┘
      ↑ Borda azul ao hover
```

---

## 🚀 Funcionalidades Técnicas

### Frontend:

- ✅ Campo URL no formulário de criação/edição
- ✅ Validação de URL
- ✅ Card clicável com `onClick`
- ✅ Indicador visual com ícone 🔗
- ✅ Tooltip informativo
- ✅ Botão direto para o link
- ✅ Prevenção de propagação de eventos nos botões
- ✅ Abertura em nova aba (`target="_blank"`)
- ✅ Segurança com `rel="noopener noreferrer"`

### Backend:

- ✅ Campo `url_externa` na tabela Projetos
- ✅ Suporte em rotas POST e PUT
- ✅ Validação de dados

---

## 📝 Boas Práticas

### ✅ DO (Fazer):

- Use URLs completas com `https://`
- Teste o link antes de salvar
- Use links de sites confiáveis
- Adicione descrição clara do projeto

### ❌ DON'T (Não Fazer):

- Não use links quebrados
- Não use URLs sem `https://`
- Não use links de sites suspeitos
- Não esqueça de testar após salvar

---

## 🔍 Verificação

Após adicionar um link, verifique:

1. **No Dashboard:**

   - [ ] Ícone 🔗 aparece no título
   - [ ] Botão 🔗 aparece nos controles
   - [ ] Card muda cursor para pointer
   - [ ] Tooltip aparece ao hover

2. **Ao Clicar:**
   - [ ] Link abre em nova aba
   - [ ] URL está correta
   - [ ] Página carrega corretamente

---

## 💡 Dicas

- **Para Projetos em Desenvolvimento:** Pode usar links temporários
- **Para Projetos Concluídos:** Use links permanentes
- **Sem Página Específica?** Pode deixar o campo vazio
- **Múltiplos Links?** Escolha o mais relevante

---

## ✅ Resumo Rápido

| Ação                | Como Fazer                        |
| ------------------- | --------------------------------- |
| **Adicionar link**  | Preencher campo "Link do Projeto" |
| **Ver se tem link** | Procurar ícone 🔗 no título       |
| **Testar link**     | Clicar no botão 🔗 azul           |
| **Remover link**    | Apagar conteúdo do campo          |
| **Visitar projeto** | Clicar em qualquer parte do card  |

---

🎉 **Funcionalidade de hiperligações implementada com sucesso!**
