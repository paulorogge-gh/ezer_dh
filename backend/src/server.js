const path = require('path');
const app = require('./app');

const PORT = parseInt(process.env.PORT || process.env.PORT_API, 10) || 8000;

// Servir frontend estático a partir de ezer_dh/frontend/public
const FRONTEND_PUBLIC = path.join(__dirname, '../../frontend/public');
app.use(require('express').static(FRONTEND_PUBLIC));

// Mapear rotas amigáveis para páginas front
function pageRoute(routePath, fileName) {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(FRONTEND_PUBLIC, fileName));
  });
}

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

const server = app.listen(PORT, () => {
  console.log('🚀 ================================================');
  console.log('   EZER DESENVOLVIMENTO HUMANO - UNIFIED SERVER');
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


