const path = require('path');
const { exec } = require('child_process');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

const isProd = (process.env.NODE_ENV === 'production');
app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));
// Permitir same-origin e origens válidas automaticamente no ambiente unificado
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

// Servir frontend estático (desabilitar index automático)
const FRONTEND_PUBLIC = path.resolve(process.cwd(), 'public');
app.use(express.static(FRONTEND_PUBLIC, { index: false }));

function pageRoute(routePath, fileName) {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(FRONTEND_PUBLIC, fileName));
  });
}

// Rotas de páginas (deduplicadas)
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

app.get('/', (req, res) => {
  res.redirect('/login');
});

// Favicon (reduz 404 de navegadores)
app.get('/favicon.ico', (req, res) => {
  res.redirect('/favicon.svg');
});

// Handler de erros deve ser o último
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log('🚀 ================================================');
  console.log('   EZER DESENVOLVIMENTO HUMANO - UNIFIED SERVER');
  console.log('🚀 ================================================');
  console.log(`🔧 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏱️ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('🚀 ================================================');
  // Abrir frontend automaticamente em desenvolvimento
  try {
    const autoOpen = (process.env.AUTO_OPEN_LOGIN || 'true') === 'true';
    if (!isProd && autoOpen) {
      const url = `http://localhost:${PORT}/login`;
      const platform = process.platform;
      let command;
      if (platform === 'win32') {
        command = `cmd /c start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }
      exec(command, (err) => {
        if (err) {
          console.warn('Não foi possível abrir o navegador automaticamente:', err.message);
        } else {
          console.log(`🧭 Abrindo navegador em: ${url}`);
        }
      });
    }
  } catch (e) {
    console.warn('Não foi possível preparar abertura automática do navegador:', e?.message);
  }
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


