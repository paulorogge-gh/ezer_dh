const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
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

// OBS: o servidor HTTP e o serviço de frontend estático foram movidos para src/server.js

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


