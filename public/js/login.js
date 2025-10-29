/* ==================================================
   EZER DESENVOLVIMENTO HUMANO - PÁGINA DE LOGIN
   ================================================== */

// ==================================================
// 1. INICIALIZAÇÃO
// ==================================================
function initLoginPage() {
    console.log('📄 Inicializando página de login');
    // Verificar se auth.js foi carregado
    if (typeof auth === 'undefined') {
        console.error('❌ auth.js não foi carregado!');
        loginShowAlert('Erro ao carregar sistema de autenticação. Recarregue a página.', 'danger');
        return;
    }
    console.log('✅ auth.js carregado com sucesso');
    // Verificar se usuário já está logado
    if (typeof checkIfAlreadyLoggedIn === 'function') {
        try { checkIfAlreadyLoggedIn(); } catch(e) {}
    }
    // Configurar formulário de login
    setupLoginForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    // Se o DOM já estiver pronto, inicializar imediatamente
    initLoginPage();
}

// ==================================================
// 1.1. FUNÇÃO DE LOGIN SIMPLIFICADA (chamada pelo HTML)
// ==================================================
async function handleLoginSubmit(event) {
    console.log('🚀 handleLoginSubmit chamada!');
    event.preventDefault();
    event.stopPropagation();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password ? '***' : 'vazia');
    
    if (!email || !password) {
        loginShowAlert('Por favor, preencha todos os campos.', 'danger');
        return;
    }
    
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    submitButton.disabled = true;
    
    try {
        console.log('🔄 Fazendo login...');
        const result = await auth.login(email, password);
        console.log('📥 Resultado:', result);
        
            if (result.success) {
            loginShowAlert('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = window.FRONTEND_CONFIG?.DASHBOARD_URL || '/dashboard.html';
            }, 1500);
        } else {
            loginShowAlert(result.error || 'Erro ao fazer login.', 'danger');
        }
    } catch (error) {
        console.error('💥 Erro:', error);
        loginShowAlert('Erro de conexão: ' + error.message, 'danger');
    } finally {
        submitButton.classList.remove('btn-loading');
        submitButton.disabled = false;
    }
}

// ==================================================
// 2. CONFIGURAÇÃO DO FORMULÁRIO
// ==================================================
function setupLoginForm() {
    console.log('🔧 Configurando formulário de login...');
    
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.querySelector('button[type="submit"]');
    const alertContainer = document.getElementById('alertContainer');

    if (!loginForm) {
        console.error('❌ Formulário de login não encontrado!');
        return;
    }

    console.log('✅ Formulário encontrado:', loginForm);

    // Adicionar event listeners
    loginForm.addEventListener('submit', handleLogin);
    emailInput.addEventListener('input', clearErrors);
    passwordInput.addEventListener('input', clearErrors);

    // Focar no campo de email
    emailInput.focus();
    
    console.log('✅ Formulário de login configurado com sucesso!');
}

// ==================================================
// 3. HANDLER DE LOGIN
// ==================================================
async function handleLogin(event) {
    console.log('🚀 Iniciando processo de login...');
    event.preventDefault();
    event.stopPropagation();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const rememberMeEl = document.getElementById('rememberMe');
    const rememberMe = !!(rememberMeEl && rememberMeEl.checked);

    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password ? '***' : 'vazia');

    // Validação básica
    if (!email || !password) {
        loginShowAlert('Por favor, preencha todos os campos.', 'danger');
        return;
    }

    // Mostrar loading
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    submitButton.disabled = true;

    try {
        console.log('🔄 Fazendo requisição de login...');
        // Fazer login
        const result = await auth.login(email, password);
        console.log('📥 Resultado do login:', result);

        if (result.success) {
            console.log('✅ Login realizado com sucesso!');
            loginShowAlert('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                console.log('🔄 Redirecionando para dashboard...');
                window.location.href = window.FRONTEND_CONFIG?.DASHBOARD_URL || '/dashboard.html';
            }, 1500);
        } else {
            console.log('❌ Erro no login:', result.error);
            loginShowAlert(result.error || 'Erro ao fazer login. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('💥 Erro no login:', error);
        loginShowAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'danger');
    } finally {
        // Restaurar botão
        submitButton.classList.remove('btn-loading');
        submitButton.disabled = false;
    }
}

// ==================================================
// 4. FUNÇÕES DE INTERFACE
// ==================================================

// Mostrar alerta (padrão global alerts.js)
function loginShowAlert(message, type = 'info') {
    try {
        if (window.showAlert && window.showAlert !== loginShowAlert) {
            window.showAlert(type, message);
            return;
        }
    } catch {}
    // Fallback mínimo caso alerts.js não esteja disponível
    try {
        const containerId = 'alertContainer';
        let alertContainer = document.getElementById(containerId);
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = containerId;
            alertContainer.className = 'mt-3';
            const form = document.getElementById('loginForm');
            if (form && form.parentNode) form.parentNode.insertBefore(alertContainer, form.nextSibling);
        }
        alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    } catch (e) {
        console.warn('Fallback de alerta (login):', e);
        try { EzerNotifications?.[type === 'danger' ? 'error' : type]?.(message); } catch {}
    }
}

// Obter ícone do alerta
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle-fill',
        'danger': 'exclamation-triangle-fill',
        'warning': 'exclamation-triangle-fill',
        'info': 'info-circle-fill'
    };
    return icons[type] || 'info-circle-fill';
}

// Mostrar esqueci a senha
function showForgotPassword() {
    try { window.showAlert('info', 'Funcionalidade em desenvolvimento'); } 
    catch { try { loginShowAlert('Funcionalidade em desenvolvimento', 'info'); } catch(e) {} }
}

// Limpar erros
function clearErrors() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        try {
            // Se bootstrap estiver disponível, utilize; caso contrário, remova o elemento
            if (window.bootstrap && window.bootstrap.Alert) {
                const bsAlert = new window.bootstrap.Alert(alert);
                bsAlert.close();
            } else {
                alert.remove();
            }
        } catch (e) {
            try { alert.remove(); } catch {}
        }
    });
}

// ==================================================
// 5. FUNÇÕES DE UTILIDADE
// ==================================================

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Formatar email (remover espaços, converter para minúsculas)
function formatEmail(email) {
    return email.trim().toLowerCase();
}

// ==================================================
// 6. EVENT LISTENERS ADICIONAIS
// ==================================================

// Enter para enviar formulário
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const form = document.getElementById('loginForm');
        if (form && document.activeElement.form === form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// Mostrar/ocultar senha
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = '<i class="bi bi-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '<i class="bi bi-eye"></i>';
    }
}

// ==================================================
// 7. EXPORTAR FUNÇÕES GLOBAIS
// ==================================================
window.togglePasswordVisibility = togglePasswordVisibility;
// Alias para compatibilidade com login-minimal
window.togglePassword = togglePasswordVisibility;
