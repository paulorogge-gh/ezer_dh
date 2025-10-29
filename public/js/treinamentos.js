const apiBase = window.API_CONFIG?.BASE_URL;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        queryEls();
        attachEvents();
        await loadTreinamentos();
    } catch (e) {
        console.error('Falha ao inicializar treinamentos:', e);
    }
});

const els = { tableBody: null, btnNovo: null };

function queryEls() {
    els.tableBody = document.querySelector('#treinamentosTable tbody');
    els.btnNovo = document.getElementById('btnNovoTreinamento');
}

function sanitize(v){ try { return (v||'').toString().trim(); } catch { return ''; } }

function renderList(list) {
    if (!els.tableBody) return;
    els.tableBody.innerHTML = '';
    (list || []).forEach(renderRow);
}

function renderRow(t) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${sanitize(t.colaborador_nome||'')}</td>
        <td>${sanitize(t.nome)}</td>
        <td>${sanitize(t.categoria)}</td>
        <td>${Number(t.carga_horaria||0)}</td>
        <td>${Number(t.attachments_count || 0)}</td>
        <td>
            <div class="btn-group" role="group" aria-label="Ações">
                <button class="btn btn-secondary btn-sm" data-action="view" data-id="${t.id_treinamento}" title="Ver"><i class="bi bi-eye"></i></button>
                <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${t.id_treinamento}" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon error" data-action="delete" data-id="${t.id_treinamento}" title="Excluir"><i class="bi bi-trash"></i></button>
            </div>
        </td>
    `;
    els.tableBody.appendChild(tr);
}

async function loadTreinamentos() {
    const card = document.getElementById('treinamentosTable')?.closest('.card') || document.body;
    const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
    try {
        const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos`, { method: 'GET' });
        if (!resp.ok) throw new Error(`Erro ${resp.status} ao listar treinamentos`);
        const j = await resp.json();
        if (!j.success) throw new Error(j.error || 'Falha ao listar treinamentos');
        // calcular quantidade de anexos se não vier do backend
        const list = (j.data || []).map(item => ({
            ...item,
            attachments_count: typeof item.attachments_count !== 'undefined' ? item.attachments_count : (Array.isArray(item.anexos) ? item.anexos.length : (typeof item.num_anexos === 'number' ? item.num_anexos : 0))
        }));
        renderList(list);
    } catch (e) {
        console.error('Erro ao carregar treinamentos:', e);
        try { showAlert('error', e.message || 'Erro ao carregar treinamentos'); } catch {}
    } finally { try { loader.hide(); } catch {} }
}

function attachEvents() {
    els.btnNovo?.addEventListener('click', openCreateModal);
    document.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!action || !id) return;
        const card = document.getElementById('treinamentosTable')?.closest('.card-body') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card) : { hide(){} };
        if (action === 'delete') return deleteTreinamento(id);
        if (action === 'edit') { try { await editTreinamento(id); } finally { try { loader.hide(); } catch {} } return; }
        if (action === 'view') { try { await viewTreinamento(id); } finally { try { loader.hide(); } catch {} } return; }
        // botão de anexos foi removido das ações
    });
}

// Handler global para Abrir/Baixar anexos na visualização (showInfoModal)
document.addEventListener('click', async (ev) => {
    const openBtn = ev.target.closest('button[data-action="open-attach"]');
    const dlBtn = ev.target.closest('button[data-action="download-attach"]');
    if (!openBtn && !dlBtn) return;
    const id = (openBtn || dlBtn).getAttribute('data-id');
    const blob = (openBtn || dlBtn).getAttribute('data-blob');
    if (!id || !blob) return;
    try {
        if (openBtn) { await openTreinamentoAttachment(id, blob); return; }
        if (dlBtn) { await downloadTreinamentoAttachment(id, blob); return; }
    } catch (e) {
        try { showAlert('error', e.message || 'Falha ao acessar anexo'); } catch {}
    }
});

