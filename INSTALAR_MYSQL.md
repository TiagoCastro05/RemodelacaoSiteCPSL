# 📦 GUIA DE INSTALAÇÃO DO MySQL

## 🎯 O que precisa fazer

Para o site funcionar, precisa instalar o MySQL Server no seu computador.

---

## 📥 Método 1: Instalação Rápida (Recomendado)

### Passo 1: Baixar o MySQL Installer

1. Vá para: https://dev.mysql.com/downloads/installer/
2. Escolha: **"Windows (x86, 32-bit), MSI Installer"** (mysql-installer-community)
3. Tamanho do ficheiro: ~400MB
4. Clique em **"Download"**
5. Pode clicar em **"No thanks, just start my download"** (não precisa criar conta)

### Passo 2: Executar o Instalador

1. Abra o ficheiro `.msi` descarregado
2. Escolha o tipo de instalação: **"Developer Default"** ✅
   - Isto instala o MySQL Server + MySQL Workbench + ferramentas úteis

### Passo 3: Configuração do MySQL Server

Durante a instalação, será pedido para configurar:

#### 3.1 Tipo e Rede

- **Config Type**: Development Computer ✅
- **Port**: 3306 (deixar padrão) ✅
- **X Protocol Port**: 33060 (deixar padrão) ✅

#### 3.2 Autenticação

- Escolher: **"Use Strong Password Encryption"** ✅

#### 3.3 Accounts and Roles

- **Root Password**: Criar uma password forte e **GUARDAR BEM** ⚠️
  - Exemplo: `MySQLRoot2025!`
- Pode adicionar outros utilizadores (opcional)

#### 3.4 Windows Service

- ✅ Configure MySQL Server as a Windows Service
- ✅ Start the MySQL Server at System Startup
- Service Name: `MySQL80` (deixar padrão)

### Passo 4: Completar Instalação

1. Clique em **"Execute"** para aplicar a configuração
2. Aguarde até todos os passos ficarem verdes ✅
3. Clique em **"Finish"**

---

## 🔧 Método 2: Instalação via Winget (Rápido mas menos opções)

Se tiver o Windows 11 ou Windows 10 atualizado:

```powershell
# No PowerShell como Administrador
winget install Oracle.MySQL
```

⚠️ **Nota:** Este método instala apenas o servidor, sem o Workbench.

---

## ✅ Verificar Instalação

### 1. Verificar se o serviço está a correr

Abra o PowerShell e execute:

```powershell
Get-Service -Name "MySQL*"
```

Deve aparecer algo como:

```
Status   Name               DisplayName
------   ----               -----------
Running  MySQL80            MySQL80
```

### 2. Testar conexão via linha de comandos

```powershell
mysql -u root -p
```

Digite a password que criou. Se entrar no MySQL, está tudo OK! ✅

Para sair do MySQL:

```sql
exit;
```

---

## 🗄️ Criar a Base de Dados do Projeto

### Opção A: MySQL Workbench (Recomendado - Interface Gráfica)

1. Abra o **MySQL Workbench**
2. Clique na conexão **"Local instance MySQL80"**
3. Digite a password do root
4. No menu: **File > Open SQL Script**
5. Navegue até: `C:\ECGM\PROJETO\RemodelacaoCPSL\database\schema.sql`
6. Clique no ícone do **raio** (⚡) para executar
7. Aguarde até ver "Action Output" com mensagens de sucesso

### Opção B: Linha de Comandos

```powershell
# Na pasta do projeto
cd C:\ECGM\PROJETO\RemodelacaoCPSL

# Executar o schema SQL
mysql -u root -p < database/schema.sql
```

Digite a password quando solicitado.

---

## ⚙️ Configurar o Projeto

### 1. Editar o ficheiro `.env`

Na raiz do projeto `C:\ECGM\PROJETO\RemodelacaoCPSL\.env`:

```env
# Base de Dados MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=SUA_PASSWORD_MYSQL_AQUI  ← ALTERAR AQUI!
DB_NAME=cpsl_db
DB_PORT=3306
```

⚠️ **IMPORTANTE:** Substitua `SUA_PASSWORD_MYSQL_AQUI` pela password que criou na instalação!

### 2. Iniciar o Servidor

```powershell
npm run server
```

Deve aparecer:

```
✅ Conexão à base de dados MySQL estabelecida com sucesso!
🚀 Servidor a correr na porta 5000
```

---

## 🔐 Credenciais de Login do Site

Depois de executar o `schema.sql`, o utilizador admin é criado automaticamente:

```
URL: http://localhost:3000/admin
Email: admin@cpslanheses.pt
Password: Admin123!
```

---

## 🆘 Problemas Comuns

### ❌ "Access denied for user 'root'@'localhost'"

**Solução:** Verifique se a password no `.env` está correta

### ❌ "Can't connect to MySQL server on 'localhost'"

**Solução:** Verifique se o serviço MySQL está a correr:

```powershell
Start-Service -Name "MySQL80"
```

### ❌ "Unknown database 'cpsl_db'"

**Solução:** Execute o ficheiro `schema.sql` para criar a base de dados

### ❌ Esqueci a password do root do MySQL

**Solução:** Precisa resetar a password do MySQL:

1. Pare o serviço MySQL
2. Inicie em modo seguro
3. Reset da password
4. Reinicie o serviço

Tutorial: https://dev.mysql.com/doc/refman/8.0/en/resetting-permissions.html

---

## 📚 Links Úteis

- MySQL Downloads: https://dev.mysql.com/downloads/installer/
- MySQL Documentation: https://dev.mysql.com/doc/
- MySQL Workbench Manual: https://dev.mysql.com/doc/workbench/en/

---

## 📋 Checklist de Instalação

- [ ] MySQL Server instalado
- [ ] MySQL Workbench instalado (opcional mas recomendado)
- [ ] Password do root configurada e guardada
- [ ] Serviço MySQL a correr
- [ ] Base de dados `cpsl_db` criada (executar `schema.sql`)
- [ ] Password configurada no `.env`
- [ ] Servidor backend a funcionar sem erros
- [ ] Consegue fazer login com admin@cpslanheses.pt

---

🎉 Depois de completar estes passos, o site estará completamente funcional!
