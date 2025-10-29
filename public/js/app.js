/* ==================================================
   EZER DESENVOLVIMENTO HUMANO - JAVASCRIPT GLOBAL
   ================================================== */

// ==================================================
// 1. CONFIGURAÇÕES GLOBAIS
// ==================================================
const EZER_CONFIG = {
    API_BASE_URL: (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : `${window.location.origin}/api`,
    VERSION: '1.0.0',
    DEBUG: true
};

// ==================================================
// 2. VERIFICAÇÃO DE AUTENTICAÇÃO
// ==================================================
// Verificar se há sessão ativa ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    const currentPath = window.location.pathname;
    
    // Se não estiver na página de login, verificar autenticação
    const loginPath = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login-minimal';
    if (!currentPath.includes(loginPath)) {
        if (typeof auth !== 'undefined') {
            const isValid = await auth.ensureValidToken();
            if (!isValid) {
                window.location.href = loginPath;
                return;
            }
            
            // Atualizar informações do usuário na interface
            updateUserInterface();
        }
    }
});

// ==================================================
// 3. FUNÇÕES DE INTERFACE DO USUÁRIO
// ==================================================
function updateUserInterface() {
    if (typeof auth !== 'undefined' && auth.user) {
        // Atualizar nome/email do usuário no sidebar
        try {
            const nameEls = document.querySelectorAll('.user-name');
            const emailEls = document.querySelectorAll('.user-email');
            nameEls.forEach(el => el.textContent = auth.user.nome || auth.user.email || 'Usuário');
            emailEls.forEach(el => el.textContent = auth.user.email || '');
        } catch {}

        // Mostrar/ocultar elementos baseado no role
        updateInterfaceByRole(auth.user.role);
    }
}

function updateInterfaceByRole(role) {
    // Ocultar elementos que o usuário não tem permissão
    const elementsToHide = {
        'colaborador': ['.admin-only', '.empresa-only'],
        'empresa': ['.consultoria-only'],
        'consultoria': []
    };

    const elements = elementsToHide[role] || [];
    elements.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.style.display = 'none';
        });
    });
}

// ==================================================
// 4. FUNÇÕES DE NAVEGAÇÃO E LOGOUT
// ==================================================

// Fazer logout
async function logout() {
    let ok = true;
    try {
        ok = await (window.showLogoutConfirm ? showLogoutConfirm() : (window.showConfirm ? showConfirm({
            title: 'Sair do sistema',
            message: 'Você será desconectado e precisará fazer login novamente. Deseja sair agora?',
            confirmText: 'Sair',
            cancelText: 'Cancelar'
        }) : Promise.resolve(confirm('Tem certeza que deseja sair?'))));
    } catch {}
    if (!ok) return;
    if (typeof auth !== 'undefined') {
        await auth.logout();
    }
    window.location.href = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login-minimal';
}

// Mostrar perfil do usuário
function showProfile() {
    if (typeof auth !== 'undefined' && auth.user) {
        const user = auth.user;
        const profileInfo = `
            <div class="row">
                <div class="col-md-6">
                    <strong>Nome:</strong> ${user.nome || 'N/A'}<br>
                    <strong>Email:</strong> ${user.email || 'N/A'}<br>
                    <strong>Tipo:</strong> ${user.role || 'N/A'}<br>
                </div>
                <div class="col-md-6">
                    <strong>Último Login:</strong> ${user.ultimo_login ? new Date(user.ultimo_login).toLocaleString() : 'N/A'}<br>
                    <strong>Status:</strong> ${user.status || 'N/A'}<br>
                </div>
            </div>
        `;
        
        showModal('Meu Perfil', profileInfo);
    }
}

