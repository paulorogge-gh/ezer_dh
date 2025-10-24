const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

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
// Azure Web App fornece PORT; mantenha PORT_API como fallback local
const PORT = process.env.PORT || process.env.PORT_API || 3000;
const FRONTEND_PUBLIC = path.join(__dirname, '../../frontend/public');

// Middlewares de segurança
app.use(helmet());
app.use(cors({
    origin: true, // Aceitar todas as origens para debug
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use(limiter);

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

// Rota principal: servir login minimal diretamente
app.get('/', (req, res) => {
    try {
        return res.sendFile(path.join(FRONTEND_PUBLIC, 'login-minimal.html'));
    } catch (e) {
        return res.redirect('/login-minimal');
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
    app.use(express.static(FRONTEND_PUBLIC));
    // Mapear rotas conhecidas sem extensão para páginas .html
    const knownPages = [
        'login-minimal.html','dashboard-minimal.html','usuarios.html','empresas.html','departamentos.html','colaboradores.html','ocorrencias.html','lideres.html','treinamentos.html','feedbacks.html','avaliacoes.html','pdi.html','perfil.html','configuracoes.html','test-auth.html'
    ];
    knownPages.forEach(page => {
        const route = `/${page.replace('.html','')}`;
        app.get(route, (req, res) => {
            res.sendFile(path.join(FRONTEND_PUBLIC, page));
        });
    });
    // Favicon e robots healthcheck
    app.get('/favicon.ico', (req, res) => {
        try { res.sendFile(path.join(FRONTEND_PUBLIC, 'favicon.svg')); } catch { res.status(204).end(); }
    });
    app.get('/robots933456.txt', (req, res) => {
        res.type('text/plain').send('');
    });
    // Catch-all: se não encontrado, servir login
    app.get('*', (req, res) => {
        try { return res.sendFile(path.join(FRONTEND_PUBLIC, 'login-minimal.html')); } catch { return res.redirect('/login-minimal'); }
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
        
        if (!dbConnected) {
            console.error('❌ Falha na conexão com o banco. Servidor não será iniciado.');
            process.exit(1);
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

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
