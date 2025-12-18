# ⚡ RESOLUÇÃO RÁPIDA DOS ERROS

## ❌ Erro: "Erro ao conectar à base de dados"

### Causa

O MySQL não está instalado ou não está a correr no seu computador.

### Solução Rápida

#### 1️⃣ Instalar o MySQL

- Baixe: https://dev.mysql.com/downloads/installer/
- Escolha: **"mysql-installer-community"** (~400MB)
- Instale com tipo: **"Developer Default"**
- Crie uma password para o root (ex: `MySQLRoot2025!`)

📖 **Guia detalhado:** Veja [INSTALAR_MYSQL.md](INSTALAR_MYSQL.md)

#### 2️⃣ Configurar Password no Projeto

Edite o ficheiro `.env` na raiz do projeto:

```env
DB_PASSWORD=SUA_PASSWORD_MYSQL_AQUI
```

#### 3️⃣ Criar a Base de Dados

No **MySQL Workbench**:

- File > Open SQL Script
- Selecione: `database/schema.sql`
- Execute (⚡)

Ou via **linha de comandos**:

```powershell
mysql -u root -p < database/schema.sql
```

#### 4️⃣ Reiniciar o Servidor

```powershell
npm run server
```

✅ Deve aparecer: "Conexão à base de dados MySQL estabelecida com sucesso!"

---

## 🔐 Credenciais de Login

### Onde fazer login?

```
URL: http://localhost:3000/admin
```

### Qual o email e password?

```
Email: admin@cpslanheses.pt
Password: Admin123!
```

Estas credenciais são criadas automaticamente quando executa o `schema.sql`.

---

## 🎯 Ordem dos Passos Completa

1. ✅ Instalar MySQL Server
2. ✅ Configurar password do MySQL
3. ✅ Editar `.env` com a password
4. ✅ Executar `database/schema.sql`
5. ✅ Executar `npm run server`
6. ✅ Executar `cd client && npm start`
7. ✅ Aceder a `http://localhost:3000/admin`
8. ✅ Login com `admin@cpslanheses.pt` / `Admin123!`

---

## 📞 Ainda com problemas?

Veja os guias detalhados:

- [INSTALAR_MYSQL.md](INSTALAR_MYSQL.md) - Instalação do MySQL
- [RESOLVER_PROBLEMAS.md](RESOLVER_PROBLEMAS.md) - Troubleshooting completo
