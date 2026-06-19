# Script local do PowerShell para automatizar a implantação do Easypanel na VPS
$IP = "147.15.35.36"
$User = "ubuntu"
$KeySource = "C:\Users\Administrator\Downloads\ssh-key-2026-06-19.key"
$DeployDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KeyLocal = Join-Path $DeployDir "ssh-key.key"

Clear-Host
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO INSTALAÇÃO DO EASYPANEL NA VPS       " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Copiar chave privada para o diretório de deploy e ajustar permissões locais no Windows
Write-Host "--> 1. Copiando e protegendo a chave SSH para conformidade do OpenSSH..." -ForegroundColor Yellow
Copy-Item -Path $KeySource -Destination $KeyLocal -Force

# Resetar permissões, remover herança e dar acesso exclusivo ao usuário atual usando icacls
icacls "$KeyLocal" /reset | Out-Null
icacls "$KeyLocal" /inheritance:r | Out-Null
icacls "$KeyLocal" /grant:r "${env:USERNAME}:R" | Out-Null
Write-Host "Chave SSH local protegida com sucesso!" -ForegroundColor Green

# Limpar arquivos antigos de Docker Compose locais que não serão mais usados
$ComposeFile = Join-Path $DeployDir "docker-compose.yml"
$InitDbFile = Join-Path $DeployDir "init-db.sql"
$EnvFile = Join-Path $DeployDir ".env"
if (Test-Path $ComposeFile) { Remove-Item $ComposeFile -Force }
if (Test-Path $InitDbFile) { Remove-Item $InitDbFile -Force }
if (Test-Path $EnvFile) { Remove-Item $EnvFile -Force }

# 2. Criar diretório remoto na VPS
Write-Host "--> 2. Criando diretório remoto na VPS (~/easypanel-stack)..." -ForegroundColor Yellow
ssh -i "$KeyLocal" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${User}@${IP}" "mkdir -p ~/easypanel-stack"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao conectar via SSH na VPS. Verifique se o IP ou o usuário estão corretos."
    exit $LASTEXITCODE
}

# 3. Enviar o script de configuração
Write-Host "--> 3. Transferindo o script de configuração para a VPS..." -ForegroundColor Yellow
scp -i "$KeyLocal" -o StrictHostKeyChecking=no "$DeployDir\setup.sh" "${User}@${IP}:~/easypanel-stack/setup.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao transferir o arquivo setup.sh via SCP."
    exit $LASTEXITCODE
}
Write-Host "Arquivo transferido com sucesso!" -ForegroundColor Green

# 4. Executar script de configuração na VPS
Write-Host "--> 4. Executando o script de instalação na VPS remoto (isso pode demorar de 1 a 2 minutos)..." -ForegroundColor Yellow
ssh -i "$KeyLocal" -o StrictHostKeyChecking=no "${User}@${IP}" "cd ~/easypanel-stack && chmod +x setup.sh && ./setup.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha durante a execução do script de instalação do Easypanel."
    exit $LASTEXITCODE
}

Write-Host "==================================================" -ForegroundColor Green
Write-Host "    EASYPANEL INSTALADO COM SUCESSO!             " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