// Mostrar configurações
function showSettings() {
    const settingsContent = `
        <div class="row">
            <div class="col-12">
                <h6>Configurações de Conta</h6>
                <div class="list-group">
                    <a href="#" class="list-group-item list-group-item-action" onclick="changePassword()">
                        <i class="bi bi-key me-2"></i>Alterar Senha
                    </a>
                    <a href="#" class="list-group-item list-group-item-action" onclick="showNotifications()">
                        <i class="bi bi-bell me-2"></i>Notificações
                    </a>
                    <a href="#" class="list-group-item list-group-item-action" onclick="showPreferences()">
                        <i class="bi bi-gear me-2"></i>Preferências
                    </a>
                </div>
            </div>
        </div>
    `;
    
    showModal('Configurações', settingsContent);
}

// Alterar senha
function changePassword() {
    const changePasswordContent = `
        <form id="changePasswordForm">
            <div class="mb-3">
                <label for="currentPassword" class="form-label">Senha Atual</label>
                <input type="password" class="form-control" id="currentPassword" required>
            </div>
            <div class="mb-3">
                <label for="newPassword" class="form-label">Nova Senha</label>
                <input type="password" class="form-control" id="newPassword" required>
            </div>
            <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirmar Nova Senha</label>
                <input type="password" class="form-control" id="confirmPassword" required>
            </div>
            <div class="d-grid">
                <button type="submit" class="btn btn-primary">Alterar Senha</button>
            </div>
        </form>
    `;
    
    showModal('Alterar Senha', changePasswordContent);
    
    // Configurar formulário
    document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showAlert('As senhas não coincidem!', 'danger');
            return;
        }
        
        if (newPassword.length < 6) {
            showAlert('A nova senha deve ter pelo menos 6 caracteres!', 'danger');
            return;
        }
        
        try {
            const response = await auth.authenticatedRequest(`${EZER_CONFIG.API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('Senha alterada com sucesso!', 'success');
                bootstrap.Modal.getInstance(document.querySelector('.modal')).hide();
            } else {
                showAlert(data.error || 'Erro ao alterar senha!', 'danger');
            }
        } catch (error) {
            showAlert('Erro ao alterar senha!', 'danger');
        }
    });
}

// Mostrar notificações
function showNotifications() {
    showModal('Notificações', '<p>Funcionalidade em desenvolvimento...</p>');
}

// Mostrar preferências
function showPreferences() {
    showModal('Preferências', '<p>Funcionalidade em desenvolvimento...</p>');
}

// ==================================================
// 5. UTILITÁRIOS GLOBAIS
// ==================================================
const EzerUtils = {
    // Formatar CPF
    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatar CNPJ
    formatCNPJ(cnpj) {
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    },

    // Formatar telefone
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    },

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Formatar data
    formatDate(date, format = 'dd/MM/yyyy') {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'dd/MM/yyyy':
                return `${day}/${month}/${year}`;
            case 'yyyy-MM-dd':
                return `${year}-${month}-${day}`;
            case 'dd/MM/yyyy HH:mm':
                return `${day}/${month}/${year} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            default:
                return d.toLocaleDateString('pt-BR');
        }
    },

    // Validar CPF
    validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf.charAt(10));
    },

    // Validar e-mail
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Debounce para inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Mostrar loading
    showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '<div class="spinner"></div>';
        }
    },

    // Esconder loading
    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '';
        }
    }
};

