const apiBase = window.API_CONFIG?.BASE_URL;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Ezer DH] Departamentos JS inicializado');
});

async function deleteDepartamento(id) {
    try {
        const ok = await (window.showDeleteConfirm ? showDeleteConfirm('departamento') : (window.showConfirm ? showConfirm({
            title: 'Excluir departamento',
            message: 'Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar'
        }) : Promise.resolve(confirm('Tem certeza que deseja excluir este departamento?'))));
        if (!ok) return;
    } catch {}
    try {
        const card = document.querySelector('#departamentosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
        const resp = await auth.authenticatedRequest(`${apiBase}/departamentos/${id}`, { method: 'DELETE' });
        const response = await resp.json();
        if (response.success) {
            if (window.loadDepartamentos) { try { await loadDepartamentos(); } catch {} }
            if (window.showAlert) { try { showAlert('success', 'Departamento excluído com sucesso'); } catch {} }
            else { EzerNotifications?.success?.('Departamento excluído com sucesso'); }
            try { loader.hide(); } catch {}
        } else {
            if (window.showAlert) { try { showAlert('error', response.error || 'Erro ao excluir departamento'); } catch {} }
            else { EzerNotifications?.error?.('Erro ao excluir departamento'); }
        }
    } catch (error) {
        console.error('Erro ao excluir departamento:', error);
        EzerNotifications?.error?.('Erro ao excluir departamento');
    }
}

window.deleteDepartamento = deleteDepartamento;

// Suporte a alternância de status removido

// ==================================================
// Página de Departamentos - seguindo padrão de empresas.js
// ==================================================
(() => {
    let departamentosCache = [];
    const elements = {
        tableBody: null,
        btnNovo: null,
        searchInput: null,
        kpiContainer: null
    };

    function queryElements() {
        elements.tableBody = document.querySelector('#departamentosTable tbody');
        elements.btnNovo = document.getElementById('btnNovoDepartamento');
        elements.searchInput = document.getElementById('departamentoSearch');
        elements.kpiContainer = document.getElementById('kpiDepartamentos');
    }

    function sanitizeText(value) {
        try { return (value || '').toString().trim(); } catch { return ''; }
    }

    let listAC; let kpiAC;
    async function enrichEmpresaNome(list) {
        try {
            if (!Array.isArray(list) || list.length === 0) return list;
            // Se todos já possuem empresa_nome, não fazer nada
            const hasMissing = list.some(d => !d || !d.empresa_nome);
            if (!hasMissing) return list;

            // Descobrir empresas únicas
            const uniqueEmpresaIds = Array.from(new Set(list.map(d => d && d.id_empresa).filter(Boolean)));
            if (uniqueEmpresaIds.length === 0) return list;

            const idToNome = {};
            // Buscar nome para cada empresa necessária
            for (const id of uniqueEmpresaIds) {
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}`, { method: 'GET' });
                    const data = await resp.json();
                    if (data && data.success && data.data && data.data.nome) {
                        idToNome[id] = data.data.nome;
                    }
                } catch (e) { /* continuar para outros ids */ }
            }

            // Atribuir nomes onde faltam
            list.forEach(d => {
                try {
                    if (d && !d.empresa_nome && d.id_empresa && idToNome[d.id_empresa]) {
                        d.empresa_nome = idToNome[d.id_empresa];
                    }
                } catch {}
            });
        } catch {}
        return list;
    }
    async function loadDepartamentos() {
        try {
            if (!elements.tableBody) return;
        const card = document.querySelector('#departamentosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
            elements.tableBody.innerHTML = '';
            try { listAC?.abort(); } catch {}
            listAC = new AbortController();

            // Se usuário empresa, filtrar por sua empresa
            let url = `${apiBase}/departamentos`;
            try {
                if (window.auth && auth.user && auth.user.role === 'empresa') {
                    const empresaId = auth.user.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                    if (empresaId) {
                        url = `${apiBase}/departamentos?empresa_id=${encodeURIComponent(empresaId)}`;
                    }
                }
            } catch {}

            const resp = await auth.authenticatedRequest(url, { method: 'GET', signal: listAC.signal });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao listar departamentos');
            departamentosCache = data.data || [];
            try { departamentosCache = await enrichEmpresaNome(departamentosCache); } catch {}
            renderDepartamentos(departamentosCache);
            try { loader.hide(); } catch {}
            try { renderDepartamentoKPI(departamentosCache); } catch {}
        } catch (e) {
            console.error('Erro ao carregar departamentos:', e);
            try { showAlert('error', e.message || 'Erro ao carregar departamentos'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao carregar departamentos'); } catch {} }
        }
    }

    function renderDepartamentos(list) {
        if (!elements.tableBody) return;
        elements.tableBody.innerHTML = '';
        list.forEach(renderRow);
    }

    // Campo de status removido do frontend

    function renderRow(departamento) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sanitizeText(departamento.nome)}</td>
            <td>${sanitizeText(departamento.empresa_nome)}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${departamento.id_departamento}" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${departamento.id_departamento}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon error" data-action="delete" data-id="${departamento.id_departamento}" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(tr);
    }

    async function fetchDepartamentoById(id) {
        const resp = await auth.authenticatedRequest(`${apiBase}/departamentos/${id}`, { method: 'GET' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Erro ao buscar departamento');
        return data.data;
    }

    async function fetchEmpresasListSafe() {
        try {
            // Apenas consultoria deve listar todas as empresas
            if (window.auth && auth.user && auth.user.role === 'consultoria') {
                const resp = await auth.authenticatedRequest(`${apiBase}/empresas`, { method: 'GET' });
                const data = await resp.json();
                if (data.success) return data.data || [];
            }
        } catch {}
        return [];
    }

    function buildDepartamentoFormHtml(departamento = {}, empresas = []) {
        const isConsultoria = !!(window.auth && auth.user && auth.user.role === 'consultoria');
        const empresaId = departamento.id_empresa || (auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || '') : ''));
        const empresaSelectHtml = isConsultoria ? `
            <div class="form-field">
                <label class="form-label" for="id_empresa">Empresa *</label>
                <select class="form-select form-control" name="id_empresa" id="id_empresa" required>
                    ${empresas.map(e => `<option value="${e.id_empresa}" ${e.id_empresa === empresaId ? 'selected' : ''}>${sanitizeText(e.nome)}</option>`).join('')}
                </select>
            </div>
        ` : `
            <input type="hidden" name="id_empresa" value="${empresaId || ''}">
        `;

        return `
            <input type="hidden" name="id_departamento" value="${departamento.id_departamento || ''}">
            <div class="form-grid">
                ${empresaSelectHtml}
                <div class="form-field span-2">
                    <label class="form-label" for="nome">Nome *</label>
                    <input class="form-control" name="nome" id="nome" required placeholder="Nome do departamento" value="${sanitizeText(departamento.nome)}">
                </div>
                <div class="form-field span-2">
                    <label class="form-label" for="descricao">Descrição</label>
                    <textarea class="form-control" name="descricao" id="descricao" rows="3" placeholder="Descrição do departamento">${sanitizeText(departamento.descricao)}</textarea>
                </div>
            </div>
        `;
    }

    function serializeForm(form) {
        const fd = new FormData(form);
        const data = {};
        fd.forEach((v, k) => data[k] = v);
        return data;
    }

    function openDepartamentoForm(departamento) {
        const isEdit = !!(departamento && departamento.id_departamento);
        (async () => {
            let empresas = [];
            try { empresas = await fetchEmpresasListSafe(); } catch {}
            const formHtml = buildDepartamentoFormHtml(departamento || {}, empresas);
            if (!window.showFormModal) {
                try { showAlert('error', 'Componente de formulário não disponível.'); } catch { try { EzerNotifications?.error?.('Componente de formulário não disponível.'); } catch {} }
                return;
            }
            showFormModal({
                title: isEdit ? 'Editar Departamento' : 'Novo Departamento',
                formHtml,
                size: 'lg',
                submitText: 'Salvar',
                cancelText: 'Cancelar',
                onSubmit: async (form, close) => {
                    const data = serializeForm(form);
                    await saveDepartamentoData(data, isEdit ? data.id_departamento : null);
                    close();
                }
            });
        })();
    }

    async function saveDepartamentoData(formData, idToEdit) {
        const payload = {
            nome: sanitizeText(formData.nome),
            descricao: sanitizeText(formData.descricao),
            id_empresa: sanitizeText(formData.id_empresa)
        };

        try {
            const isEdit = !!idToEdit;
            const url = isEdit ? `${apiBase}/departamentos/${idToEdit}` : `${apiBase}/departamentos`;
            const method = isEdit ? 'PUT' : 'POST';
            const resp = await auth.authenticatedRequest(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao salvar departamento');
            await loadDepartamentos();
            try { showAlert('success', isEdit ? 'Departamento atualizado com sucesso' : 'Departamento criado com sucesso'); } catch {}
        } catch (e) {
            console.error('Erro ao salvar departamento:', e);
            try { showAlert('error', e.message || 'Erro ao salvar departamento'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao salvar departamento'); } catch {} }
        }
    }

    function applySearchFilter(ev) {
        const q = sanitizeText(ev?.target?.value || '');
        if (q.length < 2) { renderDepartamentos(departamentosCache); return; }
        const qLower = q.toLowerCase();
        const filtered = departamentosCache.filter(d => {
            const nome = sanitizeText(d.nome).toLowerCase();
            const empresaNome = sanitizeText(d.empresa_nome).toLowerCase();
            return nome.includes(qLower) || empresaNome.includes(qLower);
        });
        renderDepartamentos(filtered);
    }

    async function fetchDepartamentoColaboradores(id) {
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/departamentos/${id}/colaboradores`, { method: 'GET' });
            const data = await resp.json();
            return data.success ? (data.data || []) : [];
        } catch { return []; }
    }

    async function viewDepartamento(id) {
        const [detalhes, stats, colaboradores] = await Promise.all([
            (async () => { const d = await fetchDepartamentoById(id); return d; })(),
            (async () => {
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/departamentos/${id}/stats`, { method: 'GET' });
                    const data = await resp.json();
                    return data.success ? data.data : null;
                } catch { return null; }
            })(),
            fetchDepartamentoColaboradores(id)
        ]);

        const html = buildDepartamentoDetailsHtml(detalhes, stats, colaboradores);
        const title = `Departamento: ${sanitizeText(detalhes.nome)}`;
        if (window.showInfoModal) {
            showInfoModal({ title, html, closeText: 'Fechar', size: 'lg' });
        } else {
            const infoMsg = `Departamento: ${sanitizeText(detalhes.nome)} | Empresa: ${sanitizeText(detalhes.empresa_nome)}`;
            try { showAlert('info', infoMsg); } catch { try { EzerNotifications?.info?.(infoMsg); } catch {} }
        }
    }

    function buildDepartamentoDetailsHtml(departamento, stats, colaboradores = []) {
        const info = [
            { label: 'Nome', value: departamento.nome },
            { label: 'Empresa', value: departamento.empresa_nome },
            { label: 'Descrição', value: departamento.descricao }
        ];

        const grid = info.map(item => `
            <div class="details-item">
                <div class="details-label">${item.label}</div>
                <div class="details-value">${sanitizeText(item.value) || '-'}</div>
            </div>
        `).join('');

        const statsHtml = stats ? `
            <div class="details-divider"></div>
            <div class="details-stats">
                <div class="details-stat">
                    <div class="details-label">Total de Colaboradores</div>
                    <div class="details-value">${stats.totalColaboradores}</div>
                </div>
            </div>
        ` : '';

        const colabsListHtml = (() => {
            try {
                const list = Array.isArray(colaboradores) ? colaboradores : [];
                if (!list.length) {
                    return `
                        <div class="details-divider"></div>
                        <div class="details-section">
                            <div class="details-label" style="margin-bottom:8px;">Colaboradores</div>
                            <div class="text-muted" style="font-size:.9rem;">Nenhum colaborador vinculado a este departamento.</div>
                        </div>
                    `;
                }
                const items = list.map(c => {
                    const nome = sanitizeText(c.nome || '');
                    const email = sanitizeText(c.email_corporativo || c.email_pessoal || '');
                    const cargo = sanitizeText(c.cargo || '');
                    return `
                        <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:600; color:var(--gray-800);">${nome}</span>
                                <span style="color:#64748b; font-size:.875rem;">${email || '—'}</span>
                            </div>
                            <div style="color:#64748b; font-size:.875rem;">${cargo || '—'}</div>
                        </div>
                    `;
                }).join('');
                return `
                    <div class="details-divider"></div>
                    <div class="details-section">
                        <div class="details-label" style="margin-bottom:8px;">Colaboradores</div>
                        <div class="list" style="border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:8px 12px; max-height:320px; overflow:auto;">
                            ${items}
                        </div>
                    </div>
                `;
            } catch { return ''; }
        })();

        return `
            <div class="details-grid">
                ${grid}
            </div>
            ${statsHtml}
            ${colabsListHtml}
        `;
    }

    function renderDepartamentoKPI(list) {
        try {
            if (!window.EzerKPI || !elements.kpiContainer) return;
            const total = (list || []).length;
            EzerKPI.render('#kpiDepartamentos', [
                { label: 'Total de Departamentos', value: total, valueId: 'departamentosTotal', icon: 'bi-building', variant: 'primary' }
            ]);
        } catch (e) { console.warn('Falha ao renderizar KPI de departamentos:', e); }
    }

    function attachEvents() {
        elements.btnNovo?.addEventListener('click', () => openDepartamentoForm());
        if (elements.searchInput) {
            const handleSearch = (window.EzerUtils && EzerUtils.debounce) ? EzerUtils.debounce(applySearchFilter, 300) : applySearchFilter;
            elements.searchInput.addEventListener('input', handleSearch);
        }
        document.addEventListener('click', async (ev) => {
            const target = ev.target.closest('button');
            if (!target) return;
            const action = target.getAttribute('data-action');
            const id = target.getAttribute('data-id');
            if (!action || !id) return;
            if (action === 'edit') {
                try {
                    const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
                    const departamento = await fetchDepartamentoById(id);
                    openDepartamentoForm(departamento);
                    try { loader.hide(); } catch {}
                } catch (e) {
                    try { showAlert('error', e.message || 'Erro ao carregar departamento'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao carregar departamento'); } catch {} }
                }
            } else if (action === 'delete') {
                await deleteDepartamento(id);
            } else if (action === 'view') {
                try {
                    const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
                    await viewDepartamento(id);
                    try { loader.hide(); } catch {}
                } catch (e) {
                    try { showAlert('error', e.message || 'Erro ao carregar detalhes'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao carregar detalhes'); } catch {} }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            queryElements();
            attachEvents();
            // Ocultar criação/edição para perfis que não sejam consultoria/empresa
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (!(role === 'consultoria' || role === 'empresa')) {
                    if (elements.btnNovo) elements.btnNovo.style.display = 'none';
                }
            } catch {}
            await loadDepartamentos();
        } catch (e) {
            console.error('Falha ao inicializar página de departamentos:', e);
        }
    });

    // Expor função para reuso
    window.loadDepartamentos = loadDepartamentos;
})();