function buildCreateFormHtml() {
    const hint = '';
    return `
        <div class="form-grid">
            ${hint}
            <div class="form-field">
                <label class="form-label" for="id_empresa">Empresa *</label>
                <select class="form-select form-control" id="id_empresa" name="id_empresa">
                    <option value="">Selecione</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label" for="id_colaborador">Colaborador *</label>
                <select class="form-select form-control" id="id_colaborador" name="id_colaborador" required>
                    <option value="">Selecione</option>
                </select>
            </div>
            <div class="form-field"><label class="form-label" for="nome">Nome do Treinamento *</label><input class="form-control" id="nome" name="nome" type="text" placeholder="Nome"></div>
            <div class="form-field"><label class="form-label" for="data_inicio">Data Inicial *</label><input class="form-control" id="data_inicio" name="data_inicio" type="date"></div>
            <div class="form-field"><label class="form-label" for="data_fim">Data Final *</label><input class="form-control" id="data_fim" name="data_fim" type="date"></div>
            <div class="form-field"><label class="form-label" for="categoria">Categoria *</label><select class="form-select" id="categoria" name="categoria"><option value="Online">Online</option><option value="Presencial">Presencial</option></select></div>
            <div class="form-field"><label class="form-label" for="carga_horaria">Carga Horária</label><input class="form-control" id="carga_horaria" name="carga_horaria" type="number" min="0" step="1" placeholder="Horas"></div>
            <div class="form-field span-2"><label class="form-label" for="observacoes">Observações</label><textarea class="form-control" id="observacoes" name="observacoes" rows="4" placeholder="Detalhes"></textarea></div>
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

async function openCreateModal() {
    // Lista de anexos pendentes deve estar disponível no onSubmit
    const pendingFiles = [];
    const modalRef = showFormModal({
        title: 'Novo Treinamento',
        formHtml: buildCreateFormHtml(),
        size: 'lg',
        submitText: 'Salvar',
        cancelText: 'Cancelar',
        onSubmit: async (form, close) => {
            const fd = new FormData(form);
            const payload = Object.fromEntries(fd.entries());
            const errors = [];
            function invalid(id){ try { form.querySelector(`#${id}`)?.classList.add('is-invalid'); } catch {} }
            form.querySelectorAll('.is-invalid').forEach(e => e.classList.remove('is-invalid'));
            if (!Number(payload.id_empresa)) { errors.push('Empresa'); invalid('id_empresa'); }
            if (!Number(payload.id_colaborador)) { errors.push('Colaborador'); invalid('id_colaborador'); }
            if (!sanitize(payload.nome)) { errors.push('Nome'); invalid('nome'); }
            if (!sanitize(payload.data_inicio)) { errors.push('Data Inicial'); invalid('data_inicio'); }
            if (!sanitize(payload.data_fim)) { errors.push('Data Final'); invalid('data_fim'); }
            if (!sanitize(payload.categoria)) { errors.push('Categoria'); invalid('categoria'); }
            if (errors.length) { try { showAlert('warning', `Preencha: ${errors.join(', ')}`); } catch {} return; }
            const fdOut = new FormData();
            fdOut.set('id_empresa', String(Number(payload.id_empresa)));
            fdOut.set('id_colaborador', String(Number(payload.id_colaborador)));
            fdOut.set('nome', sanitize(payload.nome));
            fdOut.set('data_inicio', sanitize(payload.data_inicio));
            fdOut.set('data_fim', sanitize(payload.data_fim));
            fdOut.set('categoria', sanitize(payload.categoria));
            if (payload.carga_horaria) fdOut.set('carga_horaria', String(Number(payload.carga_horaria)));
            if (payload.observacoes) fdOut.set('observacoes', sanitize(payload.observacoes));
            const filesInput = form.querySelector('#anexos');
            const files = filesInput?.files || [];
            for (const f of files) fdOut.append('files', f);
            // Incluir também arquivos adicionados via dropzone (pendingFiles)
            try { if (pendingFiles && pendingFiles.length) pendingFiles.forEach(f => fdOut.append('files', f)); } catch {}
            try {
                const container = modalRef?.el?.querySelector('.modal-card') || document.body;
                const loader = window.EzerLoading ? EzerLoading.show(container) : { hide(){} };
                const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos`, { method: 'POST', body: fdOut });
                const j = await resp.json();
                if (!j.success) throw new Error(j.error || 'Falha ao criar treinamento');
                await loadTreinamentos();
                close();
                try { showAlert('success', 'Treinamento criado com sucesso'); } catch {}
            } catch (e) { try { showAlert('error', e.message || 'Erro ao criar treinamento'); } catch {} }
            finally { try { loader.hide(); } catch {} }
        }
    });
    // Popular empresas e cadeia empresa->colaborador, e configurar dropzone de anexos
        try {
        const root = modalRef?.el || document;
        const empSel = root.querySelector('#id_empresa');
        const colSel = root.querySelector('#id_colaborador');
        const role = (window.auth && auth.user && auth.user.role) || '';
        const myEmpresaId = auth?.getTokenPayload?.()?.empresa_id || auth?.user?.empresa_id || null;
        // empresas
        try {
            const tmp = document.createElement('select');
            const fieldContainer = empSel.closest('.form-field') || empSel.parentElement || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(fieldContainer) : { hide(){} };
            const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: true });
            let opts = '<option value="">Selecione</option>' + (list || []).map(e => `<option value="${e.id_empresa}">${sanitize(e.nome)}</option>`).join('');
            if ((!list || !list.length) && role === 'empresa' && myEmpresaId) {
                try { const r = await auth.authenticatedRequest(`${apiBase}/empresas/${myEmpresaId}`, { method:'GET' }); const j = await r.json(); if (j.success && j.data) opts = '<option value="">Selecione</option>' + `<option value="${myEmpresaId}">${sanitize(j.data.nome)}</option>`; }
                catch { opts = '<option value="">Selecione</option>' + `<option value="${myEmpresaId}">Minha Empresa</option>`; }
            }
            empSel.innerHTML = opts;
            if (role === 'empresa' && myEmpresaId) { try { empSel.value = String(myEmpresaId); } catch {} }
            try { loader.hide(); } catch {}
        } catch {}
        // colaboradores by empresa
        async function loadColabsByEmpresa(idEmp) {
            const fieldContainer = colSel.closest('.form-field') || colSel.parentElement || document.body;
            const loader = window.EzerLoading ? EzerLoading.show(fieldContainer) : { hide(){} };
            try {
                const r = await auth.authenticatedRequest(`${apiBase}/empresas/${idEmp}/colaboradores`, { method: 'GET' });
                const j = await r.json();
                const list = j.success ? (j.data || []) : [];
                colSel.innerHTML = '<option value="">Selecione</option>' + list.map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
            } catch { colSel.innerHTML = '<option value="">Selecione</option>'; }
            finally { try { loader.hide(); } catch {} }
        }
        empSel.addEventListener('change', async () => {
            const idEmp = Number(empSel.value || 0);
            if (idEmp) await loadColabsByEmpresa(idEmp);
            else colSel.innerHTML = '<option value="">Selecione</option>';
        });
        if (role === 'empresa' && myEmpresaId) { await loadColabsByEmpresa(myEmpresaId); }
        // Dropzone de anexos
        const anexosInput = root.querySelector('#anexos');
        const anexosList = root.querySelector('#anexosList');
        const anexosDrop = root.querySelector('#anexosDrop');
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
                            <span style="font-size:.85rem; color: var(--gray-600);">${(typeof f.size==='number') ? (f.size + ' B') : ''}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-icon error" data-action="del-local-attach" data-index="${i}"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            `).join('');
            anexosList.innerHTML = items;
        }
        anexosDrop.addEventListener('click', () => anexosInput.click());
        ['dragenter','dragover'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.04)'; anexosDrop.style.borderColor = 'var(--gray-400)'; }, false));
        ['dragleave','drop'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.02)'; anexosDrop.style.borderColor = 'var(--gray-300)'; }, false));
        anexosDrop.addEventListener('drop', (e) => {
            const dt = e.dataTransfer; const files = Array.from(dt?.files || []);
            if (!files.length) return; pendingFiles.push(...files); renderPending();
        });
        anexosInput.addEventListener('change', (ev) => { const files = Array.from(ev.target.files || []); if (!files.length) return; pendingFiles.push(...files); try { anexosInput.value = ''; } catch {}; renderPending(); });
        root.addEventListener('click', (ev) => { const btn = ev.target.closest('button[data-action="del-local-attach"]'); if (!btn) return; const idx = Number(btn.getAttribute('data-index')); if (!Number.isNaN(idx)) { pendingFiles.splice(idx,1); renderPending(); } });
        // Observação: os arquivos de pendingFiles já são anexados no onSubmit
    } catch {}
}

