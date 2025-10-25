const express = require('express');
const path = require('path');

// Servidor DEV-ONLY para pré-visualizar estáticos do frontend
// Em produção, os arquivos são servidos pelo backend (ver README)

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos diretamente
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal: redireciona para login minimal
app.get('/', (req, res) => {
  res.redirect('/login-minimal');
});

// Status do servidor para debug
app.get('/server-status', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log('🌐 ================================================');
  console.log('   EZER DESENVOLVIMENTO HUMANO - FRONTEND (DEV-ONLY)');
  console.log('🌐 ================================================');
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login-minimal`);
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log('🌐 ================================================');
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
