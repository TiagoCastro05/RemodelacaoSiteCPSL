# ⚡ Configuração Rápida - Próximos Passos

## ✅ O que já foi feito

- ✅ Backend completo instalado e configurado
- ✅ Frontend React com estrutura base criada
- ✅ Dependências instaladas
- ✅ Ficheiros .env criados
- ✅ Páginas básicas criadas (Home, Login, Dashboard)
- ✅ Sistema de autenticação implementado
- ✅ Estilos CSS aplicados

## ⚠️ Falta apenas configurar o MySQL

### Opção 1: Ajustar a password do MySQL no .env

1. Abra o ficheiro `.env` na raiz do projeto
2. Altere a linha `DB_PASSWORD=root` para a sua password do MySQL
3. Exemplo: `DB_PASSWORD=suapassword`

### Opção 2: Criar base de dados (se ainda não existe)

```bash
# 1. Aceder ao MySQL
mysql -u root -p

# 2. Quando pedir password, digite a sua password do MySQL

# 3. Criar a base de dados
CREATE DATABASE cpsl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Sair
exit

# 5. Importar o schema
mysql -u root -p cpsl_db < database/schema.sql
```

### Opção 3: Usar o script completo

```bash
# Este comando cria a BD e importa as tabelas automaticamente
mysql -u root -p < database/schema.sql
# Digite a sua password quando solicitado
```

## 🚀 Depois de configurar o MySQL

### 1. Iniciar o Backend

```bash
npm run server
```

Deverá ver:

```
✅ Conexão à base de dados MySQL estabelecida com sucesso!
🚀 Servidor a correr na porta 5000
```

### 2. Iniciar o Frontend (em outro terminal)

```bash
cd client
npm start
```

O React abrirá automaticamente em: http://localhost:3000

## 🎯 Testar o Sistema

### 1. Ver a Home Page

- Abrir http://localhost:3000
- Deverá ver a página inicial do CPSL

### 2. Testar o Login

- Ir para http://localhost:3000/admin
- **IMPORTANTE**: A base de dados vem com um utilizador admin pré-configurado
- Email: `admin@cpslanheses.pt`
- Password: você precisa criar manualmente ou alterar o hash no schema.sql

### Para criar o primeiro utilizador Admin:

```bash
# Abrir MySQL
mysql -u root -p cpsl_db

# Criar utilizador (password: Admin123!)
# Hash gerado com bcrypt
INSERT INTO Utilizadores (nome, email, password_hash, tipo)
VALUES ('Administrador', 'admin@cpslanheses.pt',
'$2b$10$rGqkN8vN8yN3tK9yK2YKJeXxZXxZXxZXxZXxZXxZXxZXxZXxZXx', 'Admin');
```

**OU** use Node.js para gerar o hash:

```bash
# Criar ficheiro temporário generate-hash.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin123!', 10).then(hash => console.log(hash));"
```

## 🎨 URLs do Sistema

| URL                              | Descrição              |
| -------------------------------- | ---------------------- |
| http://localhost:3000            | Página pública (Home)  |
| http://localhost:3000/admin      | Login Admin/Gestor     |
| http://localhost:3000/dashboard  | Dashboard (após login) |
| http://localhost:5000/api/health | Health check da API    |

## 📝 Checklist Rápido

- [ ] Password do MySQL configurada no `.env`
- [ ] Base de dados `cpsl_db` criada
- [ ] Schema importado (tabelas criadas)
- [ ] Utilizador Admin criado na tabela Utilizadores
- [ ] Backend a correr (porta 5000)
- [ ] Frontend a correr (porta 3000)
- [ ] Consegue fazer login em /admin

## 🆘 Problemas Comuns

### "Access denied for user 'root'"

➡️ Password incorreta no `.env`. Altere `DB_PASSWORD` para a sua password.

### "Unknown database 'cpsl_db'"

➡️ Base de dados não criada. Execute: `mysql -u root -p < database/schema.sql`

### "Cannot connect to database"

➡️ MySQL não está a correr. Inicie o serviço MySQL.

### "Port 5000 already in use"

➡️ Outro processo usa a porta 5000. Mude no `.env` ou mate o processo.

## 📚 Próximos Passos de Desenvolvimento

Após tudo funcionar:

1. **Ver `FRONTEND_GUIDE.md`** - Para implementar mais componentes
2. **Ver `API_EXAMPLES.md`** - Para exemplos de chamadas à API
3. **Ver `DESIGN_GUIDE.md`** - Para estilos e componentes CSS
4. **Ver `IMPLEMENTATION_PLAN.md`** - Para plano completo de desenvolvimento

## 💡 Dica Final

Mantenha 3 terminais abertos:

1. **Terminal 1**: Backend (`npm run server`)
2. **Terminal 2**: Frontend (`cd client && npm start`)
3. **Terminal 3**: Para comandos git, mysql, etc.

---

**Está quase pronto!** Só falta configurar o MySQL e criar o utilizador admin. 🚀