// ==================================================
// 5.1 RBAC Helpers (Empresas)
// ==================================================
const EzerRBAC = {
  async fetchEmpresasAll() {
    try {
      const r = await auth.authenticatedRequest(`${(window.API_CONFIG?.BASE_URL||EZER_CONFIG.API_BASE_URL)}/empresas`, { method: 'GET' });
      const j = await r.json();
      return j.success ? (j.data || []) : [];
    } catch { return []; }
  },
  async populateEmpresaSelect(selectEl, { includeEmpty = true } = {}) {
    if (!selectEl) return { list: [], selected: null };
    const prev = selectEl.value;
    let list = await this.fetchEmpresasAll();
    // Filtrar por role
    try {
      const role = auth?.user?.role;
      if (role === 'empresa' || role === 'colaborador') {
        const myId = auth?.user?.id_empresa || auth?.user?.id_referencia || null;
        list = (list || []).filter(e => e.id_empresa === myId);
      }
    } catch {}
    // Popular opções
    const opts = (includeEmpty ? ['<option value="">Todas</option>'] : [])
      .concat((list || []).map(e => `<option value="${e.id_empresa}">${EzerUtils.formatText ? EzerUtils.formatText(e.nome) : (e.nome || '')}</option>`));
    selectEl.innerHTML = opts.join('');
    // Restaurar seleção anterior se existir
    const exists = prev === '' || (list || []).some(e => String(e.id_empresa) === prev);
    const selected = exists ? prev : (list[0]?.id_empresa ? String(list[0].id_empresa) : '');
    if (exists) selectEl.value = prev; else selectEl.value = selected;
    // Para role empresa/colaborador, desabilitar select (apenas sua empresa)
    try {
      const role = auth?.user?.role;
      if (role === 'empresa' || role === 'colaborador') {
        selectEl.disabled = true;
      } else {
        selectEl.disabled = false;
      }
    } catch {}
    return { list, selected: selectEl.value };
  },
  getUserEmpresaId() {
    try {
      return auth?.user?.id_empresa || auth?.user?.id_referencia || null;
    } catch { return null; }
  }
};

// ==================================================
// 3. GERENCIADOR DE API
// ==================================================
const EzerAPI = {
    // Fazer requisição HTTP
    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : EZER_CONFIG.API_BASE_URL;
            const response = await fetch(`${base}${url}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // GET
    async get(url) {
        return this.request(url, { method: 'GET' });
    },

    // POST
    async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // PUT
    async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // DELETE
    async delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};

// ==================================================
// 4. GERENCIADOR DE NOTIFICAÇÕES
// ==================================================
const EzerNotifications = {
    // Mostrar notificação
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 2147483647; min-width: 300px; pointer-events: auto;';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    },

    // Sucesso
    success(message) {
        this.show(message, 'success');
    },

    // Erro
    error(message) {
        this.show(message, 'danger');
    },

    // Aviso
    warning(message) {
        this.show(message, 'warning');
    },

    // Info
    info(message) {
        this.show(message, 'info');
    }
};

// ==================================================
// 5. GERENCIADOR DE MODAIS
// ==================================================
const EzerModals = {
    // Mostrar modal
    show(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
        return modal;
    },

    // Esconder modal
    hide(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    },

    // Resetar formulário do modal
    resetForm(modalId) {
        const modal = document.getElementById(modalId);
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
};

// ==================================================
// 6. GERENCIADOR DE TABELAS
// ==================================================
const EzerTables = {
    // Inicializar DataTable
    init(tableId, options = {}) {
        const defaultOptions = {
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
            },
            responsive: true,
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50, 100],
            order: [[0, 'desc']],
            columnDefs: [
                { orderable: false, targets: -1 } // Última coluna (ações) não ordenável
            ]
        };

        return $(`#${tableId}`).DataTable({ ...defaultOptions, ...options });
    },

    // Atualizar dados da tabela
    updateData(tableId, data) {
        const table = $(`#${tableId}`).DataTable();
        table.clear();
        table.rows.add(data);
        table.draw();
    }
};

// ==================================================
// 7. GERENCIADOR DE FORMULÁRIOS
// ==================================================
const EzerForms = {
    // Serializar formulário
    serialize(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    },

    // Validar formulário
    validate(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        return isValid;
    },

    // Limpar validação
    clearValidation(form) {
        const inputs = form.querySelectorAll('.is-invalid');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
    }
};

