const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { logRequest, errorHandler } = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const consultoriaRoutes = require('./routes/consultoria');
const empresaRoutes = require('./routes/empresaRoutes');
const departamentoRoutes = require('./routes/departamentoRoutes');
const colaboradorRoutes = require('./routes/colaboradorRoutes');

const app = express();
const PORT = process.env.PORT_API || 3000;

// Middlewares de segurança
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
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

// Rota principal
app.get('/', (req, res) => {
    res.json({
        message: 'Ezer Desenvolvimento Humano - API',
        version: '1.0.0',
        status: 'running',
        documentation: '/api/health'
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/consultoria', consultoriaRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/colaboradores', colaboradorRoutes);

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
            console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
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