async function editTreinamento(id) {
    try {
        const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}`, { method: 'GET' });
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'Treinamento não encontrado');
        const t = j.data || {};
        const formHtml = `
            <div class="form-grid">
                <div class="form-field">
                    <label class="form-label" for="id_empresa">Empresa *</label>
                    <select class="form-select form-control" id="id_empresa" name="id_empresa">
                        <option value="">Selecione</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-label" for="id_colaborador">Colaborador *</label>
                    <select class="form-select form-control" id="id_colaborador" name="id_colaborador" required>
                        <option value="">Selecione</option>
                    </select>
                </div>
                <div class="form-field"><label class="form-label" for="nome">Nome</label><input class="form-control" id="nome" name="nome" type="text" value="${sanitize(t.nome)}"></div>
                <div class="form-field"><label class="form-label" for="data_inicio">Data Inicial</label><input class="form-control" id="data_inicio" name="data_inicio" type="date" value="${sanitize(t.data_inicio)}"></div>
                <div class="form-field"><label class="form-label" for="data_fim">Data Final</label><input class="form-control" id="data_fim" name="data_fim" type="date" value="${sanitize(t.data_fim)}"></div>
                <div class="form-field"><label class="form-label" for="categoria">Categoria</label><select class="form-select" id="categoria" name="categoria"><option ${t.categoria==='Online'?'selected':''} value="Online">Online</option><option ${t.categoria==='Presencial'?'selected':''} value="Presencial">Presencial</option></select></div>
                <div class="form-field"><label class="form-label" for="carga_horaria">Carga Horária</label><input class="form-control" id="carga_horaria" name="carga_horaria" type="number" min="0" step="1" value="${Number(t.carga_horaria||0)}"></div>
                <div class="form-field span-2"><label class="form-label" for="observacoes">Observações</label><textarea class="form-control" id="observacoes" name="observacoes" rows="4">${sanitize(t.observacoes||'')}</textarea></div>
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
        showFormModal({
            title: `Editar Treinamento — ${sanitize(t.nome)}`,
            formHtml,
            size: 'lg',
            submitText: 'Salvar',
            cancelText: 'Cancelar',
            onSubmit: async (form, close) => {
                const fd = new FormData(form);
                const fdOut = new FormData();
                for (const [k, v] of fd.entries()) {
                    if (k === 'files') continue;
                    fdOut.set(k, v);
                }
                // incluir empresa como number
                const empEl = form.querySelector('#id_empresa');
                if (empEl && empEl.value) fdOut.set('id_empresa', String(Number(empEl.value)));
                const filesInput = form.querySelector('#files');
                const files = filesInput?.files || [];
                for (const f of files) fdOut.append('files', f);
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}`, { method: 'PUT', body: fdOut });
                    const j = await resp.json();
                    if (!j.success) throw new Error(j.error || 'Falha ao atualizar');
                    await loadTreinamentos();
                    close();
                    try { showAlert('success', 'Treinamento atualizado com sucesso'); } catch {}
                } catch (e) { try { showAlert('error', e.message || 'Erro ao atualizar treinamento'); } catch {} }
            }
        });
        // Popular empresas e colaboradores
        try {
            const root = document;
            const empSel = root.querySelector('#id_empresa');
            const colSel = root.querySelector('#id_colaborador');
            const role = (window.auth && auth.user && auth.user.role) || '';
            const myEmpresaId = auth?.getTokenPayload?.()?.empresa_id || auth?.user?.empresa_id || null;
            const tmp = document.createElement('select');
            const { list } = await EzerRBAC.populateEmpresaSelect(tmp, { includeEmpty: true });
            let opts = '<option value="">Selecione</option>' + (list || []).map(e => `<option value="${e.id_empresa}">${sanitize(e.nome)}</option>`).join('');
            empSel.innerHTML = opts;
            let initialEmpresaId = null;
            if (role === 'empresa' && myEmpresaId) initialEmpresaId = myEmpresaId;
            // se vier colaborador, inferir empresa
            if (!initialEmpresaId && t.id_colaborador) {
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/colaboradores/${t.id_colaborador}`, { method:'GET' });
                    const j = await r.json();
                    const col = j.success ? (j.data || null) : null;
                    if (col && col.id_empresa) initialEmpresaId = col.id_empresa;
                } catch {}
            }
            if (initialEmpresaId) { try { empSel.value = String(initialEmpresaId); } catch {} }
            const r2 = await auth.authenticatedRequest(`${apiBase}/empresas/${initialEmpresaId}/colaboradores`, { method:'GET' });
            const j2 = await r2.json();
            const list2 = j2.success ? (j2.data || []) : [];
            colSel.innerHTML = '<option value="">Selecione</option>' + list2.map(c => `<option value="${c.id_colaborador}" ${t.id_colaborador===c.id_colaborador?'selected':''}>${sanitize(c.nome)}</option>`).join('');
            empSel.addEventListener('change', async () => {
                const idEmp = Number(empSel.value || 0);
                if (!idEmp) { colSel.innerHTML = '<option value="">Selecione</option>'; return; }
                const r3 = await auth.authenticatedRequest(`${apiBase}/empresas/${idEmp}/colaboradores`, { method:'GET' });
                const j3 = await r3.json();
                const list3 = j3.success ? (j3.data || []) : [];
                colSel.innerHTML = '<option value="">Selecione</option>' + list3.map(c => `<option value="${c.id_colaborador}">${sanitize(c.nome)}</option>`).join('');
            });
            // Anexos (listar existentes e upload imediato ao adicionar)
            const anexosInput = root.querySelector('#anexos');
            const anexosList = root.querySelector('#anexosList');
            const anexosDrop = root.querySelector('#anexosDrop');
        async function refreshAttachments() {
                const loader = window.EzerLoading ? EzerLoading.show(anexosList || document.body) : { hide(){} };
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments`, { method: 'GET' });
                    const j = await r.json();
                    const items = (j.success ? (j.data || []) : []).map(a => {
                        const fileName = sanitize(((a.url || '').split('/').pop()) || 'arquivo');
                        const blobPath = `treinamentos/${id}/${fileName}`;
                        return `
                            <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                                <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fileName}">${fileName}</div>
                                <div style="display:flex; gap:6px;">
                                    <button class="btn btn-secondary btn-sm" data-action="open-attach" data-id="${id}" data-blob="${blobPath}">Abrir</button>
                                    <button class="btn btn-secondary btn-sm" data-action="download-attach" data-id="${id}" data-blob="${blobPath}">Baixar</button>
                                    <button class="btn-icon error" data-action="del-attach" data-id="${id}" data-blob="${blobPath}"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    anexosList.innerHTML = items || '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo.</div>';
                } catch {
                    anexosList.innerHTML = '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo.</div>';
                }
                finally { try { loader.hide(); } catch {} }
            }
            // Inicializar lista
            await refreshAttachments();
            // Upload imediato
            async function uploadImmediate(files) {
                const formData = new FormData(); files.forEach(f => formData.append('files', f));
                const loader = window.EzerLoading ? EzerLoading.show(anexosList || document.body) : { hide(){} };
                try {
                    const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments`, { method: 'POST', body: formData });
                    const j = await r.json();
                    if (j.success) { await refreshAttachments(); }
                } finally { try { loader.hide(); } catch {} }
            }
            anexosDrop.addEventListener('click', () => anexosInput.click());
            ['dragenter','dragover'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.04)'; anexosDrop.style.borderColor = 'var(--gray-400)'; }, false));
            ['dragleave','drop'].forEach(evt => anexosDrop.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); anexosDrop.style.background = 'rgba(0,0,0,0.02)'; anexosDrop.style.borderColor = 'var(--gray-300)'; }, false));
            anexosDrop.addEventListener('drop', async (e) => {
                const dt = e.dataTransfer; const files = Array.from(dt?.files || []);
                if (!files.length) return; await uploadImmediate(files);
            });
            anexosInput.addEventListener('change', async (ev) => { const files = Array.from(ev.target.files || []); if (!files.length) return; await uploadImmediate(files); try { anexosInput.value=''; } catch {} });
            // Delete / abrir / baixar
            anexosList.addEventListener('click', async (ev) => {
                const delBtn = ev.target.closest('button[data-action="del-attach"]');
                const openBtn = ev.target.closest('button[data-action="open-attach"]');
                const dlBtn = ev.target.closest('button[data-action="download-attach"]');
                if (delBtn) {
                    const blob = delBtn.getAttribute('data-blob'); if (!blob) return;
                    const ok = await (window.showDeleteConfirm ? showDeleteConfirm('treinamento', { title: 'Excluir anexo', message: 'Remover este arquivo?' }) : Promise.resolve(confirm('Remover este arquivo?')));
                    if (!ok) return;
                    const loader = window.EzerLoading ? EzerLoading.show(anexosList) : { hide(){} };
                    try {
                        const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments/${encodeURIComponent(blob)}`, { method:'DELETE' });
                        const j = await r.json();
                        if (j.success) { await refreshAttachments(); }
                    } finally { try { loader.hide(); } catch {} }
                    return;
                }
                if (openBtn) {
                    const blob = openBtn.getAttribute('data-blob'); if (!blob) return;
                    try { await openTreinamentoAttachment(id, blob); } catch (e) { try { showAlert('error', e.message || 'Falha ao abrir anexo'); } catch {} }
                    return;
                }
                if (dlBtn) {
                    const blob = dlBtn.getAttribute('data-blob'); if (!blob) return;
                    try { await downloadTreinamentoAttachment(id, blob); } catch (e) { try { showAlert('error', e.message || 'Falha ao baixar anexo'); } catch {} }
                    return;
                }
            });
        } catch {}
    } catch (e) { try { showAlert('error', e.message || 'Erro ao abrir edição'); } catch {} }
}

