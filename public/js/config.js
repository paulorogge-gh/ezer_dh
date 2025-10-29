/* ==================================================
   EZER DESENVOLVIMENTO HUMANO - CONFIGURAÇÃO DINÂMICA
   ================================================== */

// Detectar ambiente
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const host = window.location.hostname;
const port = window.location.port;

// Em desenvolvimento (frontend porta 8080), apontar backend para mesma máquina na porta 8000
function getDevApiOrigin() {
  return `http://${host}:8000`;
}

// Configuração dinâmica da API
const API_CONFIG = {
  BASE_URL: (function(){
    if (isLocalhost || port === '8080') return `${getDevApiOrigin()}/api`;
    // Em produção (reverse proxy), a API rodará sob o mesmo origin
    return `${window.location.origin}/api`;
  })(),

  HEALTH_URL: (function(){
    if (isLocalhost || port === '8080') return `${getDevApiOrigin()}/api/health`;
    return `${window.location.origin}/api/health`;
  })(),

  LOGIN_URL: (function(){
    if (isLocalhost || port === '8080') return `${getDevApiOrigin()}/api/auth/login`;
    return `${window.location.origin}/api/auth/login`;
  })()
};

// Log da configuração detectada
console.log('🔧 Configuração detectada:', {
  hostname: host,
  port: port,
  isLocalhost: isLocalhost,
  apiBaseUrl: API_CONFIG.BASE_URL
});

// Configurações do frontend
const FRONTEND_CONFIG = {
  LOGIN_PAGE: '/login.html',
  LOGIN_URL: '/login.html',
  DASHBOARD_URL: '/dashboard.html'
};

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.FRONTEND_CONFIG = FRONTEND_CONFIG;
// Performance knobs
window.PERF_CONFIG = {
  CACHE_TTL_MS: 60 * 1000,
  FRONTEND_STATUS_INTERVAL_MS: 5 * 60 * 1000
};
