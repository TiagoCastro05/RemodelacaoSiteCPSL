# 🔧 GUIA DE RESOLUÇÃO - Base de Dados e Login

## ❌ Problema: "Erro ao conectar à base de dados"

### Passo 1: Verificar se o MySQL está instalado e a correr

Abra o PowerShell como Administrador e execute:

```powershell
# Verificar se o MySQL está a correr
Get-Service -Name "MySQL*"
```

**Se aparecer "Running"** ✅ - O MySQL está a correr
**Se aparecer "Stopped"** ❌ - Precisa iniciar o serviço

#### Iniciar o serviço MySQL:

```powershell
# Iniciar o MySQL
Start-Service -Name "MySQL80"  # ou MySQL81, MySQL57, etc.
```

### Passo 2: Verificar a password do MySQL

O ficheiro `.env` está configurado com password vazia (`DB_PASSWORD=`).

**Se o seu MySQL tem password**, edite o ficheiro `.env` na raiz do projeto:

```env
DB_PASSWORD=sua_password_aqui
```

### Passo 3: Criar a Base de Dados

Depois de ter o MySQL a correr, precisa criar a base de dados e as tabelas:

#### Opção A: Usando MySQL Workbench (Recomendado)

1. Abra o MySQL Workbench
2. Conecte-se ao servidor local
3. Vá a **File > Open SQL Script**
4. Selecione o ficheiro `database/schema.sql`
5. Clique em **Execute** (⚡ ícone do raio)

#### Opção B: Usando linha de comandos

```powershell
# Na pasta do projeto
cd C:\ECGM\PROJETO\RemodelacaoCPSL

# Executar o schema
mysql -u root -p < database/schema.sql
# (Digite a password do MySQL quando solicitado)
```

### Passo 4: Verificar se a base de dados foi criada

```sql
-- No MySQL Workbench ou linha de comandos
SHOW DATABASES;
USE cpsl_db;
SHOW TABLES;
```

Deve ver estas tabelas:

- Utilizadores
- Projetos
- Respostas_Sociais
- Noticias
- Conteudo_Institucional
- Contactos_Institucionais
- Media
- Transparencia
- Contactos_Mensagens

---

## 🔐 CREDENCIAIS DE LOGIN

### Utilizador Admin Padrão

Depois de executar o `schema.sql`, já existe um utilizador admin criado automaticamente:

```
Email: admin@cpslanheses.pt
Password: Admin123!
```

### Como Aceder ao Dashboard

1. Inicie o servidor: `npm run server`
2. Inicie o cliente: `cd client && npm start`
3. No browser, vá para: `http://localhost:3000`
4. Clique em "Admin" ou vá para: `http://localhost:3000/admin`
5. Use as credenciais acima

---

## 🔑 Criar Nova Password para o Admin

Se quiser alterar a password padrão, use o script `generate-admin-hash.js`:

```powershell
# Gerar hash para uma nova password
node generate-admin-hash.js MinhaNovaPassword123!
```

Copie o hash gerado e execute no MySQL:

```sql
UPDATE Utilizadores
SET password_hash = 'COLE_O_HASH_AQUI'
WHERE email = 'admin@cpslanheses.pt';
```

---

## ✅ Checklist Completo

- [ ] MySQL instalado e a correr
- [ ] Password do MySQL configurada no `.env`
- [ ] Base de dados `cpsl_db` criada
- [ ] Tabelas criadas (executar `schema.sql`)
- [ ] Utilizador admin criado automaticamente
- [ ] Servidor backend a correr (`npm run server`)
- [ ] Cliente frontend a correr (`npm start` na pasta client)

---

## 🆘 Ainda com problemas?

### Erro: "Access denied for user 'root'@'localhost'"

- Verifique a password no `.env`
- Tente resetar a password do MySQL root

### Erro: "Unknown database 'cpsl_db'"

- Execute o ficheiro `database/schema.sql`

### Erro: "Can't connect to MySQL server"

- Verifique se o serviço MySQL está a correr
- Verifique se a porta 3306 está livre

### Erro: "EADDRINUSE: address already in use"

- A porta 5000 já está em uso
- Pare o processo anterior ou altere a porta no `.env`

---

## 📞 Credenciais em Resumo

| Campo         | Valor                       |
| ------------- | --------------------------- |
| **URL Admin** | http://localhost:3000/admin |
| **Email**     | admin@cpslanheses.pt        |
| **Password**  | Admin123!                   |
| **Tipo**      | Admin                       |

**IMPORTANTE:** Altere a password padrão após o primeiro login!
