#!/bin/bash

# ================================================
# Script de Inicialização - Ezer Desenvolvimento Humano
# ================================================

echo "🚀 Iniciando Ezer Desenvolvimento Humano..."
echo "================================================"

# Função para encerrar processos em uma porta específica
kill_port_processes() {
    local port=$1
    echo "🔍 Verificando processos na porta $port..."
    
    # Encontrar PIDs dos processos na porta
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "⚠️  Encontrados processos na porta $port: $pids"
        echo "🛑 Encerrando processos..."
        kill -9 $pids 2>/dev/null
        sleep 2
        
        # Verificar se ainda há processos
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            echo "⚠️  Ainda há processos na porta $port, forçando encerramento..."
            kill -9 $remaining_pids 2>/dev/null
        fi
        echo "✅ Processos na porta $port encerrados com sucesso!"
    else
        echo "✅ Nenhum processo ativo na porta $port"
    fi
}

# Encerrar processos nas portas 3000 e 3001
kill_port_processes 3000
kill_port_processes 3001

echo ""
echo "🧹 Limpeza de portas concluída!"
echo "================================================"

# Verificar se o arquivo .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo .env não encontrado no diretório backend/"
    echo "🔧 Copie o arquivo .env.example para .env e configure as variáveis"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm run install:all
fi

echo ""
echo "🚀 Iniciando servidores..."
echo "================================================"

# Iniciar backend na porta 3001
echo "🔧 Iniciando backend na porta 3001..."
(cd backend && npm start) &
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Iniciar frontend na porta 3000
if [ "$START_ONLY_BACKEND" = "true" ]; then
    echo "💤 START_ONLY_BACKEND=true: não iniciar o frontend."
else
    echo "🌐 Iniciando frontend na porta 3000..."
    (cd frontend && npm start) &
    FRONTEND_PID=$!
fi

echo ""
echo "✅ Servidores iniciados com sucesso!"
if [ "$START_ONLY_BACKEND" != "true" ]; then
    echo "🌐 Frontend: http://localhost:3000"
fi
echo "🔧 Backend: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "Pressione Ctrl+C para parar os servidores"

# Aguardar sinal de interrupção
trap "echo ''; echo '🛑 Parando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Manter o script rodando
wait
