(function(){
    const apiBase = window.API_CONFIG?.BASE_URL;

    let colaboradoresCache = [];
    const els = { tableBody: null, btnNovo: null, searchInput: null };

    function formatDateDisplay(value) {
        if (!value) return '-';
        try {
            // yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [y, m, d] = value.split('-');
                return `${d}/${m}/${y}`;
            }
            // dd/mm/yyyy
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
            // ISO -> dd/mm/yyyy
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yy = String(d.getFullYear());
                return `${dd}/${mm}/${yy}`;
            }
            return '-';
        } catch { return '-'; }
    }

    function toInputDate(value) {
        if (!value) return '';
        try {
            // Se já estiver em yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
            // dd/mm/aaaa -> yyyy-mm-dd
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                const [d, m, y] = value.split('/');
                return `${y}-${m}-${d}`;
            }
            // ISO -> yyyy-mm-dd
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
            return '';
        } catch { return ''; }
    }

    function normalizeDateForApi(value) {
        if (!value) return null;
        try {
            // aceitar yyyy-mm-dd, dd/mm/aaaa, ISO
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
                const [d, m, y] = value.split('/');
                return `${y}-${m}-${d}`;
            }
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
            return null;
        } catch { return null; }
    }

    function queryEls() {
        els.tableBody = document.querySelector('#tabelaColaboradores tbody');
        els.btnNovo = document.getElementById('btnNovoColaborador');
        els.searchInput = document.getElementById('colaboradorSearch');
    }

    function renderList(list) {
        if (!els.tableBody) return;
        els.tableBody.innerHTML = '';
        (list || []).forEach(renderRow);
    }

    function renderRow(c) {
        const tr = document.createElement('tr');
        const nextStatus = (c.status || '').toLowerCase() === 'ativo' ? 'Inativo' : 'Ativo';
        tr.innerHTML = `
            <td>${c.nome || ''}</td>
            <td>${c.email_corporativo || c.email || ''}</td>
            <td>${c.empresa_nome || ''}</td>
            <td>${c.status || ''}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${c.id_colaborador}" title="Ver">
                                <i class="bi bi-eye"></i>
                            </button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id_colaborador}" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                    <button class="btn-icon warning" data-action="toggle-status" data-id="${c.id_colaborador}" data-next-status="${nextStatus}" title="${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'}">
                        <i class="bi ${nextStatus === 'Inativo' ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
                    </button>
                    <button class="btn-icon error" data-action="delete" data-id="${c.id_colaborador}" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
            </td>
        `;
        els.tableBody.appendChild(tr);
    }

    async function loadColaboradores() {
        const card = document.querySelector('#tabelaColaboradores')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const role = (window.auth && auth.user && auth.user.role) || '';
            let url = `${apiBase}/colaboradores`;
            if (role === 'empresa') {
                const payloadEmp = (typeof auth?.getTokenPayload === 'function') ? (auth.getTokenPayload()?.empresa_id || null) : null;
                const myId = (auth.user.id_empresa || payloadEmp) || null;
                if (myId) url = `${apiBase}/colaboradores?empresa_id=${encodeURIComponent(myId)}`;
            }
            const resp = await auth.authenticatedRequest(url, { method: 'GET' });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao listar colaboradores');
            colaboradoresCache = data.data || [];
            renderList(colaboradoresCache);
        } catch (e) {
            console.error('Erro ao carregar colaboradores:', e);
            try { showAlert('error', e.message || 'Erro ao carregar colaboradores'); } catch {}
        } finally {
            try { loader.hide(); } catch {}
        }
    }

    async function loadKpi() {
        if (!window.EzerKPI) return;
        const kpiContainer = document.querySelector('#kpiColaboradores') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(kpiContainer) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/stats/global`, { method: 'GET' });
            const json = await resp.json();
            if (!json.success) return;
            const s = json.data || { total: 0, ativos: 0, inativos: 0 };
            EzerKPI.render('#kpiColaboradores', [
                { label: 'Total de Colaboradores', value: s.total, valueId: 'colabsTotal', icon: 'bi-people', variant: 'primary' },
                { label: 'Ativos', value: s.ativos, valueId: 'colabsAtivos', icon: 'bi-check-circle', variant: 'success' },
                { label: 'Inativos', value: s.inativos, valueId: 'colabsInativos', icon: 'bi-slash-circle', variant: 'error' }
            ]);
        } finally {
            try { loader.hide(); } catch {}
        }
    }

    function filterList(ev) {
        const q = (ev?.target?.value || '').toString().trim().toLowerCase();
        if (!q || q.length < 3) { renderList(colaboradoresCache); return; }
        const filtered = colaboradoresCache.filter(c => {
            const nome = (c.nome || '').toLowerCase();
            const cpf = (c.cpf || '').toLowerCase();
            const email = (c.email_corporativo || c.email || '').toLowerCase();
            return nome.includes(q) || cpf.includes(q) || email.includes(q);
        });
        renderList(filtered);
    }

    async function viewColaborador(id) {
        const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        try {
            const [detResp, depsResp] = await Promise.all([
                auth.authenticatedRequest(`${apiBase}/colaboradores/${id}`, { method: 'GET' }),
                auth.authenticatedRequest(`${apiBase}/colaboradores/${id}/departamentos`, { method: 'GET' })
            ]);
            const detData = await detResp.json();
            const depsData = await depsResp.json().catch(() => ({ success: true, data: [] }));
            if (!detData.success) throw new Error(detData.error || 'Erro ao buscar colaborador');
            const c = detData.data || {};
            const departamentos = (depsData && depsData.success ? depsData.data || [] : []).map(d => d.nome).join(', ') || '-';
            const html = `
                <div class="details-grid">
                    <div class="details-item"><div class="details-label">Nome</div><div class="details-value">${c.nome || '-'}</div></div>
                    <div class="details-item"><div class="details-label">CPF</div><div class="details-value">${c.cpf || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Data de Nascimento</div><div class="details-value">${formatDateDisplay(c.data_nascimento)}</div></div>
                    <div class="details-item"><div class="details-label">Telefone</div><div class="details-value">${c.telefone || '-'}</div></div>
                    <div class="details-item"><div class="details-label">E-mail Corporativo</div><div class="details-value">${c.email_corporativo || '-'}</div></div>
                    <div class="details-item"><div class="details-label">E-mail Pessoal</div><div class="details-value">${c.email_pessoal || c.email || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Empresa</div><div class="details-value">${c.empresa_nome || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Departamentos</div><div class="details-value">${departamentos}</div></div>
                    <div class="details-item"><div class="details-label">Cargo</div><div class="details-value">${c.cargo || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Tipo de Contrato</div><div class="details-value">${c.tipo_contrato || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Data de Admissão</div><div class="details-value">${formatDateDisplay(c.data_admissao)}</div></div>
                    <div class="details-item"><div class="details-label">Remuneração (R$)</div><div class="details-value">${c.remuneracao || '-'}</div></div>
                    <div class="details-item"><div class="details-label">Status</div><div class="details-value">${c.status || '-'}</div></div>
                </div>`;
            showInfoModal({ title: `Colaborador: ${c.nome || ''}`, html, closeText: 'Fechar', size: 'lg' });
        } catch (e) {
            console.error('viewColaborador error:', e);
            try { showAlert('error', e.message || 'Erro ao carregar colaborador'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function buildFormHtml(c = {}, empresas = [], departamentos = [], selectedDepIds = []) {
        const empresasOptions = empresas.map(e => `<option value="${e.id_empresa}" ${c.id_empresa === e.id_empresa ? 'selected' : ''}>${e.nome}</option>`).join('');
        const depsOptions = departamentos.map(d => {
            const checked = Array.isArray(selectedDepIds) && selectedDepIds.includes(d.id_departamento) ? 'checked' : '';
            return `<label class="form-check"><input class="form-check-input" type="checkbox" name="departamentos[]" value="${d.id_departamento}" ${checked}><span class="form-check-label">${d.nome}</span></label>`;
        }).join('');
        return `
            <input type="hidden" name="id_colaborador" value="${c.id_colaborador || ''}">
            <div class="form-grid">
                <div class="form-field span-2"><label class="form-label" for="nome">Nome *</label><input class="form-control" id="nome" name="nome" required value="${c.nome || ''}" placeholder="Nome completo"></div>
                <div class="form-field"><label class="form-label" for="cpf">CPF *</label><input class="form-control" id="cpf" name="cpf" required value="${c.cpf || ''}" placeholder="000.000.000-00"></div>
                <div class="form-field"><label class="form-label" for="data_nascimento">Data de Nascimento</label><input class="form-control" id="data_nascimento" name="data_nascimento" type="date" value="${toInputDate(c.data_nascimento)}"></div>
                <div class="form-field"><label class="form-label" for="telefone">Telefone</label><input class="form-control" id="telefone" name="telefone" value="${c.telefone || ''}" placeholder="(00) 00000-0000"></div>
                <div class="form-field"><label class="form-label" for="email_corporativo">E-mail Corporativo</label><input class="form-control" id="email_corporativo" name="email_corporativo" type="email" value="${c.email_corporativo || ''}" placeholder="email@empresa.com"></div>
                <div class="form-field"><label class="form-label" for="email_pessoal">E-mail Pessoal</label><input class="form-control" id="email_pessoal" name="email_pessoal" type="email" value="${c.email_pessoal || ''}" placeholder="seuemail@dominio.com"></div>
                <div class="form-field span-2"><label class="form-label" for="id_empresa">Empresa *</label><select class="form-select" id="id_empresa" name="id_empresa" required><option value="">Selecione</option>${empresasOptions}</select></div>
                <div class="form-field span-2"><label class="form-label" for="departamentos">Departamentos</label><div id="departamentos" class="checkbox-list">${depsOptions}</div></div>
                <div class="form-field"><label class="form-label" for="cargo">Cargo</label><input class="form-control" id="cargo" name="cargo" value="${c.cargo || ''}" placeholder="Cargo atual"></div>
                <div class="form-field"><label class="form-label" for="tipo_contrato">Tipo de Contrato</label><select class="form-select" id="tipo_contrato" name="tipo_contrato"><option value="">Selecione</option><option ${c.tipo_contrato==='CLT'?'selected':''} value="CLT">CLT</option><option ${c.tipo_contrato==='Prestador de Serviço'?'selected':''} value="Prestador de Serviço">Prestador de Serviço</option><option ${c.tipo_contrato==='Estagiário'?'selected':''} value="Estagiário">Estagiário</option><option ${c.tipo_contrato==='Jovem Aprendiz'?'selected':''} value="Jovem Aprendiz">Jovem Aprendiz</option></select></div>
                <div class="form-field"><label class="form-label" for="data_admissao">Data de Admissão</label><input class="form-control" id="data_admissao" name="data_admissao" type="date" value="${toInputDate(c.data_admissao)}"></div>
                <div class="form-field"><label class="form-label" for="remuneracao">Remuneração (R$)</label><input class="form-control" id="remuneracao" name="remuneracao" value="${(c.remuneracao || '')}" placeholder="0,00"></div>
                <div class="form-field"><label class="form-label" for="status">Status</label><select class="form-select" id="status" name="status"><option ${c.status==='Ativo'?'selected':''} value="Ativo">Ativo</option><option ${c.status==='Inativo'?'selected':''} value="Inativo">Inativo</option></select></div>
            </div>`;
    }

    async function fetchEmpresasAtivas() {
        // Consultoria: todas ativas; Empresa/Colaborador: apenas sua empresa
        try {
            const el = document.createElement('select');
            const { list } = await EzerRBAC.populateEmpresaSelect(el, { includeEmpty: false });
            if (Array.isArray(list) && list.length > 0) return list;
            // Fallback robusto para role empresa
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (role === 'empresa') {
                    const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                    if (myId) {
                        const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method: 'GET' });
                        const j = await r.json();
                        if (j && j.success && j.data) return [j.data];
                        return [{ id_empresa: myId, nome: 'Minha Empresa' }];
                    }
                }
            } catch {}
            return [];
        } catch { return []; }
    }

    async function fetchDepartamentosPorEmpresa(idEmpresa) {
        try {
            if (!idEmpresa) return [];
            const resp = await auth.authenticatedRequest(`${apiBase}/departamentos?empresa_id=${encodeURIComponent(idEmpresa)}`, { method: 'GET' });
            const data = await resp.json();
            return data.success ? (data.data || []) : [];
        } catch { return []; }
    }

    async function openForm(colab) {
        const pageLoader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
        let empresas = [];
        let departamentos = [];
        try {
            [empresas] = await Promise.all([fetchEmpresasAtivas()]);
            // Fallback: se ainda estiver vazio e role empresa, tentar derivar manualmente
            try {
                if ((!empresas || !empresas.length) && auth?.user?.role === 'empresa') {
                    const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                    if (myId) empresas = [{ id_empresa: myId, nome: 'Minha Empresa' }];
                }
            } catch {}
            const initialEmpresaId = (colab && colab.id_empresa) ? colab.id_empresa : (empresas[0]?.id_empresa || null);
            departamentos = await fetchDepartamentosPorEmpresa(initialEmpresaId);
        } finally {
            try { pageLoader.hide(); } catch {}
        }
        let selectedDepIds = [];
        try {
            if (colab && colab.id_colaborador) {
                const depsResp = await auth.authenticatedRequest(`${apiBase}/colaboradores/${colab.id_colaborador}/departamentos`, { method: 'GET' });
                const depsJson = await depsResp.json();
                if (depsJson.success) {
                    selectedDepIds = (depsJson.data || []).map(d => d.id_departamento);
                }
            }
        } catch {}
        const isEdit = !!(colab && colab.id_colaborador);
        const formHtml = buildFormHtml(colab || {}, empresas, departamentos, selectedDepIds);
        const modalRef = showFormModal({
            title: isEdit ? 'Editar Colaborador' : 'Novo Colaborador',
            formHtml,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const fd = new FormData(form);
                const payload = Object.fromEntries(fd.entries());
                // Validação RF024 (Frontend) antes de enviar
                const errors = [];
                function markInvalid(idOrEl) {
                    try {
                        const el = typeof idOrEl === 'string' ? form.querySelector(`#${idOrEl}`) : idOrEl;
                        if (el) el.classList.add('is-invalid');
                    } catch {}
                }
                // Limpar estados
                form.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
                const depBox = form.querySelector('.checkbox-list');
                if (depBox) depBox.classList.remove('invalid');

                // Nome
                payload.nome = (payload.nome || '').trim();
                if (!payload.nome) { errors.push('Nome'); markInvalid('nome'); }
                // CPF
                payload.cpf = (payload.cpf || '').trim();
                if (!payload.cpf) { errors.push('CPF'); markInvalid('cpf'); }
                // Empresa
                if (!payload.id_empresa) { errors.push('Empresa'); markInvalid('id_empresa'); }
                // Datas
                const dn = form.querySelector('#data_nascimento')?.value || '';
                const da = form.querySelector('#data_admissao')?.value || '';
                if (!dn) { errors.push('Data de Nascimento'); markInvalid('data_nascimento'); }
                if (!da) { errors.push('Data de Admissão'); markInvalid('data_admissao'); }
                // E-mails
                const emailCorp = (form.querySelector('#email_corporativo')?.value || '').trim();
                const emailPes = (form.querySelector('#email_pessoal')?.value || '').trim();
                if (!emailCorp && !emailPes) { errors.push('E-mail'); markInvalid('email_corporativo'); markInvalid('email_pessoal'); }
                // Telefone
                const tel = (form.querySelector('#telefone')?.value || '').trim();
                if (!tel) { errors.push('Telefone'); markInvalid('telefone'); }
                // Departamentos
                const selectedDeps = Array.from(form.querySelectorAll('input[name="departamentos[]"]:checked'));
                if (selectedDeps.length === 0) { errors.push('Departamento(s)'); if (depBox) depBox.classList.add('invalid'); }
                // Cargo
                const cargo = (form.querySelector('#cargo')?.value || '').trim();
                if (!cargo) { errors.push('Cargo'); markInvalid('cargo'); }
                // Remuneração (aceitar formato BRL ex.: 1.234,56)
                const remunRaw = form.querySelector('#remuneracao')?.value;
                const remunSanitized = remunRaw ? remunRaw.toString().replace(/\./g, '').replace(',', '.') : '';
                if (remunSanitized === '' || Number.isNaN(Number(remunSanitized))) { errors.push('Remuneração'); markInvalid('remuneracao'); }
                // Tipo de contrato
                const tipo = form.querySelector('#tipo_contrato')?.value;
                if (!tipo) { errors.push('Tipo de Contrato'); markInvalid('tipo_contrato'); }

                if (errors.length) {
                    try { showAlert('warning', `Preencha os campos obrigatórios: ${errors.join(', ')}`); } catch {}
                    // Focar no primeiro inválido
                    const firstInvalid = form.querySelector('.is-invalid') || form.querySelector('.checkbox-list.invalid');
                    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
                    return; // abortar submit
                }
                // Ajustes de campos
                payload.nome = (payload.nome || '').trim();
                payload.cpf = (payload.cpf || '').trim();
                payload.email_corporativo = (payload.email_corporativo || '').trim() || null;
                payload.email_pessoal = (payload.email_pessoal || '').trim() || null;
                payload.telefone = (payload.telefone || '').trim() || null;
                payload.cargo = (payload.cargo || '').trim() || null;
                payload.tipo_contrato = payload.tipo_contrato || null;
                payload.data_nascimento = normalizeDateForApi(payload.data_nascimento);
                payload.data_admissao = normalizeDateForApi(payload.data_admissao);
                // Converter BRL (1.234,56) -> 1234.56 (string) para API
                if (payload.remuneracao) {
                    try {
                        const digits = (payload.remuneracao || '').toString().replace(/\./g, '').replace(',', '.');
                        payload.remuneracao = digits;
                    } catch { payload.remuneracao = null; }
                } else {
                    payload.remuneracao = null;
                }
                payload.status = payload.status || 'Ativo';
                payload.id_empresa = payload.id_empresa ? Number(payload.id_empresa) : null;
                // Enviar departamentos para o backend reconciliar
                try {
                    const selectedIds = Array.from(form.querySelectorAll('input[name="departamentos[]"]:checked'))
                        .map(i => Number(i.value))
                        .filter(Boolean);
                    payload.departamentos = selectedIds;
                } catch { payload.departamentos = []; }

                // Validação mínima
                if (!payload.nome || !payload.cpf || !payload.id_empresa) {
                    try { showAlert('warning', 'Preencha Nome, CPF e Empresa'); } catch {}
        return;
    }
    
                let data;
                try {
                    const method = isEdit ? 'PUT' : 'POST';
                    const url = isEdit ? `${apiBase}/colaboradores/${colab.id_colaborador}` : `${apiBase}/colaboradores`;
                    const resp = await auth.authenticatedRequest(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    data = await resp.json();
                    if (!data.success) throw new Error(data.error || 'Falha ao salvar colaborador');
                } catch (err) {
                    console.error('Salvar colaborador erro:', err);
                    try { showAlert('error', err.message || 'Erro ao salvar colaborador'); } catch {}
                    return; // não fechar modal, permitir correção
                }

                await loadColaboradores();
                close();
                try { showAlert('success', isEdit ? 'Colaborador atualizado com sucesso' : 'Colaborador criado com sucesso'); } catch {}
            }
        });

        // Aplicar máscaras e anexar mudança dinâmica de empresa -> departamentos
        try {
            if (window.EzerMasks) {
                const root = document;
                EzerMasks.attachMask(document.getElementById('cpf'), 'cpf');
                EzerMasks.attachMask(document.getElementById('telefone'), 'telefone');
                EzerMasks.attachMask(document.getElementById('data_nascimento'), 'date');
                EzerMasks.attachMask(document.getElementById('data_admissao'), 'date');
                // Máscara de moeda BRL para remuneração (modal é dinâmico)
                const remEl = document.getElementById('remuneracao');
                if (remEl) {
                    EzerMasks.attachMask(remEl, 'currency');
                    // Forçar formatação inicial caso venha valor bruto do backend
                    try { remEl.value = EzerMasks.maskCurrencyBRL(remEl.value || ''); } catch {}
                }
            }
            // Atualizar lista de departamentos ao mudar empresa
            const empresaSelect = document.getElementById('id_empresa');
            const depContainer = document.getElementById('departamentos');
            if (empresaSelect && depContainer) {
                empresaSelect.addEventListener('change', async function() {
                    const idEmp = this.value ? Number(this.value) : null;
                    const loader = window.EzerLoading ? EzerLoading.show(depContainer) : { hide(){} };
                    try {
                        const deps = await fetchDepartamentosPorEmpresa(idEmp);
                        const html = (deps || []).map(d => `<label class="form-check"><input class="form-check-input" type="checkbox" name="departamentos[]" value="${d.id_departamento}"><span class="form-check-label">${d.nome}</span></label>`).join('');
                        depContainer.innerHTML = html || '<div class="form-help">Nenhum departamento para a empresa selecionada</div>';
                    } finally { try { loader.hide(); } catch {} }
                });
            }
        } catch {}
        return modalRef;
    }

    async function fetchById(id) {
        const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/${id}`, { method: 'GET' });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Erro ao buscar colaborador');
        return data.data;
}

async function deleteColaborador(id) {
        try {
            const ok = await (window.showDeleteConfirm ? showDeleteConfirm('colaborador') : (window.showConfirm ? showConfirm({ title: 'Excluir colaborador', message: 'Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.', confirmText: 'Excluir', cancelText: 'Cancelar' }) : Promise.resolve(confirm('Tem certeza que deseja excluir este colaborador?'))));
            if (!ok) return;
        } catch {}
        const card = document.querySelector('#tabelaColaboradores')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/${id}`, { method: 'DELETE' });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao excluir colaborador');
            await loadColaboradores();
            try { showAlert('success', 'Colaborador excluído com sucesso'); } catch {}
        } catch (e) {
            console.error('Erro ao excluir colaborador:', e);
            try { showAlert('error', e.message || 'Erro ao excluir colaborador'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    async function toggleStatus(id, nextStatus) {
        try {
            const ok = await (window.showConfirm ? showConfirm({
                title: `${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'} colaborador`,
                message: `Confirma alterar o status para "${nextStatus}"?`,
                confirmText: 'Confirmar',
                cancelText: 'Cancelar'
            }) : Promise.resolve(confirm(`Confirma alterar o status para "${nextStatus}"?`)));
            if (!ok) return;
        } catch {}
        const card = document.querySelector('#tabelaColaboradores')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Falha ao alterar status');
            await loadColaboradores();
            try { showAlert('success', `Status alterado para ${nextStatus}`); } catch {}
        } catch (e) {
            console.error('Erro ao alterar status:', e);
            try { showAlert('error', e.message || 'Erro ao alterar status'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function attachEvents() {
        els.btnNovo?.addEventListener('click', async () => openForm());
        els.searchInput?.addEventListener('input', EzerUtils && EzerUtils.debounce ? EzerUtils.debounce(filterList, 300) : filterList);
        // Importação (RF021)
        const importTrigger = document.getElementById('btnImportarColaborador');
        if (importTrigger) importTrigger.addEventListener('click', openImportModal);
        document.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (!action || !id) return;
            if (action === 'view') return viewColaborador(id);
            if (action === 'edit') {
                const loader = window.EzerLoading ? EzerLoading.show(document.body) : { hide(){} };
                try { const c = await fetchById(id); await openForm(c); } catch (e) { try { showAlert('error', e.message || 'Erro ao carregar colaborador'); } catch {} } finally { try { loader.hide(); } catch {} }
                return;
            }
            if (action === 'delete') return deleteColaborador(id);
            if (action === 'toggle-status') {
                const nextStatus = btn.getAttribute('data-next-status');
                return toggleStatus(id, nextStatus);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            queryEls();
            attachEvents();
            try {
                if (!(window.auth && auth.user && (auth.user.role === 'consultoria' || auth.user.role === 'empresa'))) {
                    if (els.btnNovo) els.btnNovo.style.display = 'none';
                }
            } catch {}
            await Promise.all([
                loadColaboradores(),
                loadKpi()
            ]);
        } catch (e) {
            console.error('Falha ao inicializar colaboradores:', e);
        }
    });

    function openImportModal() {
        if (!window.showFormModal) { console.warn('showFormModal não disponível'); return; }
        const formHtml = `
            <div class="form-field">
                <label class="form-label" for="excelFile">Arquivo Excel</label>
                <input type="file" id="excelFile" name="excelFile" class="form-control" accept=".xlsx,.xls" required>
                <div class="form-help" style="margin-top: 6px;">
                    <a href="/templates/colaboradores_template.xlsx" class="link" id="downloadTemplate">Baixar modelo de planilha</a>
                </div>
            </div>
        `;
        showFormModal({
            title: 'Importar Colaboradores',
            formHtml,
            submitText: 'Importar',
            cancelText: 'Cancelar',
            size: 'md',
            onSubmit: async (formEl) => {
                const input = formEl.querySelector('#excelFile');
                const file = input?.files?.[0];
                if (!file) { try { showAlert('warning', 'Selecione um arquivo para importar'); } catch {} return false; }
    const formData = new FormData();
    formData.append('file', file);
                const container = document.querySelector('.modal-card') || document.body;
                const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/import`, { method: 'POST', body: formData });
                    const result = await resp.json();
                    if (!result.success) throw new Error(result.error || 'Erro na importação');
                    try { showAlert('success', result.message || 'Importação realizada com sucesso'); } catch {}
                    await loadColaboradores();
                    return true; // fecha modal
                } catch (error) {
                    console.error('Erro na importação:', error);
                    try { showAlert('error', error.message || 'Erro na importação'); } catch {}
                    return false; // mantém modal aberto
                } finally {
                    try { loader.hide(); } catch {}
                }
            }
        });
    }
})();


