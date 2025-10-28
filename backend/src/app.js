const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { logRequest, errorHandler, logger } = require('./utils/logger');
const apiRoutes = require('./routes');
const { testConnection } = require('./config/db');

const app = express();
// Azure Web App fornece PORT; preferir PORT e cair para PORT_API
const PORT = parseInt(process.env.PORT || process.env.PORT_API, 10) || 8000;

// Suporte a múltiplas origens CORS
const singleOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';
const originList = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = originList.length > 0 ? originList : [singleOrigin];

function corsOriginValidator(origin, callback) {
  // Permitir requisições sem header Origin (ex.: curl)
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error(`Not allowed by CORS: ${origin}`));
}

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
// Preflight CORS explícito
app.options('*', cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(logRequest);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbOk = await testConnection();
    logger.info('Health Check', { ip: req.ip, db: dbOk, timestamp: new Date().toISOString() });
    res.json({ ok: true, db: dbOk, timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error('Health Check Error', { ip: req.ip, error: err.message });
    res.status(500).json({ ok: false, error: 'Health check failed', message: err.message });
  }
});

// Rate limiting básico para API
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);

// Montagem das rotas da API
app.use('/api', apiRoutes);

// Servir frontend estático (um único Web App)
function resolveFrontendPublicDir() {
  const candidates = [
    path.join(__dirname, '../../frontend/public'), // estrutura esperada ao publicar root
    path.join(__dirname, '../../../ezer_dh/frontend/public'), // estrutura quando repo possui pasta ezer_dh na raiz
    path.join(process.cwd(), 'frontend/public'),    // fallback por cwd
    path.join(process.cwd(), 'ezer_dh/frontend/public'), // cwd com pasta ezer_dh
    path.join(__dirname, '../public'),             // antigo local
    path.join(process.cwd(), 'public')             // outro fallback
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}
const FRONTEND_PUBLIC = resolveFrontendPublicDir();
if (FRONTEND_PUBLIC) {
  app.use(express.static(FRONTEND_PUBLIC));
} else {
  console.warn('⚠️ Diretório do frontend público não encontrado. Verifique se "frontend/public" foi publicado.');
}

// Mapear rotas amigáveis para páginas front
const pageRoute = (routePath, fileName) => {
  app.get(routePath, (req, res) => {
    if (!FRONTEND_PUBLIC) return res.status(500).send('Frontend não disponível');
    const filePath = path.join(FRONTEND_PUBLIC, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: 'ENOENT', message: `Arquivo não encontrado: ${filePath}` } });
    }
    res.sendFile(filePath);
  });
};
pageRoute('/login', 'login.html');
pageRoute('/dashboard', 'dashboard.html');
pageRoute('/usuarios', 'usuarios.html');
pageRoute('/empresas', 'empresas.html');
pageRoute('/departamentos', 'departamentos.html');
pageRoute('/colaboradores', 'colaboradores.html');
pageRoute('/ocorrencias', 'ocorrencias.html');
pageRoute('/lideres', 'lideres.html');
pageRoute('/treinamentos', 'treinamentos.html');
pageRoute('/feedbacks', 'feedbacks.html');
pageRoute('/avaliacoes', 'avaliacoes.html');
pageRoute('/pdi', 'pdi.html');

// Redirecionar root para login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Handler de erros deve ser o último
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log('🚀 ================================================');
  console.log('   EZER DESENVOLVIMENTO HUMANO - BACKEND API');
  console.log('🚀 ================================================');
  console.log(`🔧 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏱️ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('🚀 ================================================');
});

function gracefulShutdown(signal) {
  console.log(`\n🔄 Recebido sinal ${signal}. Encerrando servidor...`);
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('⚠️ Forçando encerramento do servidor...');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

process.on('uncaughtException', (error) => {
  console.error('💥 Erro não tratado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  process.exit(1);
});

module.exports = app;


