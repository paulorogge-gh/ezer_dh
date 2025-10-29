(function(){
    const apiBase = window.API_CONFIG?.BASE_URL;

    let usuariosCache = [];
    const els = { tableBody: null, btnNovo: null, searchInput: null, empresaFilter: null, tipoFilter: null, statusFilter: null };

    function queryEls() {
        els.tableBody = document.querySelector('#usuariosTable tbody');
        els.btnNovo = document.getElementById('btnNovoUsuario');
        els.searchInput = document.getElementById('usuarioSearch');
        els.empresaFilter = document.getElementById('empresaUsuarioFilter');
        els.tipoFilter = document.getElementById('tipoUsuarioFilter');
        els.statusFilter = document.getElementById('statusUsuarioFilter');
    }

    function sanitize(v){ try { return (v||'').toString().trim(); } catch { return ''; } }

    function renderList(list) {
        if (!els.tableBody) return;
        els.tableBody.innerHTML = '';
        (list || []).forEach(renderRow);
    }

    function renderRow(u) {
        const tr = document.createElement('tr');
        const nextStatus = (u.status || '').toLowerCase() === 'ativo' ? 'Inativo' : 'Ativo';
        tr.innerHTML = `
            <td>${sanitize(u.nome || '')}</td>
            <td>${sanitize(u.email)}</td>
            <td>${sanitize(u.tipo_usuario)}</td>
            <td>${sanitize(u.status)}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${u.id_usuario}" title="Ver"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${u.id_usuario}" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-secondary btn-sm" data-action="reset" data-id="${u.id_usuario}" title="Resetar Senha"><i class="bi bi-key"></i></button>
                    <button class="btn-icon warning" data-action="toggle-status" data-id="${u.id_usuario}" data-next-status="${nextStatus}" title="${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'}"><i class="bi ${nextStatus === 'Inativo' ? 'bi-slash-circle' : 'bi-check-circle'}"></i></button>
                    <button class="btn-icon error" data-action="delete" data-id="${u.id_usuario}" title="Excluir"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        els.tableBody.appendChild(tr);
    }

    async function loadUsuarios() {
        const card = document.getElementById('usuariosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const params = new URLSearchParams();
            const emp = els.empresaFilter?.value || '';
            const tipo = els.tipoFilter?.value || '';
            const status = els.statusFilter?.value || '';
            if (emp) params.set('empresa_id', emp);
            if (tipo) params.set('tipo_usuario', tipo);
            if (status) params.set('status', status);
            const url = `${apiBase}/usuarios${params.toString() ? `?${params.toString()}` : ''}`;
            const resp = await auth.authenticatedRequest(url, { method: 'GET' });
            if (!resp.ok) throw new Error(`Erro ${resp.status} ao listar usuários`);
            const data = await parseJsonSafe(resp);
            if (!data.success) throw new Error(data.error || 'Falha ao listar usuários');
            usuariosCache = data.data || [];
            applySearchFilter();
        } catch (e) {
            console.error('Erro ao carregar usuários:', e);
            try { showAlert('error', e.message || 'Erro ao carregar usuários'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function applySearchFilter() {
        const q = sanitize(els.searchInput?.value || '').toLowerCase();
        let list = [...usuariosCache];
        if (q && q.length >= 2) list = list.filter(u => (sanitize(u.email).toLowerCase().includes(q) || sanitize(u.nome).toLowerCase().includes(q)));
        renderList(list);
    }

    async function populateEmpresas() {
        const sel = els.empresaFilter;
        if (!sel) return;
        const loader = window.EzerLoading ? EzerLoading.show(sel) : { hide(){} };
        try {
            const { list } = await EzerRBAC.populateEmpresaSelect(sel, { includeEmpty: true });
            if ((!list || !list.length) && auth?.user?.role === 'empresa') {
                const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                if (myId) {
                    try {
                        const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET' });
                        if (!r.ok) throw new Error(`Erro ${r.status} ao buscar empresa`);
                        const j = await parseJsonSafe(r);
                        if (j && j.success && j.data) {
                            sel.innerHTML = '<option value="">Todas</option>' + `<option value="${myId}">${sanitize(j.data.nome)}</option>`;
                        } else {
                            sel.innerHTML = '<option value="">Todas</option>' + `<option value="${myId}">Minha Empresa</option>`;
                        }
                    } catch {
                        sel.innerHTML = '<option value="">Todas</option>' + `<option value="${myId}">Minha Empresa</option>`;
                    }
                }
            }
        } finally { try { loader.hide(); } catch {} }
    }

    function buildCreateFormHtml() {
        return `
            <div class="form-grid">
                <div class="form-field"><label class="form-label" for="nome">Nome</label><input class="form-control" id="nome" name="nome" type="text" placeholder="Nome do usuário"></div>
                <div class="form-field"><label class="form-label" for="email">E-mail *</label><input class="form-control" id="email" name="email" type="email" required placeholder="email@dominio.com"></div>
                <div class="form-field"><label class="form-label" for="senha">Senha *</label><input class="form-control" id="senha" name="senha" type="password" required placeholder="Mínimo 6 caracteres"></div>
                <div class="form-field"><label class="form-label" for="tipo_usuario">Tipo *</label><select class="form-select" id="tipo_usuario" name="tipo_usuario" required><option value="">Selecione</option><option value="consultoria">Consultoria</option><option value="empresa">Empresa</option><option value="colaborador">Colaborador</option></select></div>
                <div class="form-field"><label class="form-label" for="empresa_id">Empresa</label><select class="form-select" id="empresa_id" name="empresa_id"><option value="">Selecione</option></select></div>
                <div class="form-field"><label class="form-label" for="colaborador_id">Colaborador</label><select class="form-select" id="colaborador_id" name="colaborador_id" disabled><option value="">Selecione a empresa primeiro</option></select></div>
                <div class="form-field"><label class="form-label" for="status">Status</label><select class="form-select" id="status" name="status"><option value="Ativo" selected>Ativo</option><option value="Inativo">Inativo</option></select></div>
            </div>
        `;
    }

    function openCreateModal() {
        showFormModal({
            title: 'Novo Usuário',
            formHtml: buildCreateFormHtml(),
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const fd = new FormData(form);
                const payload = Object.fromEntries(fd.entries());
                const errors = [];
                function markInvalid(id){ try { form.querySelector(`#${id}`)?.classList.add('is-invalid'); } catch {} }
                form.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
                const tipo = sanitize(payload.tipo_usuario);
                if (!sanitize(payload.email)) { errors.push('E-mail'); markInvalid('email'); }
                if (!sanitize(payload.senha) || sanitize(payload.senha).length < 6) { errors.push('Senha'); markInvalid('senha'); }
                if (!tipo) { errors.push('Tipo'); markInvalid('tipo_usuario'); }
                if (tipo === 'empresa') {
                    if (!Number(payload.empresa_id)) { errors.push('Empresa'); markInvalid('empresa_id'); }
                } else if (tipo === 'colaborador') {
                    if (!Number(payload.empresa_id)) { errors.push('Empresa'); markInvalid('empresa_id'); }
                    if (!Number(payload.colaborador_id)) { errors.push('Colaborador'); markInvalid('colaborador_id'); }
                }
                if (errors.length) { try { showAlert('warning', `Preencha: ${errors.join(', ')}`); } catch {} return; }
                if (payload.empresa_id) payload.empresa_id = Number(payload.empresa_id);
                if (payload.colaborador_id) payload.colaborador_id = Number(payload.colaborador_id);
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!resp.ok) throw new Error(`Erro ${resp.status} ao criar usuário`);
                    const j = await parseJsonSafe(resp);
                    if (!j.success) throw new Error(j.error || 'Falha ao criar usuário');
                    await loadUsuarios();
                    close();
                    try { showAlert('success', 'Usuário criado com sucesso'); } catch {}
                } catch (e) { try { showAlert('error', e.message || 'Erro ao criar usuário'); } catch {} }
            }
        });
        // Após renderização do modal, popular empresas e configurar dinâmica de colaborador
        try {
            const tipoSel = document.getElementById('tipo_usuario');
            const empSel = document.getElementById('empresa_id');
            const colSel = document.getElementById('colaborador_id');
            const role = (window.auth && auth.user && auth.user.role) || '';
            // Popular empresas via RBAC
            (async () => {
                try {
                    const tmp = document.createElement('select');
                    const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: true });
                    let opts = '<option value="">Selecione</option>' + (list || []).map(e => `<option value="${e.id_empresa}">${sanitize(e.nome)}</option>`).join('');
                    if ((!list || !list.length) && role === 'empresa') {
                        const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                        if (myId) {
                            try {
                                const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET' });
                                if (!r.ok) throw new Error(`Erro ${r.status} ao buscar empresa`);
                                const j = await parseJsonSafe(r);
                                if (j && j.success && j.data) {
                                    opts = '<option value="">Selecione</option>' + `<option value="${myId}">${sanitize(j.data.nome)}</option>`;
                                } else {
                                    opts = '<option value="">Selecione</option>' + `<option value="${myId}">Minha Empresa</option>`;
                                }
                            } catch {
                                opts = '<option value="">Selecione</option>' + `<option value="${myId}">Minha Empresa</option>`;
                            }
                        }
                    }
                    empSel.innerHTML = opts;
                    // Pré-selecionar e tornar visível para role empresa
                    if (role === 'empresa') {
                        const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                        if (myId) { try { empSel.value = String(myId); } catch {} }
                    }
                } catch {}
            })();
            // Mostrar/ocultar campos conforme tipo + garantir visibilidade de Empresa para role empresa
            const updateVisibility = () => {
                const t = sanitize(tipoSel.value);
                const empField = empSel.closest('.form-field');
                const colField = colSel.closest('.form-field');
                if (t === 'empresa') {
                    empField.style.display = '';
                    colField.style.display = 'none';
                } else if (t === 'colaborador') {
                    empField.style.display = '';
                    colField.style.display = '';
                } else {
                    // Se role empresa, manter Empresa visível mesmo sem tipo selecionado
                    if (role === 'empresa') {
                        empField.style.display = '';
                        colField.style.display = 'none';
                    } else if (role === 'consultoria') {
                        // Consultoria: deixar Empresa visível por padrão
                        empField.style.display = '';
                        colField.style.display = 'none';
                    } else {
                        empField.style.display = 'none';
                        colField.style.display = 'none';
                    }
                }
            };
            tipoSel.addEventListener('change', updateVisibility);
            // Se role empresa, definir tipo padrão para 'colaborador' para exibir campos
            if (role === 'empresa') { try { tipoSel.value = 'colaborador'; } catch {} }
            // Se role consultoria, definir tipo padrão para 'empresa' para exibir Empresa
            if (role === 'consultoria') { try { tipoSel.value = 'empresa'; } catch {} }
            updateVisibility();
            // Carregar colaboradores quando empresa mudar
            empSel.addEventListener('change', async () => {
                const emp = Number(empSel.value);
                if (!emp) {
                    colSel.innerHTML = '<option value="">Selecione a empresa primeiro</option>';
                    colSel.disabled = true;
                    return;
                }
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/empresas/${emp}/colaboradores`, { method: 'GET' });
                    const j = await parseJsonSafe(r);
                    const list = j.success ? (j.data || []) : [];
                    colSel.innerHTML = '<option value="">Selecione</option>' + list.map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
                    colSel.disabled = false;
                } catch {
                    colSel.innerHTML = '<option value="">Erro ao carregar</option>';
                    colSel.disabled = true;
                }
            });
        } catch {}
    }

    async function resetPassword(id) {
        try {
            const ok = await (window.showConfirm ? showConfirm({
                title: 'Resetar senha',
                message: 'Deseja definir uma nova senha para este usuário?',
                confirmText: 'Continuar',
                cancelText: 'Cancelar'
            }) : Promise.resolve(confirm('Deseja definir uma nova senha para este usuário?')));
            if (!ok) return;
        } catch {}

        const formHtml = `
            <div class="form-grid">
                <div class="form-field">
                    <label class="form-label" for="nova_senha">Nova Senha *</label>
                    <input class="form-control" id="nova_senha" name="nova_senha" type="password" required minlength="6" placeholder="Mínimo 6 caracteres">
                </div>
                <div class="form-field">
                    <label class="form-label" for="confirma_senha">Confirmar Senha *</label>
                    <input class="form-control" id="confirma_senha" name="confirma_senha" type="password" required minlength="6" placeholder="Repita a nova senha">
                </div>
            </div>
        `;

        if (!window.showFormModal) {
            try { showAlert('error', 'Componente de formulário não disponível.'); } catch {}
            return;
        }

        showFormModal({
            title: 'Definir nova senha',
            formHtml,
            size: 'md',
            submitText: 'Atualizar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const fd = new FormData(form);
                const nova = (fd.get('nova_senha') || '').toString().trim();
                const confirma = (fd.get('confirma_senha') || '').toString().trim();
                form.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
                let hasError = false;
                if (!nova || nova.length < 6) { try { form.querySelector('#nova_senha')?.classList.add('is-invalid'); } catch {}; hasError = true; }
                if (!confirma || confirma.length < 6 || confirma !== nova) { try { form.querySelector('#confirma_senha')?.classList.add('is-invalid'); } catch {}; hasError = true; }
                if (hasError) { try { showAlert('warning', 'Verifique os campos de senha'); } catch {}; return; }

                const loader = window.EzerLoading ? EzerLoading.show(form.closest('.modal') || document.body) : { hide(){} };
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nova_senha: nova })
                    });
                    const j = await parseJsonSafe(resp);
                    if (!j.success) throw new Error(j.error || 'Falha ao redefinir senha');
                    try { showAlert('success', 'Senha redefinida com sucesso'); } catch {}
                    close();
                } catch (e) { try { showAlert('error', e.message || 'Erro ao redefinir senha'); } catch {} }
                finally { try { loader.hide(); } catch {} }
            }
        });
    }

    async function deleteUsuario(id) {
        try {
            const ok = await (window.showDeleteConfirm ? showDeleteConfirm('usuário') : (window.showConfirm ? showConfirm({ title: 'Excluir usuário', message: 'Tem certeza que deseja excluir este usuário?', confirmText: 'Excluir', cancelText: 'Cancelar' }) : Promise.resolve(confirm('Excluir este usuário?'))));
            if (!ok) return;
        } catch {}
        const card = document.getElementById('usuariosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}`, { method: 'DELETE' });
            if (!resp.ok) throw new Error(`Erro ${resp.status} ao excluir usuário`);
            const j = await parseJsonSafe(resp);
            if (!j.success) throw new Error(j.error || 'Falha ao excluir usuário');
            await loadUsuarios();
            try { showAlert('success', 'Usuário excluído com sucesso'); } catch {}
        } catch (e) { try { showAlert('error', e.message || 'Erro ao excluir usuário'); } catch {} }
        finally { try { loader.hide(); } catch {} }
    }

    async function toggleStatus(id, nextStatus) {
        const card = document.getElementById('usuariosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
            const j = await parseJsonSafe(resp);
            if (!j.success) throw new Error(j.error || 'Falha ao atualizar status');
            await loadUsuarios();
            try { showAlert('success', `Status alterado para ${nextStatus}`); } catch {}
        } catch (e) { try { showAlert('error', e.message || 'Erro ao alterar status'); } catch {} }
        finally { try { loader.hide(); } catch {} }
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

    function attachEvents() {
        els.btnNovo?.addEventListener('click', openCreateModal);
        els.searchInput?.addEventListener('input', (window.EzerUtils && EzerUtils.debounce) ? EzerUtils.debounce(applySearchFilter, 300) : applySearchFilter);
        els.empresaFilter?.addEventListener('change', loadUsuarios);
        els.tipoFilter?.addEventListener('change', loadUsuarios);
        els.statusFilter?.addEventListener('change', loadUsuarios);
        document.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (!action || !id) return;
            if (action === 'reset') return resetPassword(id);
            if (action === 'delete') return deleteUsuario(id);
            if (action === 'toggle-status') { const ns = btn.getAttribute('data-next-status'); return toggleStatus(id, ns); }
            if (action === 'edit') return editUsuario(id);
            if (action === 'view') return viewUsuario(id);
        });
    }

    async function editUsuario(id) {
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}`, { method: 'GET' });
            if (!resp.ok) throw new Error(`Erro ${resp.status} ao obter usuário`);
            const j = await parseJsonSafe(resp);
            if (!j.success) throw new Error(j.error || 'Usuário não encontrado');
            const u = j.data || {};
            const formHtml = `
                <div class="form-grid">
                    <div class="form-field"><label class="form-label" for="nome">Nome</label><input class="form-control" id="nome" name="nome" type="text" value="${sanitize(u.nome || '')}" placeholder="Nome do usuário"></div>
                    <div class="form-field"><label class="form-label" for="email">E-mail</label><input class="form-control" id="email" name="email" type="email" value="${sanitize(u.email)}"></div>
                    <div class="form-field"><label class="form-label" for="empresa_id">Empresa</label><select class="form-select" id="empresa_id" name="empresa_id"><option value="">Selecione</option></select></div>
                    <div class="form-field"><label class="form-label" for="senha">Nova Senha</label><input class="form-control" id="senha" name="senha" type="password" placeholder="Deixe em branco para manter"></div>
                    <div class="form-field"><label class="form-label" for="status">Status</label><select class="form-select" id="status" name="status"><option ${u.status==='Ativo'?'selected':''} value="Ativo">Ativo</option><option ${u.status==='Inativo'?'selected':''} value="Inativo">Inativo</option></select></div>
                </div>
            `;
            showFormModal({
                title: `Editar Usuário — ${sanitize(u.email)}`,
                formHtml,
                size: 'lg',
                submitText: 'Salvar',
                cancelText: 'Cancelar',
                onSubmit: async (form, close) => {
                    const fd = new FormData(form);
                    const payload = Object.fromEntries(fd.entries());
                    // Converter empresa_id para número, se presente
                    if (payload.empresa_id) payload.empresa_id = Number(payload.empresa_id);
                    if (payload.senha && payload.senha.length < 6) { try { showAlert('warning', 'Senha inválida'); } catch {} return; }
                    // Validação mínima: para usuários do tipo colaborador, exigir empresa
                    if (sanitize(u.tipo_usuario) === 'colaborador' && !Number(payload.empresa_id)) {
                        try { form.querySelector('#empresa_id')?.classList.add('is-invalid'); } catch {}
                        try { showAlert('warning', 'Selecione a Empresa para este colaborador'); } catch {}
                        return;
                    }
                    try {
                        const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                        if (!resp.ok) throw new Error(`Erro ${resp.status} ao atualizar usuário`);
                        const j = await parseJsonSafe(resp);
                        if (!j.success) throw new Error(j.error || 'Falha ao atualizar');
                        await loadUsuarios();
                        close();
                        try { showAlert('success', 'Usuário atualizado com sucesso'); } catch {}
                    } catch (e) { try { showAlert('error', e.message || 'Erro ao atualizar usuário'); } catch {} }
                }
            });
            // Após renderização do modal, popular empresas e controlar visibilidade
            try {
                const empSel = document.getElementById('empresa_id');
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (empSel) {
                    const loader = window.EzerLoading ? EzerLoading.show(empSel) : { hide(){} };
                    try {
                        const tmp = document.createElement('select');
                        const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: true });
                        let opts = '<option value="">Selecione</option>' + (list || []).map(e => `<option value="${e.id_empresa}">${sanitize(e.nome)}</option>`).join('');
                        // Se role empresa e não houver lista, tentar carregar a própria empresa
                        if ((!list || !list.length) && role === 'empresa') {
                            const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                            if (myId) {
                                try {
                                    const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET' });
                                    if (!r.ok) throw new Error(`Erro ${r.status} ao buscar empresa`);
                                    const j = await parseJsonSafe(r);
                                    if (j && j.success && j.data) {
                                        opts = '<option value="">Selecione</option>' + `<option value="${myId}">${sanitize(j.data.nome)}</option>`;
                                    } else {
                                        opts = '<option value="">Selecione</option>' + `<option value="${myId}">Minha Empresa</option>`;
                                    }
                                } catch {
                                    opts = '<option value="">Selecione</option>' + `<option value="${myId}">Minha Empresa</option>`;
                                }
                            }
                        }
                        empSel.innerHTML = opts;
                        // Pré-selecionar valor do usuário, se existir
                        if (Number(u.id_empresa)) { try { empSel.value = String(u.id_empresa); } catch {} }
                        // Ocultar para consultoria
                        const empField = empSel.closest('.form-field');
                        if (sanitize(u.tipo_usuario) === 'consultoria') {
                            try { empField.style.display = 'none'; } catch {}
                        } else {
                            try { empField.style.display = ''; } catch {}
                        }
                    } finally { try { loader.hide(); } catch {} }
                }
            } catch {}
        } catch (e) { try { showAlert('error', e.message || 'Erro ao abrir edição'); } catch {} }
    }

    async function viewUsuario(id) {
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/usuarios/${id}`, { method: 'GET' });
            if (!resp.ok) throw new Error(`Erro ${resp.status} ao obter usuário`);
            const j = await parseJsonSafe(resp);
            if (!j.success) throw new Error(j.error || 'Usuário não encontrado');
            const u = j.data || {};
            const html = `
                <div class="details-grid">
                    <div class="details-item"><div class="details-label">E-mail</div><div class="details-value">${sanitize(u.email)}</div></div>
                    <div class="details-item"><div class="details-label">Tipo</div><div class="details-value">${sanitize(u.tipo_usuario)}</div></div>
                    <div class="details-item"><div class="details-label">Status</div><div class="details-value">${sanitize(u.status)}</div></div>
                </div>
            `;
            showInfoModal({ title: 'Detalhes do Usuário', html, closeText: 'Fechar', size: 'lg' });
        } catch (e) { try { showAlert('error', e.message || 'Erro ao exibir detalhes'); } catch {} }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            queryEls();
            attachEvents();
            await populateEmpresas();
            await loadUsuarios();
            // Visibilidade de botões conforme RBAC simples
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (!(role === 'consultoria' || role === 'empresa')) {
                    if (els.btnNovo) els.btnNovo.style.display = 'none';
                }
            } catch {}
        } catch (e) { console.error('Falha ao inicializar usuários:', e); }
    });
})();



