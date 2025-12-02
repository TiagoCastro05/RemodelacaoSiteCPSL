# Comandos Úteis e Troubleshooting

## 📦 Instalação e Setup

### Primeira instalação completa

```bash
# 1. Copiar ficheiro de ambiente
cp .env.example .env

# 2. Editar .env com as suas configurações
# (usar um editor de texto)

# 3. Instalar dependências backend e frontend
npm run install-all

# 4. Criar base de dados MySQL
mysql -u root -p < database/schema.sql

# 5. Iniciar ambos os servidores
npm run dev
```

### Instalar apenas backend

```bash
npm install
```

### Instalar apenas frontend

```bash
cd client
npm install
```

## 🚀 Comandos de Execução

### Modo desenvolvimento (backend + frontend simultaneamente)

```bash
npm run dev
```

### Apenas servidor backend

```bash
npm run server
```

### Apenas cliente React

```bash
npm run client
```

### Modo produção

```bash
# Build do frontend
npm run build

# Iniciar servidor
npm start
```

## 🗄 Base de Dados

### Criar base de dados

```bash
mysql -u root -p < database/schema.sql
```

### Aceder à base de dados

```bash
mysql -u root -p cpsl_db
```

### Ver tabelas

```sql
SHOW TABLES;
```

### Ver estrutura de uma tabela

```sql
DESCRIBE Utilizadores;
```

### Eliminar e recriar base de dados (CUIDADO!)

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS cpsl_db;"
mysql -u root -p < database/schema.sql
```

### Backup da base de dados

```bash
mysqldump -u root -p cpsl_db > backup_cpsl_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
mysql -u root -p cpsl_db < backup_cpsl_20250102.sql
```

### Criar utilizador Admin manualmente (se necessário)

```sql
INSERT INTO Utilizadores (nome, email, password_hash, tipo)
VALUES ('Admin', 'admin@cpslanheses.pt', '$2b$10$YourHashHere', 'Admin');
```

Para gerar hash de password em Node.js:

```javascript
const bcrypt = require("bcryptjs");
const password = "SuaPasswordAqui";
bcrypt.hash(password, 10).then((hash) => console.log(hash));
```

## 🐛 Troubleshooting

### Problema: "Cannot connect to database"

**Solução:**

1. Verificar se o MySQL está a correr:

```bash
# Windows
Get-Service MySQL* | Select-Object Name, Status

# Iniciar MySQL se necessário
Start-Service MySQL80
```

2. Verificar credenciais no `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_password
DB_NAME=cpsl_db
```

3. Testar conexão manualmente:

```bash
mysql -u root -p -h localhost
```

### Problema: "Port 5000 already in use"

**Solução:**

```bash
# Ver processo na porta 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Matar processo (substituir PID)
Stop-Process -Id PID -Force

# OU alterar porta no .env
PORT=5001
```

### Problema: "Port 3000 already in use" (React)

**Solução:**

```bash
# Ver e matar processo na porta 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id PID -Force

# OU quando iniciar, React perguntará se quer usar outra porta
```

### Problema: "Module not found"

**Solução:**

```bash
# Reinstalar dependências backend
rm -rf node_modules
npm install

# Reinstalar dependências frontend
cd client
rm -rf node_modules
npm install
```

### Problema: "Token expired" ou "Unauthorized"

**Solução:**

1. Limpar localStorage no browser (F12 > Application > Local Storage)
2. Fazer login novamente
3. Verificar se JWT_SECRET está definido no `.env`

### Problema: Upload de ficheiros não funciona

**Solução:**

1. Verificar se pasta `uploads` existe:

```bash
mkdir uploads
mkdir uploads/imagens
mkdir uploads/videos
mkdir uploads/pdfs
```

2. Verificar permissões da pasta (Linux/Mac):

```bash
chmod 755 uploads
```

3. Verificar MAX_FILE_SIZE no `.env`

### Problema: Emails não são enviados

**Solução:**

1. Verificar configurações de email no `.env`:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_app_password
```

