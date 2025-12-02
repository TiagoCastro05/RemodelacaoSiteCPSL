# Script de Setup Automático - CPSL Website
# Execute: .\setup.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CPSL Website - Setup Automático" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se .env existe
if (Test-Path ".env") {
    Write-Host "✅ Ficheiro .env encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Criando ficheiro .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Ficheiro .env criado" -ForegroundColor Green
}

# 2. Pedir password do MySQL
Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Configuração do MySQL" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
$mysqlPassword = Read-Host "Digite a password do MySQL (root)"

# 3. Atualizar .env com a password
Write-Host "`n⚙️  Atualizando ficheiro .env..." -ForegroundColor Yellow
$envContent = Get-Content ".env"
$envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$mysqlPassword"
$envContent | Set-Content ".env"
Write-Host "✅ Ficheiro .env atualizado" -ForegroundColor Green

# 4. Criar base de dados
Write-Host "`n----------------------------------------" -ForegroundColor Cyan
Write-Host "Criando Base de Dados" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

try {
    Write-Host "⚙️  Criando base de dados cpsl_db..." -ForegroundColor Yellow
    Get-Content "database\schema.sql" | mysql -u root -p$mysqlPassword 2>&1 | Out-Null
    Write-Host "✅ Base de dados criada com sucesso!" -ForegroundColor Green
    Write-Host "✅ Utilizador Admin criado (Email: admin@cpslanheses.pt, Password: Admin123!)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar base de dados" -ForegroundColor Red
    Write-Host "Tente manualmente: mysql -u root -p < database\schema.sql" -ForegroundColor Yellow
    exit 1
}

# 5. Instalar dependências (se necessário)
if (!(Test-Path "node_modules")) {
    Write-Host "`n⚙️  Instalando dependências do backend..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}

if (!(Test-Path "client\node_modules")) {
    Write-Host "`n⚙️  Instalando dependências do frontend..." -ForegroundColor Yellow
    cd client
    npm install --silent
    cd ..
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
}

# 6. Resumo final
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📝 Credenciais de Login:" -ForegroundColor Cyan
Write-Host "   Email:    admin@cpslanheses.pt" -ForegroundColor White
Write-Host "   Password: Admin123!" -ForegroundColor White

Write-Host "`n🚀 Para iniciar o projeto:" -ForegroundColor Cyan
Write-Host "   1. Backend:  npm run server" -ForegroundColor White
Write-Host "   2. Frontend: cd client && npm start" -ForegroundColor White
Write-Host "   3. Ou ambos: npm run dev`n" -ForegroundColor White

Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Login:    http://localhost:3000/admin" -ForegroundColor White
Write-Host "   API:      http://localhost:5000/api/health`n" -ForegroundColor White

Write-Host "📚 Próximos passos:" -ForegroundColor Cyan
Write-Host "   - Ver START_HERE.md para guia completo" -ForegroundColor White
Write-Host "   - Ver FRONTEND_GUIDE.md para desenvolvimento" -ForegroundColor White
Write-Host "   - Ver API_EXAMPLES.md para exemplos de código`n" -ForegroundColor White
