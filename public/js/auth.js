/* ==================================================
   EZER DESENVOLVIMENTO HUMANO - SISTEMA DE AUTENTICAÇÃO
   ================================================== */

// ==================================================
// 1. CONFIGURAÇÕES DE AUTENTICAÇÃO
// ==================================================
const AuthConfig = {
    TOKEN_KEY: 'ezer_token',
    USER_KEY: 'ezer_user',
    REFRESH_TOKEN_KEY: 'ezer_refresh_token',
    API_BASE_URL: window.API_CONFIG ? window.API_CONFIG.BASE_URL : `${window.location.origin}/api`
};

// ==================================================
// 2. CLASSE DE AUTENTICAÇÃO
// ==================================================
class AuthManager {
    constructor() {
        this.token = localStorage.getItem(AuthConfig.TOKEN_KEY);
        this.user = JSON.parse(localStorage.getItem(AuthConfig.USER_KEY) || 'null');
        this.refreshToken = localStorage.getItem(AuthConfig.REFRESH_TOKEN_KEY);
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        const hasToken = !!this.token;
        const hasUser = !!this.user;
        const isTokenValid = this.isTokenValid();
        
        console.log('🔍 Verificando login:', {
            hasToken,
            hasUser,
            isTokenValid,
            result: hasToken && hasUser && isTokenValid
        });
        
        return hasToken && hasUser && isTokenValid;
    }

    // Verificar se token está válido
    isTokenValid() {
        if (!this.token) {
            console.log('❌ Nenhum token encontrado');
            return false;
        }
        
        try {
            // Verificar se o token tem o formato correto (3 partes separadas por ponto)
            const parts = this.token.split('.');
            if (parts.length !== 3) {
                console.log('❌ Token com formato inválido');
                return false;
            }
            
            const payload = JSON.parse(atob(parts[1]));
            const now = Date.now() / 1000;
            const isValid = payload.exp > now;
            
            if (isValid) {
                console.log('✅ Token válido');
            } else {
                console.log('❌ Token expirado');
            }
            
            return isValid;
        } catch (error) {
            console.log('❌ Erro ao validar token:', error);
            return false;
        }
    }

