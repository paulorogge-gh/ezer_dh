(() => {
    const apiBase = window.API_CONFIG?.BASE_URL;

    let empresasCache = [];
    const elements = {
        tableBody: null,
        btnNova: null,
        inputs: {},
        searchInput: null
    };

    function queryElements() {
        elements.tableBody = document.querySelector('#tabelaEmpresas tbody');
        elements.btnNova = document.getElementById('btnNovaEmpresa');
        elements.searchInput = document.getElementById('empresaSearch');
        elements.statusFilter = document.getElementById('empresaStatusFilter');
    }

    function toggleForm() { /* deprecated with modal form */ }

    function clearForm() { /* deprecated with modal form */ }

    function getStoredUser() {
        try {
            const raw = localStorage.getItem('ezer_user');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    }

    let listAC; let kpiAC;
    async function loadEmpresas({ status } = {}) {
        const card = document.querySelector('#tabelaEmpresas')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
        try {
            if (!elements.tableBody) return;
            elements.tableBody.innerHTML = '';
            try { listAC?.abort(); } catch {}
            listAC = new AbortController();
            const role = (window.auth && auth.user && auth.user.role) || '';
            if (role === 'consultoria') {
                const qs = (typeof status === 'string' && status.length) ? `?status=${encodeURIComponent(status)}` : '';
                const resp = await auth.authenticatedRequest(`${apiBase}/empresas${qs}`, { method: 'GET', signal: listAC.signal });
                const data = await resp.json();
                if (!data.success) throw new Error(data.error || 'Falha ao listar empresas');
                empresasCache = (data.data || []);
            } else if (role === 'empresa') {
                const payloadRef = (typeof auth?.getTokenPayload === 'function') ? (auth.getTokenPayload()?.empresa_id || null) : null;
                const myId = (auth.user.id_empresa || payloadRef) || null;
                if (!myId) throw new Error('Empresa do usuário não identificada');
                const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET', signal: listAC.signal });
                const data = await resp.json();
                if (!data.success) throw new Error(data.error || 'Falha ao carregar empresa');
                empresasCache = data.data ? [data.data] : [];
                try { if (elements.btnNova) elements.btnNova.style.display = 'none'; } catch {}
            } else {
                empresasCache = [];
            }
            renderEmpresas(empresasCache);
        } catch (e) {
            console.error('Erro ao carregar empresas:', e);
            try { showAlert('error', e.message || 'Erro ao carregar empresas'); } catch {}
        } finally {
            try { loader.hide(); } catch {}
        }
    }

    function renderEmpresas(list) {
        if (!elements.tableBody) return;
        elements.tableBody.innerHTML = '';
        list.forEach(renderRow);
    }

    function renderRow(empresa) {
        const tr = document.createElement('tr');
        const nextStatus = (empresa.status || '').toLowerCase() === 'ativo' ? 'Inativo' : 'Ativo';
        const role = (window.auth && auth.user && auth.user.role) || '';
        const isEmpresaRole = role === 'empresa';
        tr.innerHTML = `
            <td>${empresa.nome || ''}</td>
            <td>${empresa.cnpj || ''}</td>
            <td>${empresa.email || ''}</td>
            <td>${empresa.telefone || ''}</td>
            <td>${empresa.responsavel || ''}</td>
            <td>${empresa.status || ''}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${empresa.id_empresa}" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${empresa.id_empresa}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon warning" data-action="toggle-status" data-id="${empresa.id_empresa}" data-next-status="${nextStatus}" title="${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'}" ${isEmpresaRole ? 'disabled aria-disabled="true"' : ''}>
                        <i class="bi ${nextStatus === 'Inativo' ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
                    </button>
                    <button class="btn-icon error" data-action="delete" data-id="${empresa.id_empresa}" title="Excluir" ${isEmpresaRole ? 'disabled aria-disabled="true"' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        elements.tableBody.appendChild(tr);
    }

    function fillForm() { /* deprecated with modal form */ }

    async function fetchEmpresaById(id) {
        const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}`, { method: 'GET' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Erro ao buscar empresa');
        return data.data;
    }

    async function saveEmpresa(e) { /* deprecated with modal form */ }

    async function deleteEmpresa(id) {
        try {
            // Primeiro alerta
            const ok1 = await (window.showConfirm ? showConfirm({
                title: 'Excluir empresa',
                message: 'Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                variant: 'warning'
            }) : Promise.resolve(confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')));
            if (!ok1) return;
            // Segundo alerta (dupla confirmação)
            const ok2 = await (window.showConfirm ? showConfirm({
                title: 'Confirma exclusão PERMANENTE?',
                message: 'Esta ação é IRREVERSÍVEL e removerá definitivamente a empresa do sistema, assim como todos os dados relacionados a ela como COLABORADORES, DEPARTAMENTOS e LÍDERES. Confirme para prosseguir.',
                confirmText: 'Excluir permanentemente',
                cancelText: 'Cancelar',
                variant: 'error'
            }) : Promise.resolve(confirm('Esta ação é IRREVERSÍVEL. Confirma excluir permanentemente?')));
            if (!ok2) return;
        } catch {}
        try {
            const card = document.querySelector('#tabelaEmpresas')?.closest('.card') || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
            const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}`, { method: 'DELETE' });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao excluir empresa');
            await loadEmpresas({ status: elements.statusFilter?.value || '' });
            try { showAlert('success', 'Empresa excluída permanentemente com sucesso'); } catch {}
            try { loader.hide(); } catch {}
        } catch (e) {
            console.error('Erro ao excluir empresa:', e);
            try { showAlert('error', e.message || 'Erro ao excluir empresa'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao excluir empresa'); } catch {} }
        }
    }

    function attachEvents() {
        elements.btnNova?.addEventListener('click', () => openEmpresaForm());
        if (elements.searchInput) {
            const handleSearch = EzerUtils && EzerUtils.debounce ? EzerUtils.debounce(applySearchFilter, 300) : applySearchFilter;
            elements.searchInput.addEventListener('input', handleSearch);
        }
        document.addEventListener('click', async (ev) => {
            const target = ev.target.closest('button');
            if (!target) return;
            const action = target.getAttribute('data-action');
            const id = target.getAttribute('data-id');
            if (!action || !id) return;
            // Bloquear ações de inativação e exclusão para role empresa
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (role === 'empresa' && (action === 'delete' || action === 'toggle-status')) {
                    try { showAlert('warning', 'Ação não permitida para perfil Empresa.'); } catch { try { EzerNotifications?.warning?.('Ação não permitida para perfil Empresa.'); } catch {} }
                    return;
                }
            } catch {}
            if (action === 'edit') {
                try {
                    const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
                    const empresa = await fetchEmpresaById(id);
                    openEmpresaForm(empresa);
                    try { loader.hide(); } catch {}
                } catch (e) {
                    try { showAlert('error', e.message || 'Erro ao carregar empresa'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao carregar empresa'); } catch {} }
                }
            } else if (action === 'delete') {
                await deleteEmpresa(id);
            } else if (action === 'toggle-status') {
                const nextStatus = target.getAttribute('data-next-status');
                await toggleEmpresaStatus(id, nextStatus);
            } else if (action === 'view') {
                try {
                    const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
                    await viewEmpresa(id);
                    try { loader.hide(); } catch {}
                } catch (e) {
                    try { showAlert('error', e.message || 'Erro ao carregar detalhes'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao carregar detalhes'); } catch {} }
                }
            }
        });
        elements.statusFilter?.addEventListener('change', async (ev) => {
            const status = ev.target.value;
            await loadEmpresas({ status });
        });
    }

    async function toggleEmpresaStatus(id, nextStatus) {
        try {
            const ok = await (window.showConfirm ? showConfirm({
                title: `${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'} empresa`,
                message: `Confirma alterar o status para "${nextStatus}"?`,
                confirmText: 'Confirmar',
                cancelText: 'Cancelar'
            }) : Promise.resolve(confirm(`Confirma alterar o status para "${nextStatus}"?`)));
            if (!ok) return;

            const card = document.querySelector('#tabelaEmpresas')?.closest('.card') || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
            const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao alterar status');
            await loadEmpresas();
            try { showAlert('success', `Status alterado para ${nextStatus}`); } catch {}
            try { loader.hide(); } catch {}
        } catch (e) {
            console.error('Erro ao alterar status:', e);
            try { showAlert('error', e.message || 'Erro ao alterar status'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao alterar status'); } catch {} }
        }
    }

    async function fetchAndRenderEmpresaStats() {
        const kpiContainer = document.querySelector('#kpiEmpresas') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(kpiContainer) : { hide(){} };
        try {
            try { kpiAC?.abort(); } catch {}
            kpiAC = new AbortController();
            const resp = await auth.authenticatedRequest(`${apiBase}/empresas/stats/global`, { method: 'GET', signal: kpiAC.signal });
            const data = await resp.json();
            if (!data.success) return;
            const stats = data.data || { total: 0, ativos: 0, inativos: 0 };
            EzerKPI.render('#kpiEmpresas', [
                { label: 'Total de Empresas', value: stats.total, valueId: 'empresasTotal', icon: 'bi-buildings', variant: 'primary' },
                { label: 'Ativas', value: stats.ativos, valueId: 'empresasAtivas', icon: 'bi-check-circle', variant: 'success' },
                { label: 'Inativas', value: stats.inativos, valueId: 'empresasInativas', icon: 'bi-slash-circle', variant: 'error' }
            ]);
            // Aplicar desfoque nos valores das KPIs para role empresa
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (role === 'empresa') {
                    document.querySelectorAll('.kpi-value').forEach(el => {
                        el.classList.add('blurred');
                    });
                }
            } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function buildEmpresaFormHtml(empresa = {}) {
        return `
            <input type=\"hidden\" name=\"id_empresa\" value=\"${empresa.id_empresa || ''}\">
            <div class=\"form-grid\">
                <div class=\"form-field span-2\">
                    <label class=\"form-label\" for=\"nome\">Nome *</label>
                    <input class=\"form-control\" name=\"nome\" id=\"nome\" required placeholder=\"Nome da empresa\" value=\"${empresa.nome || ''}\">
                </div>
                <div class=\"form-field\">
                    <label class=\"form-label\" for=\"cnpj\">CNPJ *</label>
                    <input class=\"form-control\" name=\"cnpj\" id=\"cnpj\" required placeholder=\"00.000.000/0000-00\" value=\"${empresa.cnpj || ''}\">
                </div>
                <div class=\"form-field\">
                    <label class=\"form-label\" for=\"telefone\">Telefone</label>
                    <input class=\"form-control\" name=\"telefone\" id=\"telefone\" placeholder=\"(00) 00000-0000\" value=\"${empresa.telefone || ''}\">
                </div>
                <div class=\"form-field\">
                    <label class=\"form-label\" for=\"email\">E-mail</label>
                    <input class=\"form-control\" name=\"email\" id=\"email\" type=\"email\" placeholder=\"contato@empresa.com\" value=\"${empresa.email || ''}\">
                </div>
                <div class=\"form-field\">
                    <label class=\"form-label\" for=\"responsavel\">Responsável</label>
                    <input class=\"form-control\" name=\"responsavel\" id=\"responsavel\" placeholder=\"Nome do responsável\" value=\"${empresa.responsavel || ''}\">
                </div>
                <div class=\"form-field span-2\">
                    <label class=\"form-label\" for=\"endereco\">Endereço</label>
                    <input class=\"form-control\" name=\"endereco\" id=\"endereco\" placeholder=\"Rua, nº, bairro, cidade - UF\" value=\"${empresa.endereco || ''}\">
                </div>
                <div class=\"form-field\">
                    <label class=\"form-label\" for=\"status\">Status</label>
                    <select class=\"form-select form-control\" name=\"status\" id=\"status\">
                        <option value=\"Ativo\" ${empresa.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option value=\"Inativo\" ${empresa.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
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

    function openEmpresaForm(empresa) {
        const isEdit = !!(empresa && empresa.id_empresa);
        const formHtml = buildEmpresaFormHtml(empresa || {});
        if (!window.showFormModal) {
            try { showAlert('error', 'Componente de formulário não disponível.'); } catch { try { EzerNotifications?.error?.('Componente de formulário não disponível.'); } catch {} }
            return;
        }
        const modalRef = showFormModal({
            title: isEdit ? 'Editar Empresa' : 'Nova Empresa',
            formHtml,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const data = serializeForm(form);
                await saveEmpresaData(data, isEdit ? data.id_empresa : null);
                close();
            }
        });
        // Aplicar máscaras ao formulário recém-renderizado
        try {
            if (window.EzerMasks && modalRef && modalRef.el) {
                const root = modalRef.el;
                EzerMasks.attachMask(root.querySelector('input[name="cnpj"]'), 'cnpj');
                EzerMasks.attachMask(root.querySelector('input[name="telefone"]'), 'telefone');
                // Se futuramente houver campo CEP/data no formulário, as linhas abaixo já tratam:
                // EzerMasks.attachMask(root.querySelector('input[name="cep"]'), 'cep');
                // EzerMasks.attachMask(root.querySelector('input[name="data"]'), 'date');
            }
        } catch (e) { console.warn('Falha ao aplicar máscaras no modal de empresa:', e); }
    }

    async function saveEmpresaData(formData, idToEdit) {
        const payload = {
            nome: (formData.nome || '').trim(),
            cnpj: (formData.cnpj || '').trim(),
            email: (formData.email || '').trim() || null,
            telefone: (formData.telefone || '').trim() || null,
            endereco: (formData.endereco || '').trim() || null,
            responsavel: (formData.responsavel || '').trim() || null,
            status: formData.status || 'Ativo'
        };

        // Atribuir consultoria automaticamente do usuário logado (priorizar auth.user)
        try {
            if (window.auth && auth.user && auth.user.role === 'consultoria' && auth.user.id_consultoria) {
                payload.id_consultoria = auth.user.id_consultoria;
            } else {
                const user = getStoredUser();
                if (user && (user.role === 'consultoria') && user.id_consultoria) {
                    payload.id_consultoria = user.id_consultoria;
                }
            }
        } catch {}

        try {
            const isEdit = !!idToEdit;
            const url = isEdit ? `${apiBase}/empresas/${idToEdit}` : `${apiBase}/empresas`;
            const method = isEdit ? 'PUT' : 'POST';
            const resp = await auth.authenticatedRequest(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao salvar empresa');
            await loadEmpresas();
            try { showAlert('success', isEdit ? 'Empresa atualizada com sucesso' : 'Empresa criada com sucesso'); } catch {}
        } catch (e) {
            console.error('Erro ao salvar empresa:', e);
            try { showAlert('error', e.message || 'Erro ao salvar empresa'); } catch { try { EzerNotifications?.error?.(e.message || 'Erro ao salvar empresa'); } catch {} }
        }
    }

    function sanitizeCnpj(value) {
        try { return (value || '').toString().replace(/\D/g, ''); } catch { return ''; }
    }

    function applySearchFilter(ev) {
        const q = (ev?.target?.value || '').toString().trim();
        if (q.length < 3) {
            renderEmpresas(empresasCache);
            return;
        }
        const qLower = q.toLowerCase();
        const qDigits = sanitizeCnpj(q);
        const filtered = empresasCache.filter(e => {
            const nome = (e.nome || '').toLowerCase();
            const cnpjDigits = sanitizeCnpj(e.cnpj || '');
            return nome.includes(qLower) || (qDigits && cnpjDigits.includes(qDigits));
        });
        renderEmpresas(filtered);
    }

    async function viewEmpresa(id) {
        const [detalhes, stats] = await Promise.all([
            (async () => {
                const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}`, { method: 'GET' });
                const data = await resp.json();
                if (!data.success) throw new Error(data.error || 'Erro ao buscar empresa');
                return data.data;
            })(),
            (async () => {
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/empresas/${id}/stats`, { method: 'GET' });
                    const data = await resp.json();
                    return data.success ? data.data : null;
                } catch { return null; }
            })()
        ]);

        const html = buildEmpresaDetailsHtml(detalhes, stats);
        const title = `Empresa: ${detalhes.nome || ''}`;
        if (window.showInfoModal) {
            showInfoModal({ title, html, closeText: 'Fechar', size: 'lg' });
        } else {
            const infoMsg = `Empresa: ${detalhes.nome || '-'} | CNPJ: ${detalhes.cnpj || '-'}`;
            try { showAlert('info', infoMsg); } catch { try { EzerNotifications?.info?.(infoMsg); } catch {} }
        }
    }

    function buildEmpresaDetailsHtml(empresa, stats) {
        const role = (window.auth && auth.user && auth.user.role) || '';
        const blurClass = role === 'empresa' ? ' blurred' : '';
        const info = [
            { label: 'Nome', value: empresa.nome },
            { label: 'CNPJ', value: empresa.cnpj },
            { label: 'E-mail', value: empresa.email },
            { label: 'Telefone', value: empresa.telefone },
            { label: 'Responsável', value: empresa.responsavel },
            { label: 'Endereço', value: empresa.endereco },
            { label: 'Status', value: empresa.status },
            empresa.consultoria_nome ? { label: 'Consultoria', value: empresa.consultoria_nome } : null,
        ].filter(Boolean);

        const grid = info.map(item => `
            <div class="details-item">
                <div class="details-label">${item.label}</div>
                <div class="details-value${blurClass}">${item.value || '-'}</div>
            </div>
        `).join('');

        const statsHtml = stats ? `
            <div class="details-divider"></div>
            <div class="details-stats">
                <div class="details-stat">
                    <div class="details-label">Total de Colaboradores</div>
                    <div class="details-value${blurClass}">${stats.totalColaboradores}</div>
                </div>
                <div class="details-stat">
                    <div class="details-label">Total de Departamentos</div>
                    <div class="details-value${blurClass}">${stats.totalDepartamentos}</div>
                </div>
            </div>
        ` : '';

        return `
            <div class="details-grid">
                ${grid}
            </div>
            ${statsHtml}
        `;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            queryElements();
            attachEvents();
            // Ocultar criação/edição para perfis que não sejam consultoria
            try {
                if (!(window.auth && auth.user && auth.user.role === 'consultoria')) {
                    if (elements.btnNova) elements.btnNova.style.display = 'none';
                }
            } catch {}
            await Promise.all([
                loadEmpresas({ status: elements.statusFilter?.value || '' }),
                (async () => { if (window.EzerKPI) { try { await fetchAndRenderEmpresaStats(); } catch {} } })()
            ]);
        } catch (e) {
            console.error('Falha ao inicializar página de empresas:', e);
        }
    });
})();


