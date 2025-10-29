(function(){
    const apiBase = window.API_CONFIG?.BASE_URL;

    async function fetchJson(url, options) {
        try {
            const resp = await (window.auth ? auth.authenticatedRequest(url, options || {}) : fetch(url, options || {}));
            const data = await resp.json().catch(() => ({ success: false }));
            return data;
        } catch (e) { return { success: false, error: e?.message || 'Erro de rede' }; }
    }

    async function populateEmpresaSelect(selectEl, { includeEmpty = false, preselect = null } = {}) {
        if (!selectEl) return { list: [], selectedId: null };
        const role = (window.auth && auth.user && auth.user.role) || '';
        let list = [];
        let selectedId = null;

        if (role === 'consultoria') {
            const j = await fetchJson(`${apiBase}/empresas`, { method: 'GET' });
            list = j.success ? (j.data || []) : [];
        } else if (role === 'empresa') {
            const id = (auth?.user?.id_empresa) || (typeof auth?.getTokenPayload === 'function' ? auth.getTokenPayload()?.empresa_id : null) || null;
            selectedId = id || null;
            if (id) {
                const j = await fetchJson(`${apiBase}/empresas/${id}`, { method: 'GET' });
                const empresa = j.success ? (j.data || null) : null;
                list = empresa ? [empresa] : [{ id_empresa: id, nome: 'Minha Empresa' }];
            }
        } else {
            // colaborador/líder: tentar descobrir empresa diretamente do token/user
            try {
                const idEmp = auth?.user?.id_empresa || (typeof auth?.getTokenPayload === 'function' ? (auth.getTokenPayload()?.empresa_id || null) : null);
                if (idEmp) {
                    selectedId = idEmp;
                    const jEmp = await fetchJson(`${apiBase}/empresas/${selectedId}`, { method: 'GET' });
                    const empresa = jEmp.success ? (jEmp.data || null) : null;
                    list = empresa ? [empresa] : [];
                }
            } catch {}
        }

        const opts = [];
        if (includeEmpty) opts.push('<option value="">Todas</option>');
        const selId = preselect || selectedId;
        opts.push(...(list || []).map(e => `
            <option value="${e.id_empresa}" ${String(e.id_empresa)===String(selId)?'selected':''}>${String(e.nome||'').trim()}</option>
        `));
        try { selectEl.innerHTML = opts.join(''); } catch {}
        return { list, selectedId: selId || null };
    }

    window.EzerRBAC = { populateEmpresaSelect };
})();