// ==================================================
// 8. MÁSCARAS GLOBAIS (CPF, CNPJ, TELEFONE)
// ==================================================
const EzerMasks = {
    // Permitir apenas números
    onlyDigits(value) {
        return (value || '').toString().replace(/\D/g, '');
    },
    // Aplicar máscara CPF
    maskCPF(value) {
        const digits = this.onlyDigits(value).slice(0, 11);
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})$/, (m, a, b, c, d) => d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`);
    },
    // Aplicar máscara CNPJ
    maskCNPJ(value) {
        const digits = this.onlyDigits(value).slice(0, 14);
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, (m, a, b, c, d, e) => e ? `${a}.${b}.${c}/${d}-${e}` : `${a}.${b}.${c}/${d}`);
    },
    // Aplicar máscara Telefone (10 ou 11 dígitos)
    maskPhone(value) {
        const digits = this.onlyDigits(value).slice(0, 11);
        if (digits.length <= 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{0,4})$/, (m, a, b, c) => c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`);
        }
        return digits.replace(/(\d{2})(\d{5})(\d{0,4})$/, (m, a, b, c) => c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`);
    },
    // Aplicar máscara CEP (00000-000)
    maskCEP(value) {
      const digits = this.onlyDigits(value).slice(0, 8);
      return digits.replace(/(\d{5})(\d{0,3})$/, (m, a, b) => b ? `${a}-${b}` : `${a}`);
    },
    // Aplicar máscara Data (dd/mm/yyyy)
    maskDate(value) {
      const digits = this.onlyDigits(value).slice(0, 8);
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return digits.replace(/(\d{2})(\d{0,2})/, (m, d, mo) => mo ? `${d}/${mo}` : `${d}/`);
      return digits.replace(/(\d{2})(\d{2})(\d{0,4})/, (m, d, mo, y) => y ? `${d}/${mo}/${y}` : `${d}/${mo}`);
    },
    // Aplicar máscara de moeda BRL (1.234,56)
    maskCurrencyBRL(value) {
      try {
        let digits = this.onlyDigits(value);
        if (!digits) return '';
        // Remover zeros à esquerda para evitar "00,12" ao digitar
        digits = digits.replace(/^0+/, '');
        // Garantir pelo menos 3 dígitos (00 centavos)
        const padded = digits.padStart(3, '0');
        const cents = padded.slice(-2);
        let integer = padded.slice(0, -2);
        // Adicionar separador de milhar
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${integer},${cents}`;
      } catch { return value; }
    },
    attachMask(el, type) {
        if (!el) return;
        // Não aplicar máscara de data em inputs nativos type="date"
        if (type === 'date' && el.type === 'date') {
            return;
        }
        const handler = (e) => {
            const raw = e.target.value;
            let masked = raw;
            if (type === 'cpf') masked = this.maskCPF(raw);
            if (type === 'cnpj') masked = this.maskCNPJ(raw);
            if (type === 'telefone') masked = this.maskPhone(raw);
        if (type === 'cep') masked = this.maskCEP(raw);
        if (type === 'date') masked = this.maskDate(raw);
        if (type === 'currency') masked = this.maskCurrencyBRL(raw);
            e.target.value = masked;
        };
        el.addEventListener('input', handler);
        el.addEventListener('blur', handler);
        // Impedir caracteres não numéricos na digitação (exceto teclas de controle)
        el.addEventListener('keypress', (e) => {
            if (el.type === 'date') return; // não bloquear teclado no date nativo
            const isControl = e.ctrlKey || e.metaKey || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight';
            if (isControl) return;
            if (type === 'currency') {
              // permitir apenas dígitos (vírgula/ponto são gerados pela máscara)
              if (!/\d/.test(e.key)) e.preventDefault();
            } else {
              if (!/\d/.test(e.key)) e.preventDefault();
            }
        });
    },
    init() {
        // Seletores padronizados por name
        document.querySelectorAll('input[name="cpf"]').forEach(el => this.attachMask(el, 'cpf'));
        document.querySelectorAll('input[name="cnpj"]').forEach(el => this.attachMask(el, 'cnpj'));
        document.querySelectorAll('input[name="telefone"]').forEach(el => this.attachMask(el, 'telefone'));
      document.querySelectorAll('input[name="cep"]').forEach(el => this.attachMask(el, 'cep'));
      // Datas comuns (por name)
      const dateNames = ['data', 'data_nascimento', 'dataNascimento', 'data_admissao', 'dataAdmissao'];
      dateNames.forEach(nm => {
        document.querySelectorAll(`input[name="${nm}"]`).forEach(el => {
          if (el.type !== 'date') this.attachMask(el, 'date');
        });
      });
      // Moeda BRL
      document.querySelectorAll('input[name="remuneracao"]').forEach(el => this.attachMask(el, 'currency'));
        // IDs comuns em formulários existentes
        const idMap = [
        ['#cpf', 'cpf'],
        ['#cnpj', 'cnpj'],
        ['#telefone', 'telefone'],
        ['#cep', 'cep'],
        ['#data', 'date'],
        ['#dataNascimento', 'date'],
        ['#dataAdmissao', 'date'],
        ['#remuneracao', 'currency']
        ];
        idMap.forEach(([selector, type]) => {
            const el = document.querySelector(selector);
            if (!el) return;
            if (type === 'date' && el.type === 'date') return;
            this.attachMask(el, type);
        });
    }
};

