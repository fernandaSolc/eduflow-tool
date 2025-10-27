#!/bin/bash

# Script de inicialização do Eduflow Tool
# Execute com: chmod +x setup.sh && ./setup.sh

echo "🚀 Configurando Eduflow Tool..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas"

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."

if [ ! -f .env.local ]; then
    if [ -f env-config.txt ]; then
        cp env-config.txt .env.local
        echo "✅ Arquivo .env.local criado a partir do env-config.txt"
    else
        echo "❌ Arquivo env-config.txt não encontrado"
        exit 1
    fi
else
    echo "ℹ️ Arquivo .env.local já existe"
fi

# Verificar configuração
echo "🔍 Verificando configuração..."

if grep -q "USE_AI_MOCK=true" .env.local && grep -q "USE_BACKEND_MOCK=true" .env.local; then
    echo "✅ Modo mock configurado para desenvolvimento"
else
    echo "⚠️ Modo mock não configurado. Os serviços reais serão utilizados."
fi

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:9002"
echo "   3. Teste os health checks: node test-health-checks.js"
echo ""
echo "📖 Para mais informações, consulte o arquivo SETUP.md"