2. Para Gmail, criar App Password:
   - Google Account > Security > 2-Step Verification > App passwords

### Problema: CORS Error

**Solução:**
Verificar se CLIENT_URL no backend corresponde ao URL do frontend:

```
# No .env do servidor
CLIENT_URL=http://localhost:3000
```

### Problema: React build falha

**Solução:**

```bash
cd client

# Limpar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install

# Build novamente
npm run build
```

## 🔍 Verificação de Logs

### Ver logs do servidor (se usar nodemon)

Logs aparecem automaticamente no terminal onde executou `npm run server` ou `npm run dev`

### Ver logs do React

Logs aparecem no terminal e no console do browser (F12)

### Logs MySQL

```bash
# Windows (verificar localização)
type "C:\ProgramData\MySQL\MySQL Server 8.0\Data\hostname.err"

# Ver últimas 50 linhas
Get-Content "C:\ProgramData\MySQL\MySQL Server 8.0\Data\hostname.err" -Tail 50
```

## 🧪 Testar API com cURL

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@cpslanheses.pt\",\"password\":\"Admin123!\"}'
```

### Obter projetos

```bash
curl http://localhost:5000/api/projetos
```

### Criar projeto (com autenticação)

```bash
$token = "seu_token_jwt_aqui"

curl -X POST http://localhost:5000/api/projetos `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{\"titulo\":\"Novo Projeto\",\"descricao\":\"Descrição\",\"data_inicio\":\"2025-01-01\"}'
```

## 📊 Verificar Estado do Sistema

### Health check da API

```bash
curl http://localhost:5000/api/health
```

### Ver variáveis de ambiente (em desenvolvimento)

```bash
# No servidor Node.js, adicionar temporariamente:
console.log('PORT:', process.env.PORT);
console.log('DB_NAME:', process.env.DB_NAME);
```

### Verificar versões

```bash
node --version
npm --version
mysql --version
```

## 🔄 Reset Completo (Desenvolvimento)

```bash
# 1. Parar todos os processos

# 2. Limpar base de dados
mysql -u root -p -e "DROP DATABASE IF EXISTS cpsl_db;"
mysql -u root -p < database/schema.sql

# 3. Limpar node_modules
rm -rf node_modules
rm -rf client/node_modules

# 4. Reinstalar tudo
npm run install-all

# 5. Limpar uploads
rm -rf uploads/*

# 6. Recriar pastas de uploads
mkdir uploads/imagens
mkdir uploads/videos
mkdir uploads/pdfs

# 7. Iniciar novamente
npm run dev
```

## 📱 Testar Responsividade

### No Chrome DevTools

1. F12 para abrir DevTools
2. Ctrl+Shift+M para Toggle Device Toolbar
3. Testar diferentes dispositivos

### Dispositivos comuns para testar

- iPhone 12 Pro (390x844)
- iPad (768x1024)
- Desktop 1920x1080

## 🔐 Segurança - Checklist de Produção

- [ ] Alterar JWT_SECRET para chave forte
- [ ] Alterar passwords padrão
- [ ] Configurar HTTPS
- [ ] Limitar rate limiting apropriadamente
- [ ] Configurar CORS apenas para domínios permitidos
- [ ] Não commit .env para Git
- [ ] Usar variáveis de ambiente em produção
- [ ] Configurar backups automáticos da BD
- [ ] Ativar logs de erro
- [ ] Testar todos os endpoints de autenticação

## 💡 Dicas de Desenvolvimento

### Auto-save no VS Code

```json
// settings.json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

### Extensões VS Code recomendadas

- ES7+ React/Redux/React-Native snippets
- ESLint
- Prettier
- MySQL (para queries)
- Thunder Client (testar API)

### Hot Reload

Backend e Frontend já têm hot reload configurado:

- Backend: nodemon reinicia automaticamente
- Frontend: React hot reload automático

## 📞 Contacto de Suporte

Para problemas técnicos, documentar:

1. Mensagem de erro completa
2. Comandos executados
3. Versões (node, npm, mysql)
4. Sistema operativo
5. Screenshots (se relevante)
