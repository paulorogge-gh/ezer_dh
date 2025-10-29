(function(){
    const apiBase = window.API_CONFIG?.BASE_URL;

    let lideresCache = [];
    let empresasCache = [];
    const els = { empresaSelect: null, searchInput: null, tableBody: null, btnNovo: null };

    function queryEls() {
        els.empresaSelect = document.getElementById('empresaSelect');
        els.searchInput = document.getElementById('liderSearch');
        els.tableBody = document.querySelector('#tabelaLideres tbody');
        els.btnNovo = document.getElementById('btnNovoLider');
    }

    function sanitize(value) { try { return (value || '').toString().trim(); } catch { return ''; } }

    function renderList(list) {
        if (!els.tableBody) return;
        els.tableBody.innerHTML = '';
        (list || []).forEach(renderRow);
    }

    function renderRow(l) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${sanitize(l.colaborador_nome)}</td>
            <td>${sanitize(l.empresa_nome)}</td>
            <td>${sanitize(l.status)}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${l.id_lider}" title="Ver">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${l.id_lider}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="members" data-id="${l.id_lider}" title="Gerenciar Liderados">
                        <i class="bi bi-people"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" data-action="departments" data-id="${l.id_lider}" title="Gerenciar Departamentos">
                        <i class="bi bi-building"></i>
                    </button>
                    <button class="btn-icon error" data-action="delete" data-id="${l.id_lider}" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        els.tableBody.appendChild(tr);
    }

    async function loadEmpresas() {
        const select = els.empresaSelect;
        if (!select) return [];
        const loader = window.EzerLoading ? EzerLoading.show(select) : { hide(){} };
        try {
            const { list } = await EzerRBAC.populateEmpresaSelect(select, { includeEmpty: true });
            empresasCache = list || [];
            if ((!empresasCache || !empresasCache.length) && auth?.user?.role === 'empresa') {
                const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                if (myId) {
                    try {
                        const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET' });
                        if (!r.ok) throw new Error(`Erro ${r.status} ao buscar empresa`);
                        const j = await parseJsonSafe(r);
                        empresasCache = (j.success && j.data) ? [j.data] : [{ id_empresa: myId, nome: 'Minha Empresa' }];
                        select.innerHTML = '<option value="">Todas</option>' + empresasCache.map(e => `<option value="${e.id_empresa}">${sanitize(e.nome)}</option>`).join('');
                    } catch {
                        empresasCache = [{ id_empresa: myId, nome: 'Minha Empresa' }];
                        select.innerHTML = '<option value="">Todas</option>' + `<option value="${myId}">Minha Empresa</option>`;
                    }
                }
            }
            return empresasCache;
        } finally { try { loader.hide(); } catch {} }
    }

    async function loadLideres() {
        const table = document.getElementById('tabelaLideres')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(table) : { hide(){} };
        try {
            const params = new URLSearchParams();
            const empresaId = els.empresaSelect?.value || '';
            if (empresaId) params.set('empresa_id', empresaId);
            const url = `${apiBase}/lideres${params.toString() ? `?${params.toString()}` : ''}`;
            const resp = await auth.authenticatedRequest(url, { method: 'GET' });
            if (!resp.ok) throw new Error(`Erro ${resp.status} ao listar líderes`);
            const data = await parseJsonSafe(resp);
            if (!data.success) throw new Error(data.error || 'Falha ao listar líderes');
            lideresCache = data.data || [];
            renderList(lideresCache);
        } catch (e) {
            console.error('Erro ao carregar líderes:', e);
            try { showAlert('error', e.message || 'Erro ao carregar líderes'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function applyFilter() {
        const q = sanitize(els.searchInput?.value || '').toLowerCase();
        if (!q || q.length < 2) { renderList(lideresCache); return; }
        const filtered = lideresCache.filter(l => sanitize(l.colaborador_nome).toLowerCase().includes(q));
        renderList(filtered);
    }

    async function openNovoLiderModal() {
        // Carregar empresas e colaboradores da empresa selecionada
        const empresas = empresasCache.length ? empresasCache : await loadEmpresas();
        let empresaId = els.empresaSelect?.value || (empresas[0]?.id_empresa || '');
        const colaboradores = await fetchColaboradores(empresaId);
        const formHtml = buildNovoLiderForm({ empresas, empresaId, colaboradores });
        showFormModal({
            title: 'Novo Líder',
            formHtml,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const fd = new FormData(form);
                const payload = Object.fromEntries(fd.entries());
                if (!payload.id_empresa || !payload.id_colaborador) {
                    try { showAlert('warning', 'Selecione Empresa e Colaborador'); } catch {}
                    return;
                }
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/lideres`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_empresa: Number(payload.id_empresa), id_colaborador: Number(payload.id_colaborador), status: 'Ativo' }) });
                    const data = await resp.json();
                    if (!data.success) throw new Error(data.error || 'Falha ao criar líder');
                    await loadLideres();
                    close();
                    try { showAlert('success', 'Líder criado com sucesso'); } catch {}
                } catch (e) {
                    console.error('Erro ao criar líder:', e);
                    try { showAlert('error', e.message || 'Erro ao criar líder'); } catch {}
                }
            }
        });

        // Atualizar colaboradores ao mudar empresa
        setTimeout(() => {
            try {
                const empresaSelect = document.getElementById('form_empresa');
                const colabSelect = document.getElementById('form_colaborador');
                if (empresaSelect && colabSelect) {
                    empresaSelect.addEventListener('change', async function(){
                        const idEmp = this.value;
                        const loader = window.EzerLoading ? EzerLoading.show(colabSelect) : { hide(){} };
                        try {
                            const list = await fetchColaboradores(idEmp);
                            colabSelect.innerHTML = '<option value="">Selecione</option>' + list.map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
                        } finally { try { loader.hide(); } catch {} }
                    });
                }
            } catch {}
        }, 0);
    }

    function buildNovoLiderForm({ empresas = [], empresaId = '', colaboradores = [] }) {
        const empresaOptions = empresas.map(e => `<option value="${e.id_empresa}" ${String(e.id_empresa)===String(empresaId)?'selected':''}>${sanitize(e.nome)}</option>`).join('');
        const colabOptions = colaboradores.map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
        return `
            <div class="form-grid">
                <div class="form-field">
                    <label class="form-label" for="form_empresa">Empresa *</label>
                    <select class="form-select" id="form_empresa" name="id_empresa" required>
                        <option value="">Selecione</option>
                        ${empresaOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="form_colaborador">Colaborador *</label>
                    <select class="form-select" id="form_colaborador" name="id_colaborador" required>
                        <option value="">Selecione</option>
                        ${colabOptions}
                    </select>
                </div>
            </div>
        `;
    }

    async function fetchColaboradores(idEmpresa) {
        if (!idEmpresa) return [];
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores?empresa_id=${encodeURIComponent(idEmpresa)}`, { method: 'GET' });
            const data = await resp.json();
            return data.success ? (data.data || []) : [];
        } catch { return [] }
    }

    async function viewLider(id) {
        const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        try {
            const [detResp, membrosResp, depsResp] = await Promise.all([
                auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'GET' }),
                auth.authenticatedRequest(`${apiBase}/lideres/${id}/membros`, { method: 'GET' }),
                auth.authenticatedRequest(`${apiBase}/lideres/${id}/departamentos`, { method: 'GET' })
            ]);
            const det = await parseJsonSafe(detResp);
            const membros = await parseJsonSafe(membrosResp);
            const deps = await parseJsonSafe(depsResp);
            if (!det.success) throw new Error(det.error || 'Erro ao buscar líder');
            const l = det.data || {};
            const membrosList = (membros.success ? (membros.data || []) : []).map(c => sanitize(c.nome)).join(', ') || '—';
            const depsList = (deps.success ? (deps.data || []) : []).map(d => sanitize(d.nome)).join(', ') || '—';
            const html = `
                <div class="details-grid">
                    <div class="details-item"><div class="details-label">Líder</div><div class="details-value">${sanitize(l.colaborador_nome)}</div></div>
                    <div class="details-item"><div class="details-label">Empresa</div><div class="details-value">${sanitize(l.empresa_nome)}</div></div>
                    <div class="details-item"><div class="details-label">Status</div><div class="details-value">${sanitize(l.status)}</div></div>
                    <div class="details-item span-2"><div class="details-label">Liderados</div><div class="details-value">${membrosList}</div></div>
                    <div class="details-item span-2"><div class="details-label">Departamentos</div><div class="details-value">${depsList}</div></div>
                </div>`;
            showInfoModal({ title: `Líder: ${sanitize(l.colaborador_nome)}`, html, closeText: 'Fechar', size: 'lg' });
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao carregar líder'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    async function openGerenciarMembros(id) {
        const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        try {
            const detResp = await auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'GET' });
            const det = await parseJsonSafe(detResp);
            if (!det.success) throw new Error(det.error || 'Líder não encontrado');
            const lider = det.data;
            const [membrosResp, candidatos] = await Promise.all([
                auth.authenticatedRequest(`${apiBase}/lideres/${id}/membros`, { method: 'GET' }).then(r => r.json()),
                fetchColaboradores(lider.id_empresa)
            ]);
            const membrosAtuais = membrosResp.success ? (membrosResp.data || []) : [];
            const membrosIds = new Set(membrosAtuais.map(m => m.id_colaborador));
            const candidatosDisponiveis = candidatos.filter(c => !membrosIds.has(c.id_colaborador) && c.id_colaborador !== lider.id_colaborador);
            const html = buildGerenciarMembrosHtml(membrosAtuais, candidatosDisponiveis);
            showFormModal({
                title: `Gerenciar Liderados — ${sanitize(lider.colaborador_nome)}`,
                formHtml: html,
                size: 'lg',
                submitText: 'Fechar',
                cancelText: 'Cancelar',
                onSubmit: async (form, close) => { close(); }
            });
            attachMembrosHandlers(id);
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao abrir gerenciador de liderados'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function buildGerenciarMembrosHtml(membros = [], candidatos = []) {
        const membrosList = (membros || []).map(m => `
            <div class="list-item" data-id="${m.id_colaborador}" style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid rgba(0,0,0,0.06);">
                <div style="font-weight:600; color:var(--gray-800);">${sanitize(m.nome)}</div>
                <button class="btn-icon error" data-action="remove-member" data-id="${m.id_colaborador}"><i class="bi bi-x"></i></button>
            </div>
        `).join('') || '<div class="form-help">Nenhum liderado vinculado.</div>';
        const candidatosOptions = (candidatos || []).map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
        return `
            <div class="form-grid">
                <div class="form-field span-2">
                    <label class="form-label">Liderados</label>
                    <div id="membrosList" class="list" style="border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:8px 12px; max-height:320px; overflow:auto;">${membrosList}</div>
                </div>
                <div class="form-field span-2">
                    <label class="form-label" for="novoMembro">Adicionar liderado</label>
                    <div style="display:flex; gap:8px;">
                        <select class="form-select" id="novoMembro">${candidatosOptions}</select>
                        <button class="btn btn-primary" id="addMembroBtn"><i class="bi bi-plus-lg"></i> Adicionar</button>
                    </div>
                </div>
            </div>
        `;
    }

    function attachMembrosHandlers(liderId) {
        document.getElementById('addMembroBtn')?.addEventListener('click', async function(){
            const select = document.getElementById('novoMembro');
            const lideradoId = select?.value;
            if (!lideradoId) return;
            const container = document.querySelector('#membrosList') || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
            try {
                const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${liderId}/membros`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ liderado_id: Number(lideradoId) }) });
                if (!resp.ok) throw new Error(`Erro ${resp.status} ao adicionar liderado`);
                const data = await parseJsonSafe(resp);
                // Atualizar modal
                await openGerenciarMembros(liderId);
            } catch (e) { try { showAlert('error', e.message || 'Erro ao adicionar liderado'); } catch {} }
            finally { try { loader.hide(); } catch {} }
        });
        document.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
            btn.addEventListener('click', async function(){
                const lideradoId = this.getAttribute('data-id');
                const container = document.querySelector('#membrosList') || document.body;
                const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${liderId}/membros/${lideradoId}`, { method: 'DELETE' });
                    if (!resp.ok) throw new Error(`Erro ${resp.status} ao remover liderado`);
                    const data = await parseJsonSafe(resp);
                    await openGerenciarMembros(liderId);
                } catch (e) { try { showAlert('error', e.message || 'Erro ao remover liderado'); } catch {} }
                finally { try { loader.hide(); } catch {} }
            });
        });
    }

    async function openGerenciarDepartamentos(id) {
        const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        try {
            const detResp = await auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'GET' });
            const det = await parseJsonSafe(detResp);
            if (!det.success) throw new Error(det.error || 'Líder não encontrado');
            const lider = det.data;
            const [depsResp, depsEmpresa] = await Promise.all([
                auth.authenticatedRequest(`${apiBase}/lideres/${id}/departamentos`, { method: 'GET' }).then(r => r.json()),
                auth.authenticatedRequest(`${apiBase}/departamentos?empresa_id=${encodeURIComponent(lider.id_empresa)}`, { method: 'GET' }).then(r => r.json())
            ]);
            const depsAtuais = depsResp.success ? (depsResp.data || []) : [];
            const todos = depsEmpresa.success ? (depsEmpresa.data || []) : [];
            const atuaisIds = new Set(depsAtuais.map(d => d.id_departamento));
            const disponiveis = todos.filter(d => !atuaisIds.has(d.id_departamento));
            const html = buildGerenciarDepartamentosHtml(depsAtuais, disponiveis);
            showFormModal({
                title: `Gerenciar Departamentos — ${sanitize(lider.colaborador_nome)}`,
                formHtml: html,
                size: 'lg',
                submitText: 'Fechar',
                cancelText: 'Cancelar',
                onSubmit: async (form, close) => { close(); }
            });
            attachDepartamentosHandlers(id);
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao abrir gerenciador de departamentos'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function buildGerenciarDepartamentosHtml(atuais = [], disponiveis = []) {
        const atuaisList = (atuais || []).map(d => `
            <div class="list-item" data-id="${d.id_departamento}" style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-bottom:1px solid rgba(0,0,0,0.06);">
                <div style="font-weight:600; color:var(--gray-800);">${sanitize(d.nome)}</div>
                <button class="btn-icon error" data-action="remove-dep" data-id="${d.id_departamento}"><i class="bi bi-x"></i></button>
            </div>
        `).join('') || '<div class="form-help">Nenhum departamento vinculado.</div>';
        const dispOptions = (disponiveis || []).map(d => `<option value="${d.id_departamento}">${sanitize(d.nome)}</option>`).join('');
        return `
            <div class="form-grid">
                <div class="form-field span-2">
                    <label class="form-label">Departamentos Vinculados</label>
                    <div id="depsList" class="list" style="border:1px solid rgba(0,0,0,0.06); border-radius:10px; padding:8px 12px; max-height:320px; overflow:auto;">${atuaisList}</div>
                </div>
                <div class="form-field span-2">
                    <label class="form-label" for="novoDep">Adicionar departamento</label>
                    <div style="display:flex; gap:8px;">
                        <select class="form-select" id="novoDep">${dispOptions}</select>
                        <button class="btn btn-primary" id="addDepBtn"><i class="bi bi-plus-lg"></i> Adicionar</button>
                    </div>
                </div>
            </div>
        `;
    }

    function attachDepartamentosHandlers(liderId) {
        document.getElementById('addDepBtn')?.addEventListener('click', async function(){
            const select = document.getElementById('novoDep');
            const depId = select?.value;
            if (!depId) return;
            const container = document.querySelector('#depsList') || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
            try {
                const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${liderId}/departamentos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ departamento_id: Number(depId) }) });
                const data = await resp.json();
                if (!data.success) throw new Error(data.error || 'Falha ao adicionar departamento');
                await openGerenciarDepartamentos(liderId);
            } catch (e) { try { showAlert('error', e.message || 'Erro ao adicionar departamento'); } catch {} }
            finally { try { loader.hide(); } catch {} }
        });
        document.querySelectorAll('[data-action="remove-dep"]').forEach(btn => {
            btn.addEventListener('click', async function(){
                const depId = this.getAttribute('data-id');
                const container = document.querySelector('#depsList') || document.body;
                const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${liderId}/departamentos/${depId}`, { method: 'DELETE' });
                    const data = await resp.json();
                    if (!data.success) throw new Error(data.error || 'Falha ao remover departamento');
                    await openGerenciarDepartamentos(liderId);
                } catch (e) { try { showAlert('error', e.message || 'Erro ao remover departamento'); } catch {} }
                finally { try { loader.hide(); } catch {} }
            });
        });
    }

    async function deleteLider(id) {
        try {
            const ok = await (window.showDeleteConfirm ? showDeleteConfirm('líder') : (window.showConfirm ? showConfirm({ title: 'Excluir líder', message: 'Confirma excluir este líder?', confirmText: 'Excluir', cancelText: 'Cancelar' }) : Promise.resolve(confirm('Confirma excluir este líder?'))));
            if (!ok) return;
        } catch {}
        const card = document.getElementById('tabelaLideres')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'DELETE' });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao excluir líder');
            await loadLideres();
            try { showAlert('success', 'Líder excluído com sucesso'); } catch {}
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao excluir líder'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function attachEvents() {
        els.btnNovo?.addEventListener('click', openNovoLiderModal);
        els.searchInput?.addEventListener('input', (window.EzerUtils && EzerUtils.debounce) ? EzerUtils.debounce(applyFilter, 300) : applyFilter);
        els.empresaSelect?.addEventListener('change', loadLideres);
        document.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (!action || !id) return;
            if (action === 'view') return viewLider(id);
            if (action === 'edit') return editLider(id); // TODO: implementar edição simples (status)
            if (action === 'members') return openGerenciarMembros(id);
            if (action === 'departments') return openGerenciarDepartamentos(id);
            if (action === 'delete') return deleteLider(id);
        });
    }

    async function editLider(id) {
        // Edição básica: alterar status e (opcionalmente) trocar colaborador
        const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        try {
            const detResp = await auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'GET' });
            const det = await parseJsonSafe(detResp);
            if (!det.success) throw new Error(det.error || 'Líder não encontrado');
            const lider = det.data;
            const empresas = empresasCache.length ? empresasCache : await loadEmpresas();
            const colaboradores = await fetchColaboradores(lider.id_empresa);
            const formHtml = `
                <div class="form-grid">
                    <div class="form-field">
                        <label class="form-label" for="edit_status">Status</label>
                        <select id="edit_status" class="form-select">
                            <option value="Ativo" ${lider.status==='Ativo'?'selected':''}>Ativo</option>
                            <option value="Inativo" ${lider.status==='Inativo'?'selected':''}>Inativo</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label class="form-label" for="edit_colaborador">Colaborador</label>
                        <select id="edit_colaborador" class="form-select">
                            ${colaboradores.map(c => `<option value="${c.id_colaborador}" ${c.id_colaborador===lider.id_colaborador?'selected':''}>${sanitize(c.nome)}</option>`).join('')}
                        </select>
                    </div>
                </div>`;
            showFormModal({
                title: `Editar Líder — ${sanitize(lider.colaborador_nome)}`,
                formHtml,
                size: 'lg',
                submitText: 'Salvar',
                cancelText: 'Cancelar',
                onSubmit: async (form, close) => {
                    const status = document.getElementById('edit_status')?.value || 'Ativo';
                    const id_colaborador = Number(document.getElementById('edit_colaborador')?.value);
                    try {
                        const resp = await auth.authenticatedRequest(`${apiBase}/lideres/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, id_colaborador, id_empresa: lider.id_empresa }) });
                        if (!resp.ok) throw new Error(`Erro ${resp.status} ao atualizar líder`);
                        const data = await parseJsonSafe(resp);
                        if (!data.success) throw new Error(data.error || 'Falha ao atualizar líder');
                        await loadLideres();
                        close();
                        try { showAlert('success', 'Líder atualizado com sucesso'); } catch {}
                    } catch (e) { try { showAlert('error', e.message || 'Erro ao atualizar líder'); } catch {} }
                }
            });
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao abrir edição'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    async function parseJsonSafe(resp) {
        try {
            const ct = resp.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                throw new Error(`Resposta inválida do servidor (${resp.status})`);
            }
            return await resp.json();
        } catch (e) {
            throw new Error(e.message || 'Falha ao interpretar resposta');
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            queryEls();
            attachEvents();
            await loadEmpresas();
            await loadLideres();
            // Controle de visibilidade de criação por role
            try {
                if (!(window.auth && auth.user && (auth.user.role === 'consultoria' || auth.user.role === 'empresa'))) {
                    if (els.btnNovo) els.btnNovo.style.display = 'none';
                }
            } catch {}
        } catch (e) { console.error('Falha ao inicializar líderes:', e); }
    });
})();


