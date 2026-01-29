# Script para criar arquivo .env.local baseado no env.example
# Execute: .\criar-env-local.ps1

$envExamplePath = "env.example"
$envLocalPath = ".env.local"

Write-Host "🔧 Criando arquivo .env.local..." -ForegroundColor Cyan

# Verificar se env.example existe
if (-not (Test-Path $envExamplePath)) {
    Write-Host "❌ Arquivo env.example não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se .env.local já existe
if (Test-Path $envLocalPath) {
    $resposta = Read-Host "⚠️  Arquivo .env.local já existe. Deseja sobrescrever? (s/N)"
    if ($resposta -ne "s" -and $resposta -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Copiar conteúdo do env.example
Copy-Item $envExamplePath $envLocalPath

Write-Host "✅ Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra o arquivo .env.local e preencha com seus valores reais do Supabase"
Write-Host "2. Obtenha as chaves em: https://supabase.com/dashboard/project/lfxietcasaooenffdodr/settings/api"
Write-Host "3. Reinicie o servidor: npm run dev"
Write-Host ""
Write-Host "🔍 Para verificar se está funcionando, acesse:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/next_api/cash-sessions/test" -ForegroundColor Cyan




