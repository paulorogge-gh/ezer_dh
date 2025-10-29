const path = require('path');
const app = require('./app');

const PORT = parseInt(process.env.PORT || process.env.PORT_API, 10) || 8000;

// Servir frontend estático a partir de ../frontend/public (robusto para Azure)
const fs = require('fs');
let FRONTEND_PUBLIC = path.join(__dirname, '../../frontend/public');
try {
  if (!fs.existsSync(FRONTEND_PUBLIC)) {
    // Fallback quando a estrutura de deploy coloca backend como cwd
    const alt1 = path.resolve(process.cwd(), '../frontend/public');
    if (fs.existsSync(alt1)) FRONTEND_PUBLIC = alt1;
    else {
      // Fallback adicional quando conteúdo é publicado com raiz diferente
      const alt2 = path.resolve(process.cwd(), 'frontend/public');
      if (fs.existsSync(alt2)) FRONTEND_PUBLIC = alt2;
    }
  }
} catch {}
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

// Index com botão para login
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(FRONTEND_PUBLIC, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  } catch {}
  // Fallback: responder uma página mínima com botão de login
  res.type('html').send(
    `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Ezer DH</title>
      <style>
        body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; margin:0;}
        .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc}
        .card{max-width:560px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 6px 24px rgba(15,23,42,.06);}
        .card-body{padding:24px;text-align:center}
        .title{margin:0 0 8px;font-weight:600;color:#1f2937}
        .text{margin:0 0 16px;color:#64748b}
        .btn{display:inline-block;padding:10px 16px;border-radius:8px;background:#8b5e34;color:#fff;text-decoration:none}
      </style>
    </head>
    <body>
      <main class="wrap">
        <div class="card"><div class="card-body">
          <h2 class="title">Ezer Desenvolvimento Humano</h2>
          <p class="text">Clique abaixo para acessar o login.</p>
          <a class="btn" href="/login">Entrar</a>
        </div></div>
      </main>
    </body>
    </html>`
  );
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


