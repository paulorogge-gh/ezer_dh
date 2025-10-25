const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = (() => { try { return require('compression'); } catch (e) { return null; } })();
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const { testConnection } = require('./config/db');
const { logRequest, errorHandler } = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const consultoriaRoutes = require('./routes/consultoria');
const empresaRoutes = require('./routes/empresaRoutes');
const departamentoRoutes = require('./routes/departamentoRoutes');
const colaboradorRoutes = require('./routes/colaboradorRoutes');
const ocorrenciaRoutes = require('./routes/ocorrenciaRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const liderRoutes = require('./routes/liderRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
// Permitir Express reconhecer IP real atrás de proxy (Azure App Service)
app.set('trust proxy', 1);
// Azure Web App fornece PORT; mantenha PORT_API como fallback local (3001)
const PORT = process.env.PORT || process.env.PORT_API || 3001;
const DEFAULT_FRONTEND_PUBLIC = path.join(__dirname, '../../frontend/public');
const BACKEND_SITE_PUBLIC = path.join(__dirname, 'public/site');
const FRONTEND_PUBLIC = (function() {
    const configured = process.env.FRONTEND_PUBLIC_DIR || DEFAULT_FRONTEND_PUBLIC;
    try { if (fs.existsSync(configured)) return configured; } catch {}
    try { if (fs.existsSync(BACKEND_SITE_PUBLIC)) return BACKEND_SITE_PUBLIC; } catch {}
    return configured;
})();

// Guarda de autenticação para páginas privadas
function isAuthenticatedRequest(req) {
    try {
        const authHeader = (req.headers['authorization'] || '').toLowerCase();
        const hasBearer = authHeader.startsWith('bearer ');
        const cookieHeader = req.headers['cookie'] || '';
        const hasSessionCookie = /ezer_session=1/.test(cookieHeader);
        return hasBearer || hasSessionCookie;
    } catch (e) {
        return false;
    }
}

// Logs de inicialização para diagnóstico de estáticos
try {
    const loginFile = path.join(FRONTEND_PUBLIC, 'login.html');
    const indexFile = path.join(FRONTEND_PUBLIC, 'index.html');
    const genericIndex = path.join(FRONTEND_PUBLIC, 'index.html');
    console.log('🧭 FRONTEND_PUBLIC resolvido para:', FRONTEND_PUBLIC);
    console.log('🧭 login.html existe?', fs.existsSync(loginFile));
    console.log('🧭 index.html existe?', fs.existsSync(indexFile));
    console.log('🧭 index.html existe?', fs.existsSync(genericIndex));
} catch {}

// Middlewares de segurança
app.use(helmet());
if (compression) { app.use(compression()); }
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

// Rate limiting (configurável via env)
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${15 * 60 * 1000}`, 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '300', 10);
const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, tente novamente em alguns minutos.'
});
// Aplicar rate limit apenas nas rotas da API
app.use('/api', limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log
app.use(logRequest);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota principal: servir login minimal diretamente (com fallback)
app.get('/', (req, res) => {
    const loginFile = path.join(FRONTEND_PUBLIC, 'login.html');
    const indexFile = path.join(FRONTEND_PUBLIC, 'index.html');
    const genericIndex = path.join(FRONTEND_PUBLIC, 'index.html');
    try {
        if (fs.existsSync(loginFile)) {
            return res.sendFile(loginFile, (err) => {
                if (err) {
                    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
                    if (fs.existsSync(genericIndex)) return res.sendFile(genericIndex);
                    return res.status(500).send('Erro ao carregar página inicial');
                }
            });
        }
        if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
        if (fs.existsSync(genericIndex)) return res.sendFile(genericIndex);
        return res.status(404).send('Página inicial não encontrada');
    } catch (e) {
        if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
        if (fs.existsSync(genericIndex)) return res.sendFile(genericIndex);
        return res.status(500).send('Erro ao carregar página inicial');
    }
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/consultoria', consultoriaRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/colaboradores', colaboradorRoutes);
app.use('/api/ocorrencias', ocorrenciaRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/lideres', liderRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Servir frontend estático a partir de frontend/public (sempre)
try {
    if (fs.existsSync(FRONTEND_PUBLIC)) {
        app.use(express.static(FRONTEND_PUBLIC));
    }
    // Mapear rotas conhecidas sem extensão para páginas .html com guarda de autenticação
    const publicPages = new Set(['login.html', 'index.html', 'test-auth.html', 'favicon.svg']);
    const privatePages = new Set([
        'dashboard.html','usuarios.html','empresas.html','departamentos.html','colaboradores.html','ocorrencias.html','lideres.html','treinamentos.html','feedbacks.html','avaliacoes.html','pdi.html','perfil.html','configuracoes.html'
    ]);
    const knownPages = [...publicPages, ...privatePages];
    knownPages.forEach(page => {
        const route = `/${page.replace('.html','')}`;
        app.get(route, (req, res) => {
            // Bloquear acesso a páginas privadas sem autenticação
            if (privatePages.has(page) && !isAuthenticatedRequest(req)) {
                return res.redirect('/login');
            }
            const pageFile = path.join(FRONTEND_PUBLIC, page);
            if (fs.existsSync(pageFile)) {
                return res.sendFile(pageFile, (err) => {
                    if (err) return res.status(500).send('Erro ao carregar página');
                });
            }
            return res.status(404).send('Página não encontrada');
        });
    });
    // Favicon e robots healthcheck
    app.get('/favicon.ico', (req, res) => {
        try { res.sendFile(path.join(FRONTEND_PUBLIC, 'favicon.svg')); } catch { res.status(204).end(); }
    });
    app.get('/robots933456.txt', (req, res) => {
        res.type('text/plain').send('');
    });
    // Catch-all: para caminhos não-API, servir login (sem redirect para evitar loops)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint não encontrado' } });
        }
        const fallbackFile = path.join(FRONTEND_PUBLIC, 'login.html');
        const indexFile = path.join(FRONTEND_PUBLIC, 'index.html');
        if (fs.existsSync(fallbackFile)) {
            return res.sendFile(fallbackFile, (err) => {
                if (err) {
                    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
                    return res.status(500).send('Erro ao carregar página');
                }
            });
        }
        if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
        return res.status(404).send('Página não encontrada');
    });
} catch(e) { /* noop */ }

// Middleware de tratamento de erros
app.use(errorHandler);

// Função para iniciar o servidor
async function startServer() {
    try {
        // Testar conexão com o banco de dados
        console.log('🔍 Testando conexão com o banco de dados...');
        const dbConnected = await testConnection();
        const STRICT_DB = (process.env.REQUIRE_DB === 'true') || ((process.env.NODE_ENV || '').toLowerCase() === 'production');
        if (!dbConnected) {
            if (STRICT_DB) {
                console.error('❌ Falha na conexão com o banco. Servidor não será iniciado (STRICT_DB habilitado).');
                process.exit(1);
            } else {
                console.warn('⚠️ Falha ao conectar ao banco. Continuando sem DB (modo desenvolvimento).');
            }
        }

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('\n🚀 ================================================');
            console.log('   EZER DESENVOLVIMENTO HUMANO - API');
            console.log('🚀 ================================================');
            console.log(`🌐 Servidor rodando em porta: ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
            console.log('🚀 ================================================\n');
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error.message);
        process.exit(1);
    }
}

// Handlers globais de processo configurados em utils/logger.js
startServer();

module.exports = app;
