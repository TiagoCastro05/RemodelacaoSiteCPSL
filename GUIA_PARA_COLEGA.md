# 🚀 Guia para o Colega Trabalhar no Projeto

## ✅ O Que Está Pronto

- ✅ Base de dados PostgreSQL no Supabase (sempre ativa 24/7)
- ✅ Todas as tabelas criadas
- ✅ Dados migrados (projetos, utilizadores, contactos)
- ✅ Código adaptado para PostgreSQL

---

## 📋 Passos para o Colega Configurar

### **1. Clonar/Receber o Projeto**

Partilha o projeto via Git, Dropbox, OneDrive, etc.

### **2. Instalar Dependências**

```powershell
# Na pasta do projeto
cd caminho\do\projeto

# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do cliente
cd ../client
npm install
```

### **3. Configurar .env**

O colega deve criar o arquivo `.env` na pasta `server` com:

```env
DATABASE_URL=postgresql://postgres:cpslipvc@db.osmvbxwupblbkydosvqt.supabase.co:5432/postgres

JWT_SECRET=cpsl_lanheses_super_secret_key_2025
PORT=5000
```

**⚠️ IMPORTANTE:** A `DATABASE_URL` é a MESMA para ambos! Assim ambos acedem à mesma base de dados.

### **4. Iniciar o Projeto**

**Terminal 1 - Servidor (Backend):**

```powershell
cd server
npm run dev
```

Deve aparecer: `✅ Conexão à base de dados PostgreSQL (Supabase) estabelecida com sucesso!`

**Terminal 2 - Cliente (Frontend):**

```powershell
cd client
npm start
```

O site abre em `http://localhost:3000`

---

## 🔐 Credenciais de Acesso

**Admin:**

- Email: `admin@cpslanheses.pt`
- Password: `Admin123!`

**Gestor (Tiago):**

- Email: `tiago@gmail.com`
- Password: (a password que definiste)

---

## 🎯 Vantagens desta Configuração

✅ **Ambos trabalham na mesma BD** - Mudanças aparecem em tempo real
✅ **Sem XAMPP** - Não precisa MySQL local
✅ **Sempre ativo** - Base de dados 24/7 online
✅ **Backups automáticos** - Supabase faz backups
✅ **Interface web** - Podem ver/editar dados no dashboard Supabase

---

## 🔧 Supabase Dashboard

Ambos podem aceder ao dashboard:

1. Login em [supabase.com](https://supabase.com)
2. Aceder ao projeto
3. **Table Editor** - Ver/editar dados
4. **SQL Editor** - Executar queries

---

## 📦 Arquivos Importantes

- `server/.env` - Configurações (DATABASE_URL, JWT_SECRET)
- `server/config/database.js` - Conexão PostgreSQL
- `database/schema-supabase.sql` - Estrutura das tabelas
- `database/dados-supabase.sql` - Dados iniciais

---

## 🆘 Troubleshooting

**Erro: "Cannot connect to database"**

- Verifica se DATABASE_URL está no `.env`
- Verifica conexão à internet

**Erro: "Port 5000 already in use"**

- Outro processo está usando a porta 5000
- Fecha outros servidores ou muda PORT no `.env`

**Erro: "npm install falhou"**

- Apaga `node_modules` e `package-lock.json`
- Executa `npm install` novamente

---

## 💡 Dicas de Trabalho Colaborativo

1. **Comunicar mudanças** - Avisem-se quando fizerem alterações grandes
2. **Git é essencial** - Usem Git para partilhar código
3. **Testar antes de commitar** - Certifiquem-se que funciona
4. **Supabase = Produção** - Cuidado ao apagar/alterar dados

---

**🎉 Está tudo pronto! O colega já pode trabalhar no projeto!**
