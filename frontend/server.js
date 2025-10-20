const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==================================================
// SISTEMA DE GERENCIAMENTO DE SESSÕES
// ==================================================
const SESSION_FILE = path.join(__dirname, 'sessions.json');
const SERVER_RESTART_FLAG = path.join(__dirname, 'server_restart.flag');

// Carregar sessões existentes
let activeSessions = {};
try {
    if (fs.existsSync(SESSION_FILE)) {
        const data = fs.readFileSync(SESSION_FILE, 'utf8');
        activeSessions = JSON.parse(data);
        console.log(`📊 Sessões carregadas: ${Object.keys(activeSessions).length}`);
    }
} catch (error) {
    console.log('⚠️ Erro ao carregar sessões:', error.message);
    activeSessions = {};
}

// Função para salvar sessões
function saveSessions() {
    try {
        fs.writeFileSync(SESSION_FILE, JSON.stringify(activeSessions, null, 2));
    } catch (error) {
        console.error('❌ Erro ao salvar sessões:', error.message);
    }
}

// Função para limpar todas as sessões
function clearAllSessions() {
    console.log('🔄 Limpando todas as sessões ativas...');
    activeSessions = {};
    saveSessions();
    
    // Criar flag de reinicialização do servidor
    try {
        fs.writeFileSync(SERVER_RESTART_FLAG, JSON.stringify({
            timestamp: new Date().toISOString(),
            message: 'Servidor reiniciado - todas as sessões foram encerradas'
        }));
    } catch (error) {
        console.error('❌ Erro ao criar flag de reinicialização:', error.message);
    }
}

// Middleware para verificar flag de reinicialização
app.use((req, res, next) => {
    if (fs.existsSync(SERVER_RESTART_FLAG)) {
        // Servidor foi reiniciado, limpar flag e forçar logout
        try {
            fs.unlinkSync(SERVER_RESTART_FLAG);
        } catch (error) {
            console.error('❌ Erro ao remover flag:', error.message);
        }
        
        // Adicionar header para forçar logout no frontend
        res.setHeader('X-Server-Restart', 'true');
    }
    next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal - servir index-minimal.html (redirecionamento inteligente)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index-minimal.html'));
});

// Rota para login (redireciona para login minimalista)
app.get('/login', (req, res) => {
    res.redirect('/login-minimal');
});

// Rota para colaboradores removida por padronização
// Rota reativada para colaboradores
app.get('/colaboradores', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'colaboradores.html'));
});

// Rota para empresas
app.get('/empresas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'empresas.html'));
});

// Rota para ocorrências
app.get('/ocorrencias', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ocorrencias.html'));
});

// Rota para departamentos
app.get('/departamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'departamentos.html'));
});

// Rota para líderes
app.get('/lideres', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lideres.html'));
});

// Rota para treinamentos
app.get('/treinamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'treinamentos.html'));
});

// Rota para feedbacks
app.get('/feedbacks', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'feedbacks.html'));
});

// Rota para avaliações
app.get('/avaliacoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'avaliacoes.html'));
});

// Rota para PDI
app.get('/pdi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pdi.html'));
});

// Rota para login minimalista
app.get('/login-minimal', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login-minimal.html'));
});

// Rota para dashboard minimalista
app.get('/dashboard-minimal', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard-minimal.html'));
});

// Rota para teste de autenticação
app.get('/test-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-auth.html'));
});

// Rota para verificar status do servidor (retorna header X-Server-Restart se aplicável)
app.get('/server-status', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log('🌐 ================================================');
    console.log('   EZER DESENVOLVIMENTO HUMANO - FRONTEND');
    console.log('🌐 ================================================');
    console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`🏠 Página Principal: http://localhost:${PORT}/ (redirecionamento inteligente)`);
    console.log(`🔐 Login: http://localhost:${PORT}/login-minimal`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard-minimal`);
    console.log(`🧪 Teste de Auth: http://localhost:${PORT}/test-auth`);
    console.log(`🔧 Ambiente: development`);
    console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log('🌐 ================================================');
});

// ==================================================
// HANDLERS PARA ENCERRAMENTO DO SERVIDOR
// ==================================================

// Função para encerrar servidor graciosamente
function gracefulShutdown(signal) {
    console.log(`\n🔄 Recebido sinal ${signal}. Encerrando servidor...`);
    
    // Limpar todas as sessões ativas
    clearAllSessions();
    
    // Fechar servidor
    server.close(() => {
        console.log('✅ Servidor encerrado graciosamente');
        console.log('🔐 Todas as sessões foram encerradas');
        process.exit(0);
    });
    
    // Forçar encerramento após 10 segundos
    setTimeout(() => {
        console.log('⚠️ Forçando encerramento do servidor...');
        process.exit(1);
    }, 10000);
}

// Capturar sinais de encerramento
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
    console.error('💥 Erro não tratado:', error);
    clearAllSessions();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promise rejeitada não tratada:', reason);
    clearAllSessions();
    process.exit(1);
});

// Limpar sessões ao iniciar (caso o servidor tenha sido reiniciado)
clearAllSessions();
