(() => {
  function showGlobalLoading() {
    try {
      // Evitar múltiplos overlays
      if (document.querySelector('.loading-overlay.global')) return;
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay global';
      overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(overlay);
      // permitir transição
      requestAnimationFrame(() => { overlay.classList.add('open'); });
    } catch {}
  }

  function hideGlobalLoading() {
    try {
      document.querySelectorAll('.loading-overlay.global').forEach(el => {
        try { el.classList.remove('open'); } catch {}
        setTimeout(() => { try { el.remove(); } catch {} }, 150);
      });
    } catch {}
  }

  async function fetchAudit() {
    showGlobalLoading();
    const action = document.getElementById('filterAction').value || '';
    const user_id = document.getElementById('filterUser').value || '';
    const from = document.getElementById('filterFrom').value || '';
    const to = document.getElementById('filterTo').value || '';
    const q = document.getElementById('filterQ').value || '';
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (user_id) params.set('user_id', user_id);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    const apiBase = window.API_CONFIG?.BASE_URL || `${window.location.origin}/api`;
    const url = `${apiBase}/auditoria?${params.toString()}`;
    try {
      const res = await (window.auth ? auth.authenticatedRequest(url, { method: 'GET' }) : fetch(url));
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Falha ao carregar auditoria');
      renderRows(data.data || []);
    } finally {
      hideGlobalLoading();
    }
  }

  function renderRows(rows) {
    const tbody = document.getElementById('auditBody');
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const created = r.created_at ? new Date(r.created_at).toLocaleString() : '';
      const details = r.details ? JSON.stringify(r.details).slice(0, 200) : '';
      tr.innerHTML = `<td>${created}</td><td>${r.user_id ?? ''}</td><td>${r.action}</td><td>${r.ip ?? ''}</td><td>${details}</td>`;
      tbody.appendChild(tr);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    try {
      const role = window.auth?.user?.role || null;
      if (role !== 'consultoria') {
        // Bloquear acesso visual
        const body = document.getElementById('auditBody');
        if (body) body.innerHTML = '';
        const container = document.querySelector('.audit-container');
        if (container) container.innerHTML = '<div class="alert alert-warning">Acesso restrito à Consultoria.</div>';
        return;
      }
    } catch {}
    document.getElementById('btnBuscar').addEventListener('click', fetchAudit);
    fetchAudit().catch((e) => {
      try {
        const container = document.querySelector('.audit-container');
        if (container) container.insertAdjacentHTML('beforeend', `<div class="alert alert-danger">${(e && e.message) || 'Erro ao carregar auditoria'}</div>`);
      } catch {}
    });
  });
})();

