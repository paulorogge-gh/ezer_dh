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
      else {
        // Fallback quando a raiz publicada contém subpasta 'ezer_dh'
        const alt3 = path.resolve(process.cwd(), 'ezer_dh/frontend/public');
        if (fs.existsSync(alt3)) FRONTEND_PUBLIC = alt3;
      }
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

// /login com fallback se arquivo não existir
app.get('/login', (req, res) => {
  try {
    const loginPath = path.join(FRONTEND_PUBLIC, 'login.html');
    if (fs.existsSync(loginPath)) {
      return res.sendFile(loginPath);
    }
    // Tentar caminho alternativo quando FRONTEND_PUBLIC não aponta corretamente
    const altLogin1 = path.resolve(process.cwd(), 'ezer_dh/frontend/public/login.html');
    if (fs.existsSync(altLogin1)) {
      return res.sendFile(altLogin1);
    }
  } catch {}
  // Fallback mínimo de login (POST /api/auth/login)
  res.type('html').send(
    `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Login - Ezer DH</title>
      <style>
        body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; margin:0;}
        .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc}
        .card{max-width:420px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 6px 24px rgba(15,23,42,.06);}
        .card-body{padding:24px;text-align:center}
        .title{margin:0 0 12px;font-weight:600;color:#1f2937}
        .field{margin-bottom:12px;text-align:left}
        .label{display:block;margin-bottom:6px;color:#334155;font-weight:500}
        .input{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px}
        .btn{display:inline-block;width:100%;padding:10px 16px;border-radius:8px;background:#8b5e34;color:#fff;text-decoration:none;border:none;cursor:pointer}
        .msg{margin-top:10px;color:#b91c1c;font-size:.9rem}
      </style>
    </head>
    <body>
      <main class="wrap">
        <div class="card"><div class="card-body">
          <h2 class="title">Entrar</h2>
          <div class="field"><label class="label" for="email">E-mail</label><input class="input" id="email" type="email" placeholder="email@dominio.com"></div>
          <div class="field"><label class="label" for="password">Senha</label><input class="input" id="password" type="password" placeholder="Sua senha"></div>
          <button class="btn" id="loginBtn">Entrar</button>
          <div class="msg" id="msg"></div>
        </div></div>
      </main>
      <script>
        (function(){
          const btn = document.getElementById('loginBtn');
          const msg = document.getElementById('msg');
          btn.addEventListener('click', async function(){
            msg.textContent = '';
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            if (!email || !password) { msg.textContent = 'Informe e-mail e senha.'; return; }
            try {
              const resp = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
              const j = await resp.json();
              if (!j.success) { msg.textContent = j.error || 'Falha no login'; return; }
              // Salvar token em cookie simples (compatível com frontend atual)
              try { document.cookie = 'ezer_session=1; path=/; SameSite=Lax'; } catch {}
              window.location.href = '/dashboard';
            } catch (e) { msg.textContent = e.message || 'Erro ao autenticar'; }
          });
        })();
      </script>
    </body>
    </html>`
  );
});
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