async function viewTreinamento(id) {
    try {
        const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}`, { method: 'GET' });
        const j = await r.json();
        if (!j.success) throw new Error(j.error || 'Treinamento não encontrado');
        const t = j.data || {};
        // Buscar anexos do treinamento
        let anexos = [];
        try {
            const ar = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments`, { method: 'GET' });
            const aj = await ar.json();
            anexos = aj && aj.success ? (aj.data || []) : [];
        } catch {}
        const anexosHtml = (anexos && anexos.length)
            ? anexos.map(a => {
                const fileName = sanitize(((a.url || '').split('/').pop()) || 'arquivo');
                const blobPath = `treinamentos/${id}/${fileName}`;
                return `
                    <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fileName}">${fileName}</div>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-secondary btn-sm" data-action="open-attach" data-id="${id}" data-blob="${blobPath}">Abrir</button>
                            <button class="btn btn-secondary btn-sm" data-action="download-attach" data-id="${id}" data-blob="${blobPath}">Baixar</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="text-muted" style="font-size:.9rem;">Nenhum anexo.</div>';

        const html = `
            <div class="details-grid">
                <div class="details-item"><div class="details-label">Nome</div><div class="details-value">${sanitize(t.nome)}</div></div>
                <div class="details-item"><div class="details-label">Período</div><div class="details-value">${sanitize(t.data_inicio)} a ${sanitize(t.data_fim)}</div></div>
                <div class="details-item"><div class="details-label">Categoria</div><div class="details-value">${sanitize(t.categoria)}</div></div>
                <div class="details-item"><div class="details-label">Carga Horária</div><div class="details-value">${Number(t.carga_horaria||0)}</div></div>
                <div class="details-item"><div class="details-label">Observações</div><div class="details-value">${sanitize(t.observacoes||'')}</div></div>
                <div class="details-item span-2">
                    <div class="details-label">Anexos</div>
                    <div class="details-value"><div class="list">${anexosHtml}</div></div>
                </div>
            </div>
        `;
        showInfoModal({ title: 'Detalhes do Treinamento', html, closeText: 'Fechar', size: 'lg' });
    } catch (e) { try { showAlert('error', e.message || 'Erro ao exibir detalhes'); } catch {} }
}

async function manageAttachments(id) {
    try {
        const r = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments`, { method: 'GET' });
        const j = await r.json();
        const list = j.success ? (j.data || []) : [];
        const html = `
            <div>
                <div class="form-field"><label class="form-label" for="files">Enviar anexos</label><input class="form-control" id="files" name="files" type="file" multiple></div>
                <div class="attachments-list" style="margin-top:12px;">
                    ${(list||[]).map(a => `<div class="attachment-item" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06)">
                        <a href="${sanitize(a.url)}" target="_blank">${sanitize(a.nome_arquivo||a.url)}</a>
                        <button class="btn btn-icon error" data-action="delete-attachment" data-url="${sanitize(a.url)}" data-name="${sanitize(a.nome_arquivo||'blob')}"><i class="bi bi-trash"></i></button>
                    </div>`).join('')}
                </div>
            </div>
        `;
        showFormModal({
            title: 'Anexos do Treinamento',
            formHtml: html,
            size: 'lg',
            submitText: 'Enviar',
            cancelText: 'Fechar',
            onSubmit: async (form, close) => {
                const input = form.querySelector('#files');
                const files = input?.files || [];
                if (!files.length) { try { showAlert('warning', 'Selecione arquivos'); } catch {} return; }
                const fd = new FormData();
                for (const f of files) fd.append('files', f);
                try {
                    const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments`, { method: 'POST', body: fd });
                    const j2 = await resp.json();
                    if (!j2.success) throw new Error(j2.error || 'Falha ao enviar anexos');
                    try { showAlert('success', 'Anexos enviados'); } catch {}
                    close();
                } catch (e) { try { showAlert('error', e.message || 'Erro ao enviar anexos'); } catch {} }
            }
        });
        document.addEventListener('click', async (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action !== 'delete-attachment') return;
            const url = btn.getAttribute('data-url');
            const name = btn.getAttribute('data-name');
            // blobName está após último '/'
            const fileName = (url || '').split('/').pop();
            const blobPath = `treinamentos/${id}/${fileName}`;
            try {
                const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}/attachments/${encodeURIComponent(blobPath)}`, { method: 'DELETE' });
                const j3 = await resp.json();
                if (!j3.success) throw new Error(j3.error || 'Falha ao excluir anexo');
                try { showAlert('success', 'Anexo excluído'); } catch {}
                // Atualizar lista (fechar e reabrir seria simples; aqui apenas remove visualmente)
                btn.closest('.attachment-item')?.remove();
            } catch (e) { try { showAlert('error', e.message || 'Erro ao excluir anexo'); } catch {} }
        });
    } catch {}
}

