# 👥 Guia de Gestão de Utilizadores

## 📋 Visão Geral

O sistema agora permite que o **Admin** crie, gerencie e elimine contas de utilizadores diretamente no Dashboard.

## 🔐 Acesso

Apenas utilizadores com tipo **Admin** têm acesso à gestão de utilizadores.

**Localização:** Dashboard > Utilizadores

---

## ✨ Funcionalidades

### 1️⃣ Criar Novo Utilizador

1. No Dashboard, clique em **"Utilizadores"** no menu lateral
2. Clique no botão **"+ Novo Utilizador"**
3. Preencha o formulário:
   - **Nome**: Nome completo do utilizador
   - **Email**: Email válido (será usado para login)
   - **Password**: Mínimo 6 caracteres
   - **Tipo**: Escolha entre:
     - **Admin**: Acesso total ao sistema
     - **Gestor**: Acesso limitado (sem gestão de utilizadores)
4. Clique em **"Criar Utilizador"**

### 2️⃣ Visualizar Utilizadores

A tabela mostra todos os utilizadores com as seguintes informações:

- Nome
- Email
- Tipo (Admin/Gestor)
- Estado (Ativo/Inativo)
- Data de criação
- Quem criou o utilizador

### 3️⃣ Ativar/Desativar Utilizador

- Clique no ícone **🔒** (cadeado) para desativar um utilizador ativo
- Clique no ícone **🔓** (cadeado aberto) para ativar um utilizador inativo

**Nota:** Utilizadores inativos não conseguem fazer login no sistema.

### 4️⃣ Eliminar Utilizador

1. Clique no ícone **🗑️** (lixeira) ao lado do utilizador
2. Confirme a ação na janela de confirmação

**⚠️ ATENÇÃO:** Esta ação é irreversível!

---

## 🛡️ Regras de Segurança

### Proteções Implementadas

1. **Auto-proteção**:

   - O admin não pode eliminar a sua própria conta
   - O admin não pode desativar a sua própria conta

2. **Validações**:

   - Email deve ser único no sistema
   - Password mínima de 6 caracteres
   - Todos os campos são obrigatórios

3. **Permissões**:
   - Apenas Admin pode aceder à gestão de utilizadores
   - Gestores não veem esta opção no menu

---

## 🎯 Tipos de Utilizadores

### Admin

- Acesso total ao Dashboard
- Pode criar, editar e eliminar utilizadores
- Pode gerir todo o conteúdo do site
- Acesso à gestão de transparência

### Gestor

- Acesso limitado ao Dashboard
- Pode gerir:
  - Conteúdo Institucional
  - Projetos
  - Notícias
  - Respostas Sociais
  - Mensagens
- **Não pode** gerir utilizadores

---

## 📊 Interface da Tabela

### Badges de Tipo

- 🔵 **Admin**: Badge azul
- 🟣 **Gestor**: Badge roxo

### Badges de Estado

- 🟢 **Ativo**: Verde - Utilizador pode fazer login
- 🔴 **Inativo**: Vermelho - Utilizador bloqueado

---

## 🔄 Fluxo de Trabalho Recomendado

### Criar Novo Membro da Equipa

1. Criar conta com tipo **Gestor**
2. Fornecer as credenciais ao novo utilizador
3. O utilizador deve alterar a password no primeiro login (funcionalidade futura)

### Desativar Conta Temporariamente

- Use o botão de ativar/desativar (🔒/🔓)
- Útil para férias, ausências temporárias, etc.

### Remover Utilizador

- Use apenas quando o utilizador sair definitivamente da organização
- Considere desativar em vez de eliminar para manter histórico

---

## 🚀 Como Usar

### Aceder à Gestão de Utilizadores

```
1. Login: http://localhost:3000/admin
2. Email: admin@cpslanheses.pt
3. Password: Admin123!
4. Dashboard > Utilizadores
```

### Criar Primeiro Gestor

```
Nome: João Silva
Email: joao.silva@cpslanheses.pt
Password: Gestor123!
Tipo: Gestor
```

---

## 📱 Responsividade

A interface é totalmente responsiva:

- **Desktop**: Tabela completa com todas as colunas
- **Tablet**: Tabela com scroll horizontal
- **Mobile**: Formulário otimizado para ecrãs pequenos

---

## 🐛 Mensagens de Erro Comuns

### "Email já está em uso"

**Causa:** Já existe um utilizador com esse email
**Solução:** Use um email diferente

### "Password deve ter pelo menos 6 caracteres"

**Causa:** Password muito curta
**Solução:** Use uma password mais forte

### "Não pode eliminar a sua própria conta"

**Causa:** Admin tentou eliminar-se a si próprio
**Solução:** Peça a outro admin para fazer esta operação

### "Erro ao conectar à base de dados"

**Causa:** Supabase não está acessível ou DATABASE_URL incorreta
**Solução:** Verifique conexão à internet e DATABASE_URL no ficheiro .env

---

## 🔒 Boas Práticas de Segurança

1. **Passwords Fortes**:

   - Mínimo 8 caracteres
   - Incluir letras maiúsculas e minúsculas
   - Incluir números
   - Incluir caracteres especiais

2. **Gestão de Contas**:

   - Revise regularmente os utilizadores ativos
   - Desative contas de pessoas que saíram
   - Limite o número de admins (recomendado: 2-3)

3. **Auditoria**:
   - O sistema regista quem criou cada utilizador
   - Use esta informação para rastreabilidade

---

## 🎨 Personalização Futura

Funcionalidades que podem ser adicionadas:

- [ ] Editar utilizadores existentes
- [ ] Alterar password de utilizadores
- [ ] Forçar alteração de password no primeiro login
- [ ] Log de atividades dos utilizadores
- [ ] Permissões granulares por módulo
- [ ] Recuperação de password por email

---

## 📞 Resumo Rápido

| Ação                 | Como Fazer                                   |
| -------------------- | -------------------------------------------- |
| **Criar utilizador** | Dashboard > Utilizadores > + Novo Utilizador |
| **Ver todos**        | Dashboard > Utilizadores                     |
| **Desativar**        | Clicar no 🔒                                 |
| **Ativar**           | Clicar no 🔓                                 |
| **Eliminar**         | Clicar no 🗑️ e confirmar                     |

---

✅ **Sistema de gestão de utilizadores totalmente funcional e pronto a usar!**
