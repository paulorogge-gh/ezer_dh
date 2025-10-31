const apiBase = window.API_CONFIG?.BASE_URL;

(function(){
    let cache = [];
    const els = { tableBody: null, btnNovo: null, searchInput: null, empresaFilter: null, dataInicioFilter: null, dataFimFilter: null, classificacaoFilter: null };
    const colaboradorNameCache = new Map();

    function q(sel){ return document.querySelector(sel); }
    function sanitize(v){ try { return (v||'').toString().trim(); } catch { return ''; } }
    function parseYMD(ymd){ const m = (ymd||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return null; return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3])); }
    function fmtBR(ymd){ const d = parseYMD(ymd); return d? d.toLocaleDateString('pt-BR') : ''; }

    function queryEls(){
        els.tableBody = q('#feedbacksTable tbody');
        els.btnNovo = q('#btnNovoFeedback');
        els.searchInput = q('#fbSearch');
        els.empresaFilter = q('#fbEmpresaFilter');
        els.dataInicioFilter = q('#fbDataInicioFilter');
        els.dataFimFilter = q('#fbDataFimFilter');
        els.classificacaoFilter = q('#fbClassificacaoFilter');
    }

    async function populateEmpresas(){
        const sel = els.empresaFilter; if (!sel) return;
        await EzerRBAC.populateEmpresaSelect(sel, { includeEmpty: true });
    }

    async function load(){
        const card = q('#feedbacksTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        try {
            await populateEmpresas();
            const qs = [];
            const emp = els.empresaFilter?.value || '';
            const di = els.dataInicioFilter?.value || '';
            const df = els.dataFimFilter?.value || '';
            const qtext = els.searchInput?.value || '';
            const cla = els.classificacaoFilter?.value || '';
            if (emp) qs.push(`empresa_id=${encodeURIComponent(emp)}`);
            if (di && df) { qs.push(`data_inicio=${encodeURIComponent(di)}`); qs.push(`data_fim=${encodeURIComponent(df)}`); }
            if (qtext && qtext.trim().length >= 2) qs.push(`q=${encodeURIComponent(qtext.trim())}`);
            if (cla) qs.push(`classificacao=${encodeURIComponent(cla)}`);
            const url = `${apiBase}/feedbacks${qs.length?`?${qs.join('&')}`:''}`;
            const resp = await auth.authenticatedRequest(url, { method: 'GET' });
            const json = await resp.json();
            if (!json.success) throw new Error(json.error||'Falha ao listar feedbacks');
            cache = (json.data||[]).sort((a,b)=> (parseYMD(b.data)?.getTime?.()||0)-(parseYMD(a.data)?.getTime?.()||0));
            renderList(cache);
            renderKPI(cache);
        } catch (e) {
            console.error('load feedbacks:', e);
            try { showAlert('error', e.message||'Erro ao carregar feedbacks'); } catch {}
        } finally { try { loader.hide(); } catch {} }
    }

    function renderList(list){
        if (!els.tableBody) return; els.tableBody.innerHTML = '';
        const items = list||[];
        if (!items.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="5" style="padding: 18px 8px;"><div style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:18px; border:1px dashed var(--gray-300); border-radius:10px; background:rgba(0,0,0,0.015);"><div style="width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.05); color: var(--gray-700);"><i class="bi bi-clipboard-x" style="font-size:1.2rem;"></i></div><div style="font-weight:600; color:var(--gray-800);">Nenhum feedback encontrado</div><div style="font-size:.92rem; color:var(--gray-600); text-align:center;">Ajuste os filtros.</div></div></td>`;
            els.tableBody.appendChild(tr); return;
        }
        items.forEach(renderRow);
    }

    function renderKPI(list){
        if (!window.EzerKPI) return;
        const total = (list||[]).length;
        const pos = list.filter(f => f.classificacao==='Positivo').length;
        const pm = list.filter(f => f.classificacao==='Para Melhorar').length;
        const neu = list.filter(f => f.classificacao==='Neutro').length;
        EzerKPI.render('#kpiFeedbacks', [
            { label: 'Total de Feedbacks', value: total, valueId: 'fb_total', icon:'bi-chat-dots', variant:'primary' },
            { label: 'Positivos', value: pos, valueId: 'fb_pos', icon:'bi-hand-thumbs-up', variant:'success' },
            { label: 'Para Melhorar', value: pm, valueId: 'fb_pm', icon:'bi-exclamation-circle', variant:'warning' },
            { label: 'Neutros', value: neu, valueId: 'fb_neu', icon:'bi-dash-circle', variant:'secondary' }
        ]);
    }

    function renderRow(f){
        const tr = document.createElement('tr');
        const data = f.data ? fmtBR(f.data) : '';
        const avaliadoNomeNow = sanitize(f.avaliado_nome);
        tr.innerHTML = `
            <td>${data}</td>
            <td>${sanitize(f.avaliador_nome)}</td>
            <td>${avaliadoNomeNow || '...'}</td>
            <td>${sanitize(f.classificacao)}</td>
            <td>
                <div class="btn-group" role="group" aria-label="Ações">
                    <button class="btn btn-secondary btn-sm" data-action="view" data-id="${f.id_feedback}"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${f.id_feedback}"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon error" data-action="delete" data-id="${f.id_feedback}"><i class="bi bi-trash"></i></button>
                </div>
            </td>`;
        els.tableBody.appendChild(tr);
        // Resolver nome do avaliado, se vier vazio
        if (!avaliadoNomeNow && f.id_avaliado) {
            resolveColaboradorNome(f.id_avaliado).then((name) => {
                try {
                    const td = tr.children[2];
                    if (td && name) td.textContent = sanitize(name);
                } catch {}
            }).catch(()=>{});
        }
    }

    async function fetchColaboradoresByEmpresa(idEmpresa){
        if (!idEmpresa) return [];
        try { const r = await auth.authenticatedRequest(`${apiBase}/empresas/${idEmpresa}/colaboradores`, { method: 'GET' }); const j = await r.json(); return j.success ? (j.data||[]) : []; } catch { return []; }
    }

    function buildFormHtml(item, empresas, colaboradores, selectedEmpresaId){
        const dataVal = item?.data ? new Date(item.data).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
        const empresasOptions = (empresas||[]).map(e => `<option value="${e.id_empresa}" ${selectedEmpresaId===e.id_empresa?'selected':''}>${sanitize(e.nome)}</option>`).join('');
        const colabsOptions = (colaboradores||[]).map(c => `<option value="${c.id_colaborador}" ${item?.id_avaliado===c.id_colaborador?'selected':''}>${sanitize(c.nome)}</option>`).join('');
        return `
            <div class="form-grid">
                <div class="form-field">
                    <label class="form-label" for="id_empresa">Empresa *</label>
                    <select class="form-select form-control" id="id_empresa" name="id_empresa">
                        <option value="">Selecione</option>
                        ${empresasOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="id_avaliado">Avaliado *</label>
                    <select class="form-select form-control" id="id_avaliado" name="id_avaliado" required>
                        <option value="">Selecione</option>
                        ${colabsOptions}
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="data">Data *</label>
                    <input class="form-control" type="date" id="data" name="data" required value="${dataVal}" max="${new Date().toISOString().slice(0,10)}">
                </div>
                <div class="form-field">
                    <label class="form-label" for="classificacao">Classificação *</label>
                    <select class="form-select form-control" id="classificacao" name="classificacao" required>
                        <option value="">Selecione</option>
                        <option value="Positivo" ${item?.classificacao==='Positivo'?'selected':''}>Positivo</option>
                        <option value="Para Melhorar" ${item?.classificacao==='Para Melhorar'?'selected':''}>Para Melhorar</option>
                        <option value="Neutro" ${item?.classificacao==='Neutro'?'selected':''}>Neutro</option>
                    </select>
                </div>
                
                <div class="form-field span-2">
                    <label class="form-label" for="observacoes">Observações</label>
                    <textarea class="form-control" id="observacoes" name="observacoes" rows="4" placeholder="Descreva o feedback">${sanitize(item?.observacoes)}</textarea>
                </div>
            </div>`;
    }

    async function openForm(item){
        const isEdit = !!(item && item.id_feedback);
        // Loader preguiçoso
        const host = document.querySelector('#feedbacksTable')?.closest('.card') || document.body;
        let preLoaderRef = null;
        let timer = setTimeout(()=>{ try { if (window.EzerLoading) preLoaderRef = EzerLoading.show(host); } catch {} }, 200);
        let empresas = [];
        try {
            const tmp = document.createElement('select');
            const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: false });
            empresas = list || [];
            if ((!empresas || !empresas.length) && auth?.user?.role === 'empresa') {
                const myId = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                if (myId) {
                    try { const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myId}`, { method:'GET' }); const j = await r.json(); if (j.success && j.data) empresas = [j.data]; else empresas = [{ id_empresa: myId, nome: 'Minha Empresa' }]; } catch { empresas = [{ id_empresa: myId, nome: 'Minha Empresa' }]; }
                }
            }
        } catch {}
        let initialEmpresaId = null;
        try { if (auth && auth.user && auth.user.role==='empresa') initialEmpresaId = auth.user.id_empresa || null; } catch {}
        if (!initialEmpresaId && empresas.length) initialEmpresaId = empresas[0].id_empresa;
        if (isEdit && item?.id_avaliado) {
            // empresa do avaliado
            // não temos empresa no item diretamente, mas podemos inferir carregando o colaborador
            try { const r = await auth.authenticatedRequest(`${apiBase}/colaboradores/${item.id_avaliado}`, { method:'GET' }); const j = await r.json(); if (j.success && j.data?.id_empresa) initialEmpresaId = j.data.id_empresa; } catch {}
        }
        const colaboradores = await fetchColaboradoresByEmpresa(initialEmpresaId);
        const html = buildFormHtml(item||{}, empresas, colaboradores, initialEmpresaId);
        const modalRef = showFormModal({
            title: isEdit ? 'Editar Feedback' : 'Novo Feedback',
            formHtml: html,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            lockClose: !!isEdit,
            onSubmit: async (formEl, close) => {
                const fd = new FormData(formEl);
                const payload = Object.fromEntries(fd.entries());
                const errs = [];
                function invalid(sel){ try { formEl.querySelector(sel)?.classList.add('is-invalid'); } catch {} }
                formEl.querySelectorAll('.is-invalid').forEach(e=>e.classList.remove('is-invalid'));
                if (!payload.id_empresa) { errs.push('Empresa'); invalid('#id_empresa'); }
                if (!payload.id_avaliado) { errs.push('Avaliado'); invalid('#id_avaliado'); }
                if (!payload.data) { errs.push('Data'); invalid('#data'); }
                if (!payload.classificacao) { errs.push('Classificação'); invalid('#classificacao'); }
                
                if (errs.length) { try { showAlert('warning', `Preencha: ${errs.join(', ')}`); } catch {}; return; }
                // normalizar
                payload.id_empresa = Number(payload.id_empresa);
                payload.id_avaliado = Number(payload.id_avaliado);
                payload.observacoes = sanitize(payload.observacoes) || null;
                let loader = { hide(){} };
                try {
                    const container = modalRef?.el?.querySelector('.modal-card') || document.body;
                    loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                    const url = isEdit ? `${apiBase}/feedbacks/${item.id_feedback}` : `${apiBase}/feedbacks`;
                    const method = isEdit ? 'PUT' : 'POST';
                    const resp = await auth.authenticatedRequest(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const j = await resp.json();
                    if (!j.success) throw new Error(j.error||'Falha ao salvar feedback');
                    await load();
                    close();
                    try { showAlert('success', isEdit ? 'Feedback atualizado' : 'Feedback criado'); } catch {}
                } catch(e) {
                    console.error('save feedback:', e);
                    try { showAlert('error', e.message||'Erro ao salvar feedback'); } catch {}
                } finally {
                    try { loader.hide(); } catch {}
                }
            }
        });
        try {
            const root = modalRef?.el || document;
            // parar spinner
            try { clearTimeout(timer); } catch {}
            try { preLoaderRef && preLoaderRef.hide && preLoaderRef.hide(); } catch {}
            const empSel = root.querySelector('#id_empresa');
            const avSel = root.querySelector('#id_avaliado');
            empSel?.addEventListener('change', async function(){
                const idEmp = this.value ? Number(this.value) : null;
                const cont = avSel.closest('.form-field') || avSel.parentElement || document.body;
                const l = window.EzerLoading ? EzerLoading.show(cont) : { hide(){} };
                const list = await fetchColaboradoresByEmpresa(idEmp);
                avSel.innerHTML = ['<option value="">Selecione</option>'].concat((list||[]).map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`)).join('');
                try { l.hide(); } catch {}
            });
        } catch {}
        return modalRef;
    }

    async function viewItem(id){
        try {
            const cont = document.body; const l = window.EzerLoading ? EzerLoading.show(cont) : { hide(){} };
            const resp = await auth.authenticatedRequest(`${apiBase}/feedbacks/${id}`, { method:'GET' }); const j = await resp.json(); if (!j.success) throw new Error(j.error||'Falha ao carregar');
            const f = j.data;
                const html = `
                <div class="details-grid">
                    <div class="details-item"><div class="details-label">Avaliador</div><div class="details-value">${sanitize(f.avaliador_nome)}</div></div>
                    <div class="details-item"><div class="details-label">Avaliado</div><div class="details-value" id="detailAvaliadoNome">${sanitize(f.avaliado_nome) || '...'}</div></div>
                    <div class="details-item"><div class="details-label">Data</div><div class="details-value">${fmtBR(f.data)}</div></div>
                    <div class="details-item"><div class="details-label">Classificação</div><div class="details-value">${sanitize(f.classificacao)}</div></div>
                    <div class="details-item span-2"><div class="details-label">Observações</div><div class="details-value">${sanitize(f.observacoes)}</div></div>
                </div>`;
            showInfoModal({ title:'Detalhes do Feedback', html, closeText:'Fechar', size:'lg' });
            // Resolver nome do avaliado, se vier vazio
            if (!sanitize(f.avaliado_nome) && f.id_avaliado) {
                resolveColaboradorNome(f.id_avaliado).then((name) => {
                    try {
                        const el = document.getElementById('detailAvaliadoNome');
                        if (el && name) el.textContent = sanitize(name);
                    } catch {}
                }).catch(()=>{});
            }
            try { l.hide(); } catch {}
        } catch(e) { try { showAlert('error', e.message||'Erro ao exibir'); } catch {} }
    }

    async function resolveColaboradorNome(idColaborador){
        try {
            const key = Number(idColaborador);
            if (colaboradorNameCache.has(key)) return colaboradorNameCache.get(key);
            const resp = await auth.authenticatedRequest(`${apiBase}/colaboradores/${key}`, { method:'GET' });
            const j = await resp.json();
            const name = j && j.success && j.data ? j.data.nome : null;
            if (name) colaboradorNameCache.set(key, name);
            return name;
        } catch { return null; }
    }

    async function deleteItem(id){
        try {
            const ok = await (window.showDeleteConfirm ? showDeleteConfirm('feedback') : Promise.resolve(confirm('Excluir feedback?')));
            if (!ok) return;
        } catch {}
        try {
            const card = q('#feedbacksTable')?.closest('.card') || document.body; const l = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
            const resp = await auth.authenticatedRequest(`${apiBase}/feedbacks/${id}`, { method:'DELETE' }); const j = await resp.json();
            if (j.success) { await load(); try { showAlert('success', 'Feedback excluído'); } catch {} }
            try { l.hide(); } catch {}
        } catch(e) { try { showAlert('error', e.message||'Erro ao excluir'); } catch {} }
    }

    function attach(){
        els.btnNovo?.addEventListener('click', () => openForm());
        els.searchInput?.addEventListener('input', EzerUtils && EzerUtils.debounce ? EzerUtils.debounce(load, 300) : load);
        els.empresaFilter?.addEventListener('change', load);
        els.dataInicioFilter?.addEventListener('change', load);
        els.dataFimFilter?.addEventListener('change', load);
        els.classificacaoFilter?.addEventListener('change', load);
        document.addEventListener('click', async (ev)=>{
            const btn = ev.target.closest('button'); if (!btn) return; const a = btn.getAttribute('data-action'); const id = btn.getAttribute('data-id'); if (!a) return;
            if (a==='view' && id) return viewItem(id);
            if (a==='edit' && id) { const item = cache.find(x=> x.id_feedback==id); if (!item) return; await openForm(item); return; }
            if (a==='delete' && id) return deleteItem(id);
        });
    }

    document.addEventListener('DOMContentLoaded', async function(){
        try { queryEls(); attach(); await load(); } catch(e){ console.error('feedbacks init:', e); }
    });
})();