window.loadTreinamentos = loadTreinamentos;
window.editTreinamento = editTreinamento;
window.viewTreinamento = viewTreinamento;
window.manageAttachments = manageAttachments;

// Utilitários para abrir/baixar anexos de Treinamentos
async function fetchTrainingAttachmentBlob(treinamentoId, blobName, disposition) {
    const url = `${apiBase}/treinamentos/${treinamentoId}/attachments/${encodeURIComponent(blobName)}/content?disposition=${encodeURIComponent(disposition || 'inline')}`;
    const resp = await auth.authenticatedRequest(url, { method: 'GET' });
    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(txt || 'Erro ao obter anexo');
    }
    const dataBlob = await resp.blob();
    return dataBlob;
}

async function openTreinamentoAttachment(treinamentoId, blobName) {
    const blob = await fetchTrainingAttachmentBlob(treinamentoId, blobName, 'inline');
    const objectUrl = URL.createObjectURL(blob);
    try { window.open(objectUrl, '_blank', 'noopener'); }
    finally { setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000); }
}

async function downloadTreinamentoAttachment(treinamentoId, blobName) {
    const blob = await fetchTrainingAttachmentBlob(treinamentoId, blobName, 'attachment');
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

async function deleteTreinamento(id) {
    try {
        const ok = await (window.showDeleteConfirm ? showDeleteConfirm('treinamento') : (window.showConfirm ? showConfirm({
            title: 'Excluir treinamento',
            message: 'Tem certeza que deseja excluir este treinamento? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar'
        }) : Promise.resolve(confirm('Tem certeza que deseja excluir este treinamento?'))));
        if (!ok) return;
    } catch {}
    try {
        const card = document.querySelector('#treinamentosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
        const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}`, { method: 'DELETE' });
        const response = await resp.json();
        if (response.success) {
            if (window.loadTreinamentos) { try { await loadTreinamentos(); } catch {} }
            if (window.showAlert) { try { showAlert('success', 'Treinamento excluído com sucesso'); } catch {} }
            else { EzerNotifications?.success?.('Treinamento excluído com sucesso'); }
            try { loader.hide(); } catch {}
        } else {
            if (window.showAlert) { try { showAlert('error', response.error || 'Erro ao excluir treinamento'); } catch {} }
            else { EzerNotifications?.error?.('Erro ao excluir treinamento'); }
        }
    } catch (error) {
        console.error('Erro ao excluir treinamento:', error);
        EzerNotifications?.error?.('Erro ao excluir treinamento');
    }
}

window.deleteTreinamento = deleteTreinamento;

// Alternar status (Ativo/Inativo) de treinamento
async function toggleTreinamentoStatus(id, nextStatus) {
    try {
        const ok = await (window.showConfirm ? showConfirm({
            title: `${nextStatus === 'Inativo' ? 'Inativar' : 'Ativar'} treinamento`,
            message: `Confirma alterar o status para "${nextStatus}"?`,
            confirmText: 'Confirmar',
            cancelText: 'Cancelar'
        }) : Promise.resolve(confirm(`Confirma alterar o status para "${nextStatus}"?`)));
        if (!ok) return;

        const card = document.querySelector('#treinamentosTable')?.closest('.card') || document.body;
        const loader = window.EzerLoading ? EzerLoading.show(card || undefined) : { hide(){} };
        const resp = await auth.authenticatedRequest(`${apiBase}/treinamentos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
        const response = await resp.json();
        if (response.success) {
            if (window.loadTreinamentos) { try { await loadTreinamentos(); } catch {} }
            if (window.showAlert) { try { showAlert('success', `Status alterado para ${nextStatus}`); } catch {} }
            else { EzerNotifications?.success?.(`Status alterado para ${nextStatus}`); }
            try { loader.hide(); } catch {}
        } else {
            if (window.showAlert) { try { showAlert('error', response.error || 'Falha ao alterar status'); } catch {} }
            else { EzerNotifications?.error?.(response.error || 'Falha ao alterar status'); }
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        EzerNotifications?.error?.('Erro ao alterar status');
    }
}

window.toggleTreinamentoStatus = toggleTreinamentoStatus;
