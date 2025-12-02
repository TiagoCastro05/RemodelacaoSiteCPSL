# 📥 Como Instalar o MySQL no Windows

## Opção 1: MySQL Community Server (Recomendado)

### 1. Download
1. Ir para: https://dev.mysql.com/downloads/mysql/
2. Escolher: **Windows (x86, 64-bit), MSI Installer**
3. Download do ficheiro (aprox. 300MB)

### 2. Instalação
1. Executar o instalador `.msi`
2. Escolher: **Developer Default** ou **Server only**
3. Clicar "Next" até chegar à configuração do servidor

### 3. Configuração Importante
- **Type and Networking**: Deixar padrão (Port 3306)
- **Authentication Method**: Escolher "Use Strong Password Encryption"
- **Root Password**: Definir password (ex: `root` ou `admin123`)
  - ⚠️ **ANOTAR ESTA PASSWORD!**
- **Windows Service**: Marcar "Start MySQL Server at System Startup"

### 4. Finalizar
- Clicar "Execute" para aplicar configuração
- Clicar "Finish"

### 5. Verificar Instalação
Abrir PowerShell e executar:
```powershell
mysql --version
```

Deve ver algo como: `mysql Ver 8.0.x`

---

## Opção 2: XAMPP (Mais Simples)

### 1. Download
- Ir para: https://www.apachefriends.org/
- Download XAMPP para Windows

### 2. Instalação
1. Executar instalador
2. Selecionar componentes:
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP
   - ✅ phpMyAdmin

### 3. Iniciar MySQL
1. Abrir XAMPP Control Panel
2. Clicar "Start" no MySQL
3. O MySQL estará na porta 3306

### 4. Configurar Password
No XAMPP, por padrão:
- Username: `root`
- Password: *(vazia)*

Se quiser definir password:
```powershell
cd C:\xampp\mysql\bin
.\mysqladmin -u root password nova_password
```

---

## 📝 Depois da Instalação

### 1. Atualizar `.env`
Editar o ficheiro `.env` na raiz do projeto:
```env
DB_PASSWORD=sua_password_aqui
```

### 2. Criar a Base de Dados
```powershell
# Se instalou MySQL Community
mysql -u root -p < database\schema.sql

# Se instalou XAMPP
C:\xampp\mysql\bin\mysql -u root -p < database\schema.sql
```

### 3. Iniciar o Projeto
```powershell
npm run server    # Backend
cd client
npm start         # Frontend
```

---

## ❓ Troubleshooting

### MySQL não inicia
- **Windows Services**: Verificar se o serviço "MySQL80" está a correr
- Abrir "Serviços" (services.msc) e procurar por MySQL

### Esqueci a password do root
- Ver guia oficial: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html

### Porta 3306 ocupada
- Verificar se outro MySQL está a correr
- Alterar porta no `.env` e no MySQL

---

## 🎯 Resumo Rápido

**Opção Fácil (XAMPP):**
1. Instalar XAMPP
2. Iniciar MySQL no Control Panel
3. Password é vazia por padrão
4. Alterar `.env`: `DB_PASSWORD=` (deixar vazio)

**Opção Completa (MySQL Server):**
1. Instalar MySQL Community Server
2. Definir password durante instalação
3. Alterar `.env` com a password escolhida
4. MySQL inicia automaticamente

---

📚 **Próximo passo**: Depois de instalar, voltar ao projeto e executar `npm run server`