    // Fazer login
    async login(email, password) {
        try {
            const response = await fetch(`${AuthConfig.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Garantir que a resposta seja JSON
            let data;
            try {
                data = await response.json();
            } catch (e) {
                return { success: false, error: `Resposta inválida do servidor (${response.status})` };
            }

            if (response.ok && data && data.success) {
                this.token = data.data.accessToken;
                this.refreshToken = data.data.refreshToken;
                this.user = data.data.user;

                // Salvar no localStorage
                localStorage.setItem(AuthConfig.TOKEN_KEY, this.token);
                localStorage.setItem(AuthConfig.REFRESH_TOKEN_KEY, this.refreshToken);
                localStorage.setItem(AuthConfig.USER_KEY, JSON.stringify(this.user));
                try {
                    // Criar cookie simples para guarda de rotas no servidor de frontend
                    document.cookie = `ezer_session=1; path=/; max-age=${60 * 60 * 4}`; // 4h
                } catch {}

                return { success: true, user: this.user };
            } else {
                const errMsg = data?.error || 'Falha no login';
                return { success: false, error: errMsg };
            }
        } catch (error) {
            console.error('Erro de conexão:', error);
            return { success: false, error: `Erro de conexão: ${error.message}` };
        }
    }

    // Fazer logout
    async logout() {
        try {
            if (this.token) {
                await fetch(`${AuthConfig.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        } finally {
            // Limpar dados locais
            this.token = null;
            this.user = null;
            this.refreshToken = null;
            
            // Limpar todos os itens de autenticação do localStorage
            localStorage.removeItem(AuthConfig.TOKEN_KEY);
            localStorage.removeItem(AuthConfig.USER_KEY);
            localStorage.removeItem(AuthConfig.REFRESH_TOKEN_KEY);
            
            // Limpar também possíveis chaves antigas
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_refresh_token');
            
            // Marcar que o logout foi iniciado pelo usuário para evitar auto-login
            try { localStorage.setItem('logged_out_by_user', '1'); } catch (e) {}
            console.log('✅ Logout realizado com sucesso');
            try {
                // Remover cookie de sessão
                document.cookie = 'ezer_session=; path=/; max-age=0';
            } catch {}
        }
    }

    // Renovar token
    async refreshAccessToken() {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${AuthConfig.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.accessToken;
                localStorage.setItem(AuthConfig.TOKEN_KEY, this.token);
                return true;
            } else {
                await this.logout();
                return false;
            }
        } catch (error) {
            await this.logout();
            return false;
        }
    }

    // Verificar e renovar token se necessário
    async ensureValidToken() {
        if (!this.isLoggedIn()) return false;

        if (this.isTokenValid()) {
            return true;
        }

        // Tentar renovar token
        const refreshed = await this.refreshAccessToken();
        return refreshed;
    }

    // Obter headers de autorização (sem Content-Type por padrão)
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Obter payload do token (id, role, id_referencia, exp)
    getTokenPayload() {
        try {
            if (!this.token) return null;
            const parts = this.token.split('.');
            if (parts.length !== 3) return null;
            const payloadJson = atob(parts[1]);
            return JSON.parse(payloadJson);
        } catch (e) { return null; }
    }

    // Obter referência do usuário (role e id_referencia)
    getUserReference() {
        const payload = this.getTokenPayload();
        if (!payload) return null;
        return {
            role: payload.role,
            idUsuario: payload.id,
            idEmpresa: payload.empresa_id || null,
            idConsultoria: payload.consultoria_id || null
        };
    }

    // Fazer requisição autenticada
    async authenticatedRequest(url, options = {}) {
        // Throttle do server-status (uma vez a cada 5 minutos)
        try {
            const now = Date.now();
            const intervalMs = 5 * 60 * 1000;
            if (!this._lastFrontendStatusCheck || (now - this._lastFrontendStatusCheck) > intervalMs) {
                this._lastFrontendStatusCheck = now;
                const statusUrl = `${window.location.origin}/server-status`;
                const statusResp = await fetch(statusUrl, { method: 'GET', cache: 'no-store' });
                if (statusResp.headers.get('X-Server-Restart') === 'true') {
                    console.log('🔔 Frontend server informou reinício via header');
                    this.forceLogout();
                    window.location.href = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login.html';
                    throw new Error('Servidor frontend reiniciado');
                }
            }
        } catch (error) {
            // Não falhar por conta do status check
        }

        const validToken = await this.ensureValidToken();
        
        if (!validToken) {
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        const headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        // Se for FormData, não definir Content-Type para permitir boundary automático
        try {
            if (options && options.body && (options.body instanceof FormData)) {
                if (headers['Content-Type']) delete headers['Content-Type'];
                if (headers['content-type']) delete headers['content-type'];
            }
        } catch {}
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            await this.logout();
            window.location.href = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login.html';
            throw new Error('Sessão expirada');
        }
        
        return response;
    }

    // Obter perfil do usuário
    async getProfile() {
        try {
            const response = await this.authenticatedRequest(`${AuthConfig.API_BASE_URL}/auth/profile`);
            const data = await response.json();
            
            if (data.success) {
                this.user = data.data;
                localStorage.setItem(AuthConfig.USER_KEY, JSON.stringify(this.user));
                return data.data;
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            return null;
        }
    }

    // Verificar permissões
    hasPermission(permission) {
        if (!this.user) return false;
        
        const role = this.user.role;
        
        // Mapeamento de permissões por role
        const permissions = {
            'consultoria': ['*'], // Acesso total
            'empresa': ['read_own', 'manage_own'],
            'colaborador': ['read_own']
        };

        const userPermissions = permissions[role] || [];
        return userPermissions.includes('*') || userPermissions.includes(permission);
    }

    // Forçar logout e limpar tudo
    forceLogout() {
        console.log('🔄 Forçando logout...');
        
        // Limpar todas as variáveis
        this.token = null;
        this.user = null;
        this.refreshToken = null;
        
        // Limpar todo o localStorage
        localStorage.clear();
        
        console.log('✅ Logout forçado realizado');
    }

    // Verificar se servidor foi reiniciado
    checkServerRestart() {
        // Verificar se há flag de reinicialização no localStorage
        const restartFlag = localStorage.getItem('server_restart_flag');
        if (restartFlag) {
            console.log('🔄 Servidor foi reiniciado, forçando logout');
            this.forceLogout();
            return true;
        }
        return false;
    }

    // Marcar flag de reinicialização do servidor
    markServerRestart() {
        localStorage.setItem('server_restart_flag', 'true');
        console.log('🔄 Flag de reinicialização do servidor marcada');
    }
}

// ==================================================
// 3. INSTÂNCIA GLOBAL
// ==================================================
const auth = new AuthManager();

// ==================================================
// 4. FUNÇÕES DE VERIFICAÇÃO DE SESSÃO
// ==================================================

// Verificar se deve redirecionar para login
async function checkAuthAndRedirect() {
    const isValid = await auth.ensureValidToken();
    if (!isValid) {
        const loginPath = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login.html';
        if (!window.location.pathname.includes(loginPath)) {
            window.location.href = loginPath;
        }
        return false;
    }
    return true;
}

// Verificar se usuário já está logado (para página de login)
function checkIfAlreadyLoggedIn() {
    if (auth.isLoggedIn() && auth.isTokenValid()) {
        window.location.href = window.FRONTEND_CONFIG?.DASHBOARD_URL || '/dashboard.html';
    }
}

// ==================================================
// 5. INICIALIZAÇÃO AUTOMÁTICA
// ==================================================

// Executar verificação quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    const currentPath = window.location.pathname;
    const loginPath = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login.html';
    if (currentPath === loginPath || currentPath.includes(loginPath)) {
        checkIfAlreadyLoggedIn();
    } else {
        await checkAuthAndRedirect();
    }
});

// ==================================================
// 6. EXPORTAR PARA USO GLOBAL
// ==================================================
window.AuthManager = AuthManager;
window.auth = auth;
window.checkAuthAndRedirect = checkAuthAndRedirect;
window.checkIfAlreadyLoggedIn = checkIfAlreadyLoggedIn;