const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// ==================================================
// SESSÃO (SIMPLIFICADA)
// ==================================================
// Utiliza apenas cookie simples 'ezer_session=1' para proteção de páginas privadas

// ==================================================
// GUARDA DE ROTAS PARA ARQUIVOS .html PRIVADOS
// ==================================================
const PRIVATE_HTML_PAGES = new Set([
  'dashboard.html', 'usuarios.html', 'empresas.html', 'departamentos.html', 'colaboradores.html', 'ocorrencias.html', 'lideres.html', 'treinamentos.html', 'feedbacks.html', 'avaliacoes.html', 'pdi.html'
]);

app.use((req, res, next) => {
  try {
    const reqPath = req.path;
    // Bloquear acesso direto a .html se for página privada
    if (reqPath.endsWith('.html')) {
      const baseName = path.basename(reqPath);
      if (PRIVATE_HTML_PAGES.has(baseName) && !isAuthenticatedRequest(req)) {
        return res.redirect('/login');
      }
    }
  } catch (e) {}
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ==================================================
// GUARDA DE ROTAS NO FRONTEND (apenas páginas privadas)
// ==================================================
const PRIVATE_PATHS = new Set([
  '/dashboard', '/usuarios', '/empresas', '/departamentos', '/colaboradores', '/ocorrencias', '/lideres', '/treinamentos', '/feedbacks', '/avaliacoes', '/pdi'
]);
// incluir páginas utilitárias
PRIVATE_PATHS.add('/perfil');
PRIVATE_PATHS.add('/configuracoes');

function isAuthenticatedRequest(req) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const hasBearer = authHeader.toLowerCase().startsWith('bearer ');
    const cookie = req.headers['cookie'] || '';
    const hasSessionCookie = /ezer_session=1/.test(cookie);
    return hasBearer || hasSessionCookie;
  } catch { return false; }
}

app.use((req, res, next) => {
  try {
    const pathName = req.path;
    if (PRIVATE_PATHS.has(pathName)) {
      if (!isAuthenticatedRequest(req)) {
        return res.redirect('/login');
      }
    }
  } catch {}
  next();
});

// Rota principal - redirecionar imediatamente para login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rota para login (redireciona para login minimalista)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
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

// Rota para Usuários
app.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

// Rota para login minimalista
// (removida)
// Rota para dashboard minimalista
// (removida)

// Rota para teste de autenticação
app.get('/test-auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-auth.html'));
});

// Rotas utilitárias
app.get('/perfil', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
});
app.get('/configuracoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'configuracoes.html'));
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
    console.log(`🔐 Login: http://localhost:${PORT}/login`);
    console.log(`📈 Dashboard: http://localhost:${PORT}/dashboard`);
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
    
    // Fechar servidor
    server.close(() => {
        console.log('✅ Servidor encerrado graciosamente');
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
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promise rejeitada não tratada:', reason);
    process.exit(1);
});
