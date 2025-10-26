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

# Encerrar processos nas portas 8080, 8000, 3000 e 3001
kill_port_processes 8080
kill_port_processes 8000
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

# Expor variáveis padrão se não definidas
export PORT_API=${PORT_API:-8000}
export CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:8080}

# Iniciar backend na porta 8000
echo "🔧 Iniciando backend na porta $PORT_API..."
(cd backend && nohup npm start >/tmp/backend.log 2>&1 &)
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Iniciar frontend na porta 8080
echo "🌐 Iniciando frontend na porta 8080..."
(cd frontend && nohup npm start >/tmp/frontend.log 2>&1 &)
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados com sucesso!"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:8000"
echo "📊 Health Check: http://localhost:8000/api/health"
echo ""
echo "Pressione Ctrl+C para parar os servidores"

# Verificar health da API com retry
HEALTH_URL="http://localhost:8000/api/health"
ATTEMPTS=3
SLEEP_BETWEEN=2

echo "🩺 Verificando health da API em $HEALTH_URL (até $ATTEMPTS tentativas)"
for i in $(seq 1 $ATTEMPTS); do
  STATUS=$(curl -s "$HEALTH_URL" || true)
  if echo "$STATUS" | grep -q '"ok":true'; then
    echo "✅ Health OK: $STATUS"
    break
  else
    echo "⏳ Tentativa $i falhou. Aguardando $SLEEP_BETWEEN s..."
    sleep $SLEEP_BETWEEN
  fi
  if [ "$i" -eq "$ATTEMPTS" ]; then
    echo "⚠️ Health não confirmou OK após $ATTEMPTS tentativas: $STATUS"
  fi
done

# Aguardar sinal de interrupção
trap "echo ''; echo '🛑 Parando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Manter o script rodando
wait