// ==================================================
// 9. INICIALIZAÇÃO
// ==================================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });


    // Auto-hide alerts
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    });

    // Aplicar máscaras globais (CPF, CNPJ, Telefone, CEP, Datas)
    try { EzerMasks.init(); } catch (e) { console.warn('Masks init warning:', e); }

    console.log('Ezer DH App initialized successfully!');

    // Wire logout button in sidebar
    try {
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async () => {
                try {
                    await logout();
                } catch (e) { console.warn('Logout error:', e); }
            });
        }
    } catch {}
});

// ==================================================
// 9. EXPORTAR PARA USO GLOBAL
// ==================================================
window.EzerUtils = EzerUtils;
window.EzerRBAC = EzerRBAC;
window.EzerAPI = EzerAPI;
window.EzerNotifications = EzerNotifications;
window.EzerModals = EzerModals;
window.EzerTables = EzerTables;
window.EzerForms = EzerForms;
window.EZER_CONFIG = EZER_CONFIG;
window.EzerMasks = EzerMasks;
// ==================================================
// 10. LOADING (GLOBAL)
// ==================================================
const EzerLoading = {
    show(container) {
        try {
            let overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            overlay.appendChild(spinner);

            if (container) {
                const el = typeof container === 'string' ? document.querySelector(container) : container;
                if (!el) return { hide(){} };
                const style = window.getComputedStyle(el);
                if (style.position === 'static' || !style.position) {
                    el.style.position = 'relative';
                }
                el.appendChild(overlay);
            } else {
                overlay.classList.add('global');
                document.body.appendChild(overlay);
            }

            requestAnimationFrame(() => overlay.classList.add('open'));
            return {
                hide() {
                    try {
                        overlay.classList.remove('open');
                        setTimeout(() => overlay.remove(), 150);
                    } catch {}
                }
            };
        } catch (e) {
            console.warn('EzerLoading warning:', e);
            return { hide(){} };
        }
    }
};

window.EzerLoading = EzerLoading;

// ==================================================
// 10. KPI CARDS (GLOBAL)
// ==================================================
const EzerKPI = {
    render(container, items) {
        try {
            const target = typeof container === 'string' ? document.querySelector(container) : container;
            if (!target) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'kpi-grid';
            (items || []).forEach((item) => {
                const card = document.createElement('div');
                card.className = 'kpi-card';
                card.innerHTML = `
                    <div class="kpi-icon ${item.variant || 'primary'}">
                        <i class="bi ${item.icon || 'bi-graph-up'}"></i>
                    </div>
                    <div class="kpi-content">
                        <div class="kpi-label">${item.label || ''}</div>
                        <div class="kpi-value" id="${item.valueId || ''}">${item.value ?? 0}</div>
                    </div>
                `;
                wrapper.appendChild(card);
            });
            target.innerHTML = '';
            target.appendChild(wrapper);
        } catch (e) {
            console.warn('EzerKPI render warning:', e);
        }
    }
};

window.EzerKPI = EzerKPI;
