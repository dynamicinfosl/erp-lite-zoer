#!/bin/bash
# Script de instalação do Easypanel executado na VPS
set -e

echo "=================================================="
echo "   INICIANDO CONFIGURAÇÃO DO EASYPANEL NA VPS     "
echo "=================================================="

# 1. Configuração do Firewall no Ubuntu (Oracle Cloud)
echo "--> 1. Liberando portas no firewall local (iptables)..."
sudo iptables -I INPUT 6 -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT

# Salvar regras de firewall se o netfilter-persistent existir
if command -v netfilter-persistent &> /dev/null; then
    echo "Salvando regras do firewall persistentemente..."
    sudo netfilter-persistent save
fi

# 2. Instalação do Docker
if ! command -v docker &> /dev/null; then
    echo "--> 2. Docker não instalado. Baixando e instalando o Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker instalado com sucesso!"
else
    echo "--> 2. Docker já está instalado na VPS."
fi

# 3. Instalação do Easypanel
echo "--> 3. Instalando o Easypanel..."
curl -sSL https://get.easypanel.io | sudo bash

echo "=================================================="
echo "    INSTALAÇÃO DO EASYPANEL FINALIZADA!           "
echo "=================================================="
echo "Tudo pronto! Acesse pelo IP da VPS para criar sua conta admin:"
echo "Link: http://147.15.35.36:3000"
echo "=================================================="
