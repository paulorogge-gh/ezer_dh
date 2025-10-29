/* ==================================================
   EZER DESENVOLVIMENTO HUMANO - DASHBOARD
   ================================================== */

// ==================================================
// 1. VARIÁVEIS GLOBAIS
// ==================================================
let avaliacoesChart;
let colaboradoresChart;

// ==================================================
// 2. INICIALIZAÇÃO
// ==================================================
document.addEventListener('DOMContentLoaded', function() {
    // Lazy-load: inicializar quando o conteúdo entrar na viewport
    const target = document.querySelector('.content-area');
    if ('IntersectionObserver' in window && target) {
        const obs = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                try { initializeDashboard(); } catch (e) { console.error(e); }
                obs.disconnect();
            }
        }, { root: null, threshold: 0.1 });
        obs.observe(target);
    } else {
        initializeDashboard();
    }
});

function initializeDashboard() {
    loadDashboardData();
    initCharts();
    loadRecentActivities();
    loadPdiAlerts();
}

// ==================================================
// 3. CARREGAMENTO DE DADOS
// ==================================================
async function loadDashboardData() {
    try {
        // Carregar estatísticas gerais
        await Promise.all([
            loadEmpresasCount(),
            loadColaboradoresCount(),
            loadFeedbacksCount(),
            loadPdisCount()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        try { showAlert('error', 'Erro ao carregar dados do dashboard'); } catch { try { EzerNotifications.error('Erro ao carregar dados do dashboard'); } catch {} }
    }
}

async function loadEmpresasCount() {
    try {
        const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : (window.EZER_CONFIG ? EZER_CONFIG.API_BASE_URL : '')
        const resp = await auth.authenticatedRequest(`${base}/empresas`, { method: 'GET' });
        const response = await resp.json();
        if (response && response.success) {
            document.getElementById('empresasCount').textContent = response.count || 0;
        }
    } catch (error) {
        console.error('Error loading empresas count:', error);
        try { showAlert('error', 'Falha ao carregar total de empresas'); } catch {}
    }
}

async function loadColaboradoresCount() {
    try {
        const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : (window.EZER_CONFIG ? EZER_CONFIG.API_BASE_URL : '')
        const resp = await auth.authenticatedRequest(`${base}/colaboradores`, { method: 'GET' });
        const response = await resp.json();
        if (response && response.success) {
            document.getElementById('colaboradoresCount').textContent = response.count || 0;
        }
    } catch (error) {
        console.error('Error loading colaboradores count:', error);
        try { showAlert('error', 'Falha ao carregar total de colaboradores'); } catch {}
    }
}

async function loadFeedbacksCount() {
    try {
        const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : (window.EZER_CONFIG ? EZER_CONFIG.API_BASE_URL : '')
        const resp = await auth.authenticatedRequest(`${base}/feedbacks`, { method: 'GET' });
        const response = await resp.json();
        if (response && response.success) {
            const pendentes = (response.data || []).filter(f => f.status === 'Pendente').length;
            document.getElementById('feedbacksCount').textContent = pendentes;
        }
    } catch (error) {
        console.error('Error loading feedbacks count:', error);
        try { showAlert('error', 'Falha ao carregar total de feedbacks'); } catch {}
    }
}

async function loadPdisCount() {
    try {
        const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : (window.EZER_CONFIG ? EZER_CONFIG.API_BASE_URL : '')
        const resp = await auth.authenticatedRequest(`${base}/pdi`, { method: 'GET' });
        const response = await resp.json();
        if (response && response.success) {
            const emAndamento = (response.data || []).filter(p => p.status === 'Em Andamento').length;
            document.getElementById('pdisCount').textContent = emAndamento;
        }
    } catch (error) {
        console.error('Error loading pdis count:', error);
        try { showAlert('error', 'Falha ao carregar total de PDIs'); } catch {}
    }
}

// ==================================================
// 4. GRÁFICOS
// ==================================================
function initCharts() {
    initAvaliacoesChart();
    initColaboradoresChart();
}

function initAvaliacoesChart() {
    const ctx = document.getElementById('avaliacoesChart');
    if (!ctx) return;

    avaliacoesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Avaliações 90°',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                tension: 0.4
            }, {
                label: 'Avaliações 180°',
                data: [2, 3, 20, 5, 1, 4],
                borderColor: '#1cc88a',
                backgroundColor: 'rgba(28, 200, 138, 0.1)',
                tension: 0.4
            }, {
                label: 'Avaliações 360°',
                data: [3, 10, 13, 15, 22, 30],
                borderColor: '#36b9cc',
                backgroundColor: 'rgba(54, 185, 204, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initColaboradoresChart() {
    const ctx = document.getElementById('colaboradoresChart');
    if (!ctx) return;

    colaboradoresChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ativos', 'Inativos', 'Férias', 'Licença'],
            datasets: [{
                data: [85, 10, 3, 2],
                backgroundColor: [
                    '#1cc88a',
                    '#e74a3b',
                    '#f6c23e',
                    '#36b9cc'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

// ==================================================
// 5. ATIVIDADES RECENTES
// ==================================================
async function loadRecentActivities() {
    try {
        const activities = [
            {
                icon: 'bi-person-plus',
                color: 'text-success',
                title: 'Novo colaborador cadastrado',
                description: 'Maria Silva foi adicionada à equipe de Vendas',
                time: '2 horas atrás'
            },
            {
                icon: 'bi-chat-dots',
                color: 'text-info',
                title: 'Feedback enviado',
                description: 'João Santos recebeu feedback de Ana Costa',
                time: '4 horas atrás'
            },
            {
                icon: 'bi-graph-up',
                color: 'text-warning',
                title: 'Avaliação concluída',
                description: 'Avaliação 360° de Pedro Lima finalizada',
                time: '1 dia atrás'
            },
            {
                icon: 'bi-clipboard-check',
                color: 'text-primary',
                title: 'PDI atualizado',
                description: 'Plano de desenvolvimento de Carla Santos atualizado',
                time: '2 dias atrás'
            }
        ];

        const container = document.getElementById('recentActivities');
        if (container) {
            container.innerHTML = activities.map(activity => `
                <div class="timeline-item">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0">
                            <i class="bi ${activity.icon} ${activity.color}"></i>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="fw-bold">${activity.title}</div>
                            <div class="text-muted small">${activity.description}</div>
                            <div class="text-muted small">${activity.time}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// ==================================================
// 6. ALERTAS DE PDI
// ==================================================
async function loadPdiAlerts() {
    try {
        const base = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL : (window.EZER_CONFIG ? EZER_CONFIG.API_BASE_URL : '')
        const resp = await auth.authenticatedRequest(`${base}/pdi`, { method: 'GET' });
        const response = await resp.json();
        
        if (response.success) {
            const pdisProximos = response.data.filter(pdi => {
                const prazo = new Date(pdi.prazo);
                const hoje = new Date();
                const diffTime = prazo - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays >= 0 && pdi.status === 'Em Andamento';
            });

            const container = document.getElementById('pdiAlerts');
            if (container) {
                if (pdisProximos.length === 0) {
                    container.innerHTML = '<div class="text-muted text-center">Nenhum PDI próximo do vencimento</div>';
                } else {
                    container.innerHTML = pdisProximos.map(pdi => `
                        <div class="alert alert-warning alert-sm">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${pdi.objetivo}</strong>
                                    <br>
                                    <small>${pdi.colaborador_nome} - Vence em ${EzerUtils.formatDate(pdi.prazo)}</small>
                                </div>
                                <i class="bi bi-exclamation-triangle"></i>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error loading PDI alerts:', error);
    }
}

// ==================================================
// 7. ATUALIZAÇÃO AUTOMÁTICA
// ==================================================
function startAutoRefresh() {
    // Atualizar dados a cada 5 minutos
    setInterval(() => {
        loadDashboardData();
    }, 5 * 60 * 1000);
}

// Iniciar atualização automática
startAutoRefresh();
