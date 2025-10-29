const apiBase = window.API_CONFIG?.BASE_URL;

(function(){
    let ocorrenciasCache = [];
    const els = { tableBody: null, btnNova: null, searchInput: null, tipoFilter: null, periodoFilter: null, btnClear: null, empresaFilter: null, dataInicioFilter: null, dataFimFilter: null };

    function queryEls() {
        els.tableBody = document.querySelector('#ocorrenciasTable tbody');
        els.btnNova = document.getElementById('btnNovaOcorrencia');
        els.searchInput = document.getElementById('ocorrenciaSearch');
        els.tipoFilter = document.getElementById('tipoFilter');
        els.periodoFilter = document.getElementById('periodoFilter');
        els.btnClear = document.getElementById('btnClearFilters');
        els.empresaFilter = document.getElementById('empresaFilter');
        els.dataInicioFilter = document.getElementById('dataInicioFilter');
        els.dataFimFilter = document.getElementById('dataFimFilter');
    }

    function sanitize(value) { try { return (value || '').toString().trim(); } catch { return ''; } }
    function formatBytes(bytes) {
        try {
            const b = Number(bytes);
            if (!b || isNaN(b)) return '0 B';
            const u = ['B','KB','MB','GB','TB'];
            const i = Math.floor(Math.log(b)/Math.log(1024));
            const v = (b/Math.pow(1024,i)).toFixed(i === 0 ? 0 : 1);
            return `${v} ${u[i]}`;
        } catch { return '0 B'; }
    }
    function parseLocalDateFromYMD(ymd) {
        if (!ymd || typeof ymd !== 'string') return null;
        const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) { try { return new Date(ymd); } catch { return null; } }
        const year = parseInt(m[1]);
        const month = parseInt(m[2]) - 1;
        const day = parseInt(m[3]);
        return new Date(year, month, day);
    }
    function formatDateBRFromYMD(ymd) {
        const d = parseLocalDateFromYMD(ymd);
        if (!d || isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
    }

    // Mapeamento de subtipos por tipo
    const SUBTIPOS_BY_TIPO = {
        'Saúde Ocupacional': [
            'Exame Admissional', 'Demissional', 'Periódico', 'Consulta Médica', 'Acidente de Trabalho', 'Vacina', 'Atestado Médico', 'Outros'
        ],
        'Ausência': [
            'Falta/Ausência', 'Atraso', 'Advertência', 'Suspensão', 'Outros'
        ],
        'Carreira': [
            'Promoção', 'Falha/Erro', 'Ideia/Contribuição', 'Outros'
        ]
    };

    function buildSubtipoOptions(tipo, selected) {
        const itens = SUBTIPOS_BY_TIPO[tipo] || [];
        const safeSelected = sanitize(selected);
        const base = '<option value="">Selecione</option>';
        const opts = itens.map(it => `<option value="${it}" ${it === safeSelected ? 'selected' : ''}>${it}</option>`).join('');
        return base + opts;
    }

    async function loadOcorrencias() {
        const card = document.querySelector('#ocorrenciasTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            // Carregar empresas para filtro
            await populateEmpresasFilter();
            // Buscar ocorrências direto (endpoint agregado, baixa latência)
            let qs = [];
            const emp = document.getElementById('empresaFilter')?.value || '';
            const tipo = document.getElementById('tipoFilter')?.value || '';
            const per = document.getElementById('periodoFilter')?.value || '';
            const di = document.getElementById('dataInicioFilter')?.value || '';
            const df = document.getElementById('dataFimFilter')?.value || '';
            if (emp) qs.push(`empresa_id=${encodeURIComponent(emp)}`);
            if (tipo) qs.push(`tipo=${encodeURIComponent(tipo)}`);
            if (per) qs.push(`periodo=${encodeURIComponent(per)}`);
            if (di && df) {
                qs.push(`data_inicio=${encodeURIComponent(di)}`);
                qs.push(`data_fim=${encodeURIComponent(df)}`);
            }
            const qstring = qs.length ? `?${qs.join('&')}` : '';
            let url = `${apiBase}/ocorrencias${qstring}`;
            const resp = await auth.authenticatedRequest(url, { method: 'GET' });
            const json = await resp.json();
            if (!json.success) throw new Error(json.error || 'Falha ao listar ocorrências');
            ocorrenciasCache = (json.data || []).sort((a,b) => {
                const db = parseLocalDateFromYMD(b.data);
                const da = parseLocalDateFromYMD(a.data);
                return (db?.getTime?.() || 0) - (da?.getTime?.() || 0);
            });
            applyAllFilters();
        } catch (e) {
            console.error('Erro ao carregar ocorrências:', e);
            try { showAlert('error', e.message || 'Erro ao carregar ocorrências'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    async function populateEmpresasFilter() {
        const sel = document.getElementById('empresaFilter');
        if (!sel) return;
        await EzerRBAC.populateEmpresaSelect(sel, { includeEmpty: true });
    }

    function renderList(list) {
        if (!els.tableBody) return;
        els.tableBody.innerHTML = '';
        const items = list || [];
        if (!items.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="5" style="padding: 18px 8px;">
                    <div style="
                        display:flex; flex-direction:column; align-items:center; justify-content:center;
                        gap:8px; padding: 18px; border: 1px dashed var(--gray-300);
                        border-radius: 10px; background: rgba(0,0,0,0.015);
                    ">
                        <div style="
                            width: 44px; height: 44px; border-radius: 50%;
                            display:flex; align-items:center; justify-content:center;
                            background: rgba(0,0,0,0.05); color: var(--gray-700);
                        ">
                            <i class="bi bi-clipboard-x" style="font-size: 1.2rem;"></i>
                        </div>
                        <div style="font-weight: 600; color: var(--gray-800);">Nenhuma ocorrência encontrada</div>
                        <div style="font-size: .92rem; color: var(--gray-600); text-align:center;">
                            Ajuste os filtros.
                        </div>
                    </div>
                </td>
            `;
            els.tableBody.appendChild(tr);
            return;
        }
        items.forEach(renderRow);
    }

    function renderRow(o) {
        const tr = document.createElement('tr');
        const data = o.data ? formatDateBRFromYMD(o.data) : '';
        tr.innerHTML = `
            <td>${data}</td>
            <td>${sanitize(o.colaborador_nome)}</td>
            <td>${sanitize(o.tipo)}</td>
            <td>${sanitize(o.subtipo)}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${o.id_ocorrencia}"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${o.id_ocorrencia}"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon error" data-action="delete" data-id="${o.id_ocorrencia}"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        els.tableBody.appendChild(tr);
    }

    function applyAllFilters() {
        const q = sanitize(els.searchInput?.value || '').toLowerCase();
        const tipo = sanitize(els.tipoFilter?.value || '');
        const per = sanitize(els.periodoFilter?.value || '');
        const di = sanitize(els.dataInicioFilter?.value || '');
        const df = sanitize(els.dataFimFilter?.value || '');
        const emp = sanitize(els.empresaFilter?.value || '');
        let list = [...ocorrenciasCache];
        if (di && df) {
            const diD = parseLocalDateFromYMD(di);
            const dfD = parseLocalDateFromYMD(df);
            // incluir o fim do dia em df
            dfD.setHours(23,59,59,999);
            list = list.filter(o => {
                const d = o.data ? parseLocalDateFromYMD(o.data) : null;
                if (!d) return false;
                return d >= diD && d <= dfD;
            });
        }
        if (emp) list = list.filter(o => String(o.id_empresa || '') === emp);
        if (q && q.length >= 2) {
            list = list.filter(o => sanitize(o.colaborador_nome).toLowerCase().includes(q) || sanitize(o.tipo).toLowerCase().includes(q) || sanitize(o.subtipo).toLowerCase().includes(q));
        }
        if (tipo) list = list.filter(o => sanitize(o.tipo) === tipo);
        if (per) {
            const now = new Date();
            list = list.filter(o => {
                const d = o.data ? new Date(o.data) : null;
                if (!d) return false;
                if (per === 'hoje') {
                    const td = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const od = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    return od.getTime() === td.getTime();
                }
                if (per === 'semana') {
                    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
                    const end = new Date(start); end.setDate(start.getDate() + 7);
                    return d >= start && d < end;
                }
                if (per === 'mes') {
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    return d >= start && d < end;
                }
                if (per === 'ano') {
                    const start = new Date(now.getFullYear(), 0, 1);
                    const end = new Date(now.getFullYear() + 1, 0, 1);
                    return d >= start && d < end;
                }
                return true;
            });
        }
        renderList(list);
        try { renderKPI(list); } catch {}
    }

    const filterList = (ev) => applyAllFilters();

    function renderKPI(list) {
        if (!window.EzerKPI) return;
            const total = (list || []).length;
            const pos = list.filter(o => o.classificacao === 'Positivo').length;
            const neg = list.filter(o => o.classificacao === 'Negativo').length;
            const neu = list.filter(o => o.classificacao === 'Neutro').length;
        EzerKPI.render('#kpiOcorrencias', [
            { label: 'Total de Ocorrências', value: total, valueId: 'oc_total', icon: 'bi-clipboard-data', variant: 'primary' },
            { label: 'Positivas', value: pos, valueId: 'oc_pos', icon: 'bi-check-circle', variant: 'success' },
            { label: 'Negativas', value: neg, valueId: 'oc_neg', icon: 'bi-x-circle', variant: 'error' },
            { label: 'Neutras', value: neu, valueId: 'oc_neu', icon: 'bi-dash-circle', variant: 'warning' }
        ]);
    }

    async function fetchEmpresasAtivas() {
        try {
            const tmp = document.createElement('select');
            const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: false });
            if (Array.isArray(list) && list.length > 0) return list || [];
            // Fallback robusto para role empresa
            try {
                const role = (window.auth && auth.user && auth.user.role) || '';
                if (role === 'empresa') {
                    const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                    if (myId) {
                        try { const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method:'GET' }); const j = await r.json(); if (j.success && j.data) return [j.data]; } catch {}
                        return [{ id_empresa: myId, nome: 'Minha Empresa' }];
                    }
                }
            } catch {}
            return [];
        } catch { return []; }
    }

    async function fetchColaboradoresByEmpresa(idEmpresa) {
        if (!idEmpresa) return [];
        try {
            const r = await auth.authenticatedRequest(`${apiBase}/empresas/${idEmpresa}/colaboradores`, { method: 'GET' });
            const j = await r.json();
            return j.success ? (j.data || []) : [];
        } catch { return []; }
    }

    async function fetchColaboradorById(id) {
        try {
            const r = await auth.authenticatedRequest(`${apiBase}/colaboradores/${id}`, { method: 'GET' });
            const j = await r.json();
            return j.success ? (j.data || null) : null;
        } catch { return null; }
    }

    async function openOcorrenciaForm(oc) {
        const isEdit = !!(oc && oc.id_ocorrencia);
        // Spinner preguiçoso: só exibir se a abertura realmente demorar
        const hostContainer = document.querySelector('#ocorrenciasTable')?.closest('.card') || document.body;
        let __openTimer = null;
        let __openLoader = null;
        try { if (__openTimer) clearTimeout(__openTimer); } catch {}
        __openTimer = setTimeout(() => {
            try { __openLoader = window.EzerLoading ? EzerLoading.show(hostContainer) : null; } catch {}
        }, 200);
        const empresas = await fetchEmpresasAtivas();
        // Determinar empresa inicial
        let initialEmpresaId = null;
        if (isEdit && oc.id_colaborador) {
            const col = await fetchColaboradorById(oc.id_colaborador);
            if (col && col.id_empresa) initialEmpresaId = col.id_empresa;
        }
        if (!initialEmpresaId) {
            try {
                if (window.auth && auth.user && auth.user.role === 'empresa') {
                    initialEmpresaId = auth.user.id_empresa || null;
                }
            } catch {}
        }
        if (!initialEmpresaId && empresas.length) initialEmpresaId = empresas[0].id_empresa;

        const colaboradores = await fetchColaboradoresByEmpresa(initialEmpresaId);
        const formHtml = buildOcorrenciaFormHtml(oc || {}, empresas, colaboradores, initialEmpresaId);
        // Array de anexos pendentes (somente para criação)
        let pendingFiles = [];
        const modalRef = showFormModal({
            title: isEdit ? 'Editar Ocorrência' : 'Nova Ocorrência',
            formHtml,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            lockClose: !!isEdit,
            onSubmit: async (formEl, close) => {
                const fd = new FormData(formEl);
                // Remover arquivos do FormData base para evitar campos de arquivo inesperados/duplicados (ex.: 'anexos' antigo, e 'files')
                try { fd.delete('anexos'); } catch {}
                try { fd.delete('files'); } catch {}
                const payload = Object.fromEntries(fd.entries());
                const errors = [];
                function markInvalid(sel) { try { formEl.querySelector(sel)?.classList.add('is-invalid'); } catch {} }
                formEl.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
                // Validar
                // Empresa obrigatória se seletor estiver presente
                const empresaEl = formEl.querySelector('#id_empresa');
                if (empresaEl && !payload.id_empresa) { errors.push('Empresa'); markInvalid('#id_empresa'); }
                if (!payload.id_colaborador) { errors.push('Colaborador'); markInvalid('#id_colaborador'); }
                if (!payload.data) { errors.push('Data'); markInvalid('#data'); }
                if (!payload.classificacao) { errors.push('Classificação'); markInvalid('#classificacao'); }
                if (!payload.tipo) { errors.push('Tipo'); markInvalid('#tipo'); }
                if (payload.tipo && !sanitize(payload.subtipo)) { errors.push('Subtipo'); markInvalid('#subtipo'); }
                if (errors.length) { try { showAlert('warning', `Preencha: ${errors.join(', ')}`); } catch {}; return; }
                // Normalizar
                if (empresaEl) payload.id_empresa = Number(payload.id_empresa);
                payload.id_colaborador = Number(payload.id_colaborador);
                payload.subtipo = sanitize(payload.subtipo) || null;
                payload.observacoes = sanitize(payload.observacoes) || null;
                // Chamada (multipart para permitir upload na criação/edição)
                try {
                    const container = modalRef?.el?.querySelector('.modal-card') || document.body;
                    const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                    const url = isEdit ? `${apiBase}/ocorrencias/${oc.id_ocorrencia}` : `${apiBase}/ocorrencias`;
                    const method = isEdit ? 'PUT' : 'POST';
                    const formToSend = new FormData();
                    Object.entries(payload).forEach(([k,v]) => formToSend.append(k, v));
                    // anexos na criação/edição
                    try {
                        if (!isEdit) {
                            if (pendingFiles && pendingFiles.length) pendingFiles.forEach(f => formToSend.append('files', f));
                        } else {
                            const files = formEl.querySelector('#anexos')?.files || [];
                            if (files && files.length) Array.from(files).forEach(f => formToSend.append('files', f));
                        }
                    } catch {}
                    const r = await auth.authenticatedRequest(url, { method, body: formToSend });
                    const j = await r.json();
                    if (!j.success) throw new Error(j.error || 'Falha ao salvar ocorrência');
                    await loadOcorrencias();
                    close();
                    try { showAlert('success', isEdit ? 'Ocorrência atualizada' : 'Ocorrência criada'); } catch {}
                    try { loader.hide(); } catch {}
                } catch (e) {
                    console.error('Salvar ocorrência erro:', e);
                    try { showAlert('error', e.message || 'Erro ao salvar ocorrência'); } catch {}
                }
            }
        });
        // Ajustar lista de subtipos conforme o tipo selecionado
        try {
            const root = modalRef?.el || document;
            // Parar loader assim que o modal estiver montado
            try { if (__openTimer) clearTimeout(__openTimer); } catch {}
            __openTimer = null;
            try { __openLoader && __openLoader.hide && __openLoader.hide(); } catch {}
            __openLoader = null;
            // Empresa -> Colaboradores
            const empresaSel = root.querySelector('#id_empresa');
            const colabSel = root.querySelector('#id_colaborador');
            if (empresaSel && colabSel) {
                empresaSel.addEventListener('change', async function() {
                    const idEmp = this.value ? Number(this.value) : null;
                    const target = colabSel;
                    const fieldContainer = target.closest('.form-field') || target.parentElement || document.body;
                    const loader = window.EzerLoading ? EzerLoading.show(fieldContainer) : { hide(){} };
                    const list = await fetchColaboradoresByEmpresa(idEmp);
                    const opts = ['<option value="">Selecione</option>'].concat(
                        (list || []).map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`)
                    ).join('');
                    target.innerHTML = opts;
                    try { loader.hide(); } catch {}
                });
            }
            const tipoSel = root.querySelector('#tipo');
            const subSel = root.querySelector('#subtipo');
            const applySubtipos = () => {
                const currentTipo = tipoSel?.value || '';
                const selectedSub = oc?.subtipo || '';
                if (subSel) subSel.innerHTML = buildSubtipoOptions(currentTipo, selectedSub);
            };
            applySubtipos();
            if (tipoSel) {
                tipoSel.addEventListener('change', () => {
                    if (oc) oc.subtipo = '';
                    applySubtipos();
                });
            }
            if (isEdit) {
                const formNode = root.querySelector('#__formModal');
                const hintEl = root.querySelector('#editDirtyHint');
                function takeSnapshot(formEl) {
                    const data = new FormData(formEl);
                    try { data.delete('files'); } catch {}
                    try { data.delete('anexos'); } catch {}
                    const obj = {};
                    for (const [k,v] of data.entries()) { obj[k] = (v || '').toString(); }
                    return JSON.stringify(obj);
                }
                const baseline = takeSnapshot(formNode);
                function refreshHint() {
                    const current = takeSnapshot(formNode);
                    const changed = current !== baseline;
                    if (hintEl) hintEl.style.display = changed ? 'flex' : 'none';
                }
                formNode.addEventListener('input', refreshHint, true);
                formNode.addEventListener('change', refreshHint, true);
            }
            // Anexos (upload/listagem/remoção)
            const anexosInput = root.querySelector('#anexos');
            const anexosList = root.querySelector('#anexosList');
            const anexosDrop = root.querySelector('#anexosDrop');
            const ocId = oc?.id_ocorrencia;
            const refreshAttachments = async () => {
                if (!ocId || !anexosList) return;
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/ocorrencias/${ocId}/attachments`, { method: 'GET' });
                    const j = await r.json();
                    if (!j.success) return;
                    const items = (j.data || []).map(f => {
                        const fileName = sanitize((f.name || '').split('/').pop());
                        const sizeText = typeof f.size !== 'undefined' ? formatBytes(f.size) : '';
                        return `
                            <div class="list-item" style="
                                display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; 
                                border:1px solid rgba(0,0,0,0.06); border-radius:8px; background:#fff; margin-bottom:8px;
                            ">
                                <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                                    <div style="width:32px; height:32px; border-radius:6px; background:rgba(0,0,0,0.04); display:flex; align-items:center; justify-content:center; flex:0 0 auto;">
                                        <i class="bi bi-file-earmark" style="font-size:1rem; color: var(--gray-700);"></i>
                                    </div>
                                    <div style="display:flex; flex-direction:column; overflow:hidden;">
                                        <span style="font-weight:600; color: var(--gray-800); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${fileName}</span>
                                        <span style="font-size:.85rem; color: var(--gray-600);">${sizeText}</span>
                                    </div>
                                </div>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn-icon error" data-action="del-attach" data-blob="${f.name}"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    anexosList.innerHTML = items || '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo.</div>';
                } catch {}
            };
            if (isEdit && ocId) { try { await refreshAttachments(); } catch {} }
            // Exclusão de anexo em modo edição (remover do Azure)
            anexosList?.addEventListener('click', async (ev) => {
                const delServerBtn = ev.target.closest('button[data-action="del-attach"]');
                if (delServerBtn && ocId) {
                    const blob = delServerBtn.getAttribute('data-blob');
                    if (!blob) return;
                    const ok = await (window.showDeleteConfirm ? showDeleteConfirm('ocorrencia', { title: 'Excluir anexo', message: 'Remover este arquivo?' }) : Promise.resolve(confirm('Remover este arquivo?')));
                    if (!ok) return;
                    const loader = window.EzerLoading ? EzerLoading.show(anexosList) : { hide(){} };
                    try {
                        const r = await auth.authenticatedRequest(`${apiBase}/ocorrencias/${ocId}/attachments/${encodeURIComponent(blob)}`, { method: 'DELETE' });
                        const j = await r.json();
                        if (j.success) { await refreshAttachments(); }
                    } finally { try { loader.hide(); } catch {} }
                    return;
                }
                // Exclusão local em modo criação (remover da lista pendente)
                const delLocalBtn = ev.target.closest('button[data-action="del-local-attach"]');
                if (delLocalBtn && !isEdit) {
                    const idx = Number(delLocalBtn.getAttribute('data-index'));
                    if (!Number.isNaN(idx)) {
                        pendingFiles.splice(idx, 1);
                        renderPending();
                    }
                    return;
                }
            });
            // UX: Clique/Drop para selecionar
            if (anexosDrop && anexosInput) {
                anexosDrop.addEventListener('click', () => anexosInput.click());
                ;['dragenter','dragover'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.04)'; anexosDrop.style.borderColor = 'var(--gray-400)'; }, false));
                ;['dragleave','drop'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.02)'; anexosDrop.style.borderColor = 'var(--gray-300)'; }, false));
                anexosDrop.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    const files = Array.from(dt?.files || []);
                    if (!files.length) return;
                    if (isEdit && ocId) {
                        uploadImmediate(files);
                    } else {
                        pendingFiles = pendingFiles.concat(files);
                        renderPending();
                    }
                });
            }

            async function uploadImmediate(files) {
                const formData = new FormData();
                files.forEach(f => formData.append('files', f));
                const loader = window.EzerLoading ? EzerLoading.show(anexosList || document.body) : { hide(){} };
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/ocorrencias/${ocId}/attachments`, { method: 'POST', body: formData });
                    const j = await r.json();
                    if (j.success) { await refreshAttachments(); }
                } finally { try { loader.hide(); } catch {} }
            }

            // Handler de seleção de arquivos
            anexosInput?.addEventListener('change', async (ev) => {
                const files = Array.from(ev.target.files || []);
                if (!files.length) return;
                if (isEdit && ocId) {
                    await uploadImmediate(files);
                } else {
                    // criação: acumular localmente e permitir remoção antes do salvar
                    pendingFiles = pendingFiles.concat(files);
                    // limpar input para permitir mesmo arquivo novamente
                    try { anexosInput.value = ''; } catch {}
                    renderPending();
                }
            });
            function renderPending() {
                if (!anexosList) return;
                if (!pendingFiles || !pendingFiles.length) {
                    anexosList.innerHTML = '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo selecionado.</div>';
                    return;
                }
                const items = pendingFiles.map((f, i) => `
                    <div class="list-item" style="
                        display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; 
                        border:1px solid rgba(0,0,0,0.06); border-radius:8px; background:#fff; margin-bottom:8px;
                    ">
                        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                            <div style="width:32px; height:32px; border-radius:6px; background:rgba(0,0,0,0.04); display:flex; align-items:center; justify-content:center; flex:0 0 auto;">
                                <i class="bi bi-file-earmark" style="font-size:1rem; color: var(--gray-700);"></i>
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <span style="font-weight:600; color: var(--gray-800); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">
                                    ${sanitize(f.name)}
                                </span>
                                <span style="font-size:.85rem; color: var(--gray-600);">${formatBytes(f.size)}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-secondary btn-sm" type="button" onclick="(function(){var a=document.createElement('a');a.href=URL.createObjectURL(arguments[0]);a.download='${sanitize('preview_'+Date.now())}';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);})((arguments[0]))" data-blob-index="${i}" style="display:none;"></button>
                            <button class="btn-icon error" data-action="del-local-attach" data-index="${i}"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                `).join('');
                anexosList.innerHTML = items;
            }
        } catch {
            // Garantir que o loader pare mesmo em erro
            try { if (__openTimer) clearTimeout(__openTimer); } catch {}
            __openTimer = null;
            try { __openLoader && __openLoader.hide && __openLoader.hide(); } catch {}
            __openLoader = null;
        }
        return modalRef;
    }

    function buildOcorrenciaFormHtml(oc, empresas, colaboradores, selectedEmpresaId) {
        const empresasOptions = (empresas || []).map(e => `<option value="${e.id_empresa}" ${selectedEmpresaId === e.id_empresa ? 'selected' : ''}>${sanitize(e.nome)}</option>`).join('');
        const colabsOptions = (colaboradores || []).map(c => `<option value="${c.id_colaborador}" ${oc.id_colaborador === c.id_colaborador ? 'selected' : ''}>${sanitize(c.nome)}</option>`).join('');
        const dataVal = oc.data ? new Date(oc.data).toISOString().slice(0,10) : '';
        const today = new Date().toISOString().slice(0,10);
        const hint = oc && oc.id_ocorrencia ? `
            <div id="editDirtyHint" style="
                display:none; align-items:center; gap:8px; margin-bottom: 8px;
                font-size:.9rem; color: var(--gray-700);
                background: rgba(0,0,0,0.03); border: 1px dashed var(--gray-300);
                border-radius: 8px; padding: 8px 10px; grid-column: 1 / -1; width: 100%;
            ">
                <i class="bi bi-info-circle" aria-hidden="true"></i>
                <span>Você tem alterações não salvas. Use <strong>Salvar</strong> para aplicar ou <strong>Cancelar</strong> para descartar.</span>
            </div>
        ` : '';
        return `
            <div class="form-grid">
                ${hint}
                <div class="form-field">
                    <label class="form-label" for="id_empresa">Empresa *</label>
                    <select class="form-select form-control" id="id_empresa" name="id_empresa">
                        <option value="">Selecione</option>
                        ${empresasOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="id_colaborador">Colaborador *</label>
                    <select class="form-select form-control" id="id_colaborador" name="id_colaborador" required>
                        <option value="">Selecione</option>
                        ${colabsOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="data">Data *</label>
                    <input class="form-control" type="date" id="data" name="data" required value="${dataVal}" max="${today}">
                </div>
                <div class="form-field">
                    <label class="form-label" for="classificacao">Classificação *</label>
                    <select class="form-select form-control" id="classificacao" name="classificacao" required>
                        <option value="">Selecione</option>
                        <option value="Positivo" ${oc.classificacao==='Positivo'?'selected':''}>Positivo</option>
                        <option value="Negativo" ${oc.classificacao==='Negativo'?'selected':''}>Negativo</option>
                        <option value="Neutro" ${oc.classificacao==='Neutro'?'selected':''}>Neutro</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="tipo">Tipo *</nlabel>
                    <select class="form-select form-control" id="tipo" name="tipo" required>
                        <option value="">Selecione</option>
                        <option value="Saúde Ocupacional" ${oc.tipo==='Saúde Ocupacional'?'selected':''}>Saúde Ocupacional</option>
                        <option value="Ausência" ${oc.tipo==='Ausência'?'selected':''}>Ausência</option>
                        <option value="Carreira" ${oc.tipo==='Carreira'?'selected':''}>Carreira</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="subtipo">Subtipo</label>
                    <select class="form-select form-control" id="subtipo" name="subtipo">
                        ${buildSubtipoOptions(oc.tipo, oc.subtipo)}
                    </select>
                </div>
                <div class="form-field span-2">
                    <label class="form-label" for="observacoes">Observações</label>
                    <textarea class="form-control" id="observacoes" name="observacoes" rows="4" placeholder="Descreva a ocorrência">${sanitize(oc.observacoes)}</textarea>
                </div>
                <div class="form-field span-2">
                    <label class="form-label" for="anexos">Anexos</label>
                    <input class="form-control" id="anexos" name="files" type="file" multiple style="position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;">
                    <div id="anexosDrop" style="
                        display:flex; align-items:center; justify-content:center; text-align:center;
                        gap:10px; padding:14px; border: 2px dashed var(--gray-300);
                        border-radius: 10px; background: rgba(0,0,0,0.02); cursor: pointer;
                        transition: background .15s ease, border-color .15s ease;
                    ">
                        <div style="
                            width: 40px; height: 40px; border-radius: 50%;
                            background: rgba(0,0,0,0.05); color: var(--gray-700);
                            display:flex; align-items:center; justify-content:center; flex: 0 0 auto;
                        "><i class="bi bi-paperclip" style="font-size:1.1rem;"></i></div>
                        <div style="display:flex; flex-direction:column; align-items:flex-start; gap:4px;">
                            <div style="font-weight:600; color: var(--gray-800);">Arraste e solte os arquivos aqui</div>
                            <div style="font-size:.9rem; color: var(--gray-600);">ou clique para selecionar</div>
                        </div>
                    </div>
                    <div id="anexosList" class="list" style="margin-top:10px;"></div>
                </div>
            </div>
        `;
    }

    async function viewOcorrencia(id) {
        try {
            const container = document.body;
            const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
            const oc = ocorrenciasCache.find(x => x.id_ocorrencia == id);
            if (!oc) { try { loader.hide(); } catch {}; return; }
            // Buscar anexos da ocorrência
            let anexos = [];
            try {
                const r = await auth.authenticatedRequest(`${apiBase}/ocorrencias/${id}/attachments`, { method: 'GET' });
                const j = await r.json();
                anexos = j && j.success ? (j.data || []) : [];
            } catch {}

            const anexosHtml = (anexos && anexos.length)
                ? anexos.map(f => {
                    const fileName = sanitize(((f.name || '').split('/').pop()) || 'arquivo');
                    const blobName = sanitize(f.name || '');
                    return `
                        <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                            <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fileName}">${fileName}</div>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-secondary btn-sm" data-action="open-attach" data-id="${id}" data-blob="${blobName}">Abrir</button>
                                <button class="btn btn-secondary btn-sm" data-action="download-attach" data-id="${id}" data-blob="${blobName}">Baixar</button>
                            </div>
                        </div>
                    `;
                }).join('')
                : '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo.</div>';

            const html = `
                <div class="details-grid">
                    <div class="details-item"><div class="details-label">Colaborador</div><div class="details-value">${sanitize(oc.colaborador_nome)}</div></div>
                    <div class="details-item"><div class="details-label">Data</div><div class="details-value">${oc.data ? formatDateBRFromYMD(oc.data) : '-'}</div></div>
                    <div class="details-item"><div class="details-label">Classificação</div><div class="details-value">${sanitize(oc.classificacao)}</div></div>
                    <div class="details-item"><div class="details-label">Tipo</div><div class="details-value">${sanitize(oc.tipo)}</div></div>
                    <div class="details-item"><div class="details-label">Subtipo</div><div class="details-value">${sanitize(oc.subtipo)}</div></div>
                    <div class="details-item span-2"><div class="details-label">Observações</div><div class="details-value">${sanitize(oc.observacoes)}</div></div>
                    <div class="details-item span-2">
                        <div class="details-label">Anexos</div>
                        <div class="details-value"><div class="list">${anexosHtml}</div></div>
                    </div>
                </div>
            `;
            showInfoModal({ title: 'Detalhes da Ocorrência', html, closeText: 'Fechar', size: 'lg' });
            try { loader.hide(); } catch {}
        } catch (e) {
            try { showAlert('error', e.message || 'Erro ao exibir detalhes'); } catch {}
        }
    }

async function deleteOcorrencia(id) {
    try {
            const ok = await (window.showDeleteConfirm ? showDeleteConfirm('ocorrencia') : (window.showConfirm ? showConfirm({ title: 'Excluir ocorrência', message: 'Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.', confirmText: 'Excluir', cancelText: 'Cancelar' }) : Promise.resolve(confirm('Tem certeza que deseja excluir esta ocorrência?'))));
        if (!ok) return;
    } catch {}
    try {
        const card = document.querySelector('#ocorrenciasTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
        const resp = await auth.authenticatedRequest(`${apiBase}/ocorrencias/${id}`, { method: 'DELETE' });
        const response = await resp.json();
        if (response.success) {
                const tableContainer = document.querySelector('#ocorrenciasTable')?.closest('.card-body') || document.body;
                const innerLoader = window.EzerLoading ? EzerLoading.show(tableContainer) : { hide(){} };
                await loadOcorrencias();
                try { innerLoader.hide(); } catch {}
                try { showAlert('success', 'Ocorrência excluída com sucesso'); } catch {}
            } else {
                try { showAlert('error', response.error || 'Erro ao excluir ocorrência'); } catch {}
            }
            try { loader.hide(); } catch {}
        } catch (error) {
            console.error('Erro ao excluir ocorrência:', error);
            try { showAlert('error', 'Erro ao excluir ocorrência'); } catch {}
        }
    }

    function attachEvents() {
        els.btnNova?.addEventListener('click', () => openOcorrenciaForm());
        els.searchInput?.addEventListener('input', EzerUtils && EzerUtils.debounce ? EzerUtils.debounce(filterList, 300) : filterList);
        els.tipoFilter?.addEventListener('change', loadOcorrencias);
        els.periodoFilter?.addEventListener('change', loadOcorrencias);
        els.empresaFilter?.addEventListener('change', loadOcorrencias);
        els.dataInicioFilter?.addEventListener('change', loadOcorrencias);
        els.dataFimFilter?.addEventListener('change', loadOcorrencias);
        els.btnClear?.addEventListener('click', (e) => { try { e.preventDefault(); } catch {} if (els.tipoFilter) els.tipoFilter.value=''; if (els.periodoFilter) els.periodoFilter.value=''; if (els.searchInput) els.searchInput.value=''; applyAllFilters(); });
        document.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (!action || !id) return;
            
            if (action === 'view') return viewOcorrencia(id);
            if (action === 'edit') {
                const oc = ocorrenciasCache.find(x => x.id_ocorrencia == id);
                if (!oc) return;
                await openOcorrenciaForm(oc);
                return;
            }
            if (action === 'delete') return deleteOcorrencia(id);
            if (action === 'open-attach') {
                const blob = btn.getAttribute('data-blob');
                if (!blob) return;
                try {
                    await openAttachment(id, blob);
                } catch (e) { try { showAlert('error', e.message || 'Falha ao abrir anexo'); } catch {} }
                return;
            }
            if (action === 'download-attach') {
                const blob = btn.getAttribute('data-blob');
                if (!blob) return;
                try {
                    await downloadAttachment(id, blob);
                } catch (e) { try { showAlert('error', e.message || 'Falha ao baixar anexo'); } catch {} }
                return;
            }
        });
    }

    async function fetchAttachmentBlob(ocId, blobName, disposition) {
        const url = `${apiBase}/ocorrencias/${ocId}/attachments/${encodeURIComponent(blobName)}/content?disposition=${encodeURIComponent(disposition || 'inline')}`;
        const resp = await auth.authenticatedRequest(url, { method: 'GET' });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(txt || 'Erro ao obter anexo');
        }
        const dataBlob = await resp.blob();
        return dataBlob;
    }

    async function openAttachment(ocId, blobName) {
        const blob = await fetchAttachmentBlob(ocId, blobName, 'inline');
        const objectUrl = URL.createObjectURL(blob);
        try {
            window.open(objectUrl, '_blank', 'noopener');
        } finally {
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
        }
    }

    async function downloadAttachment(ocId, blobName) {
        const blob = await fetchAttachmentBlob(ocId, blobName, 'attachment');
        const dl = document.createElement('a');
        const filename = (blobName || '').split('/').pop() || 'arquivo';
        const objectUrl = URL.createObjectURL(blob);
        dl.href = objectUrl;
        dl.download = filename;
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
    }

    document.addEventListener('DOMContentLoaded', async function() {
        try {
            queryEls();
            attachEvents();
            await loadOcorrencias();
        } catch (e) {
            console.error('Falha ao inicializar ocorrências:', e);
        }
    });

    window.loadOcorrencias = loadOcorrencias;
})();
