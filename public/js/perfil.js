(function(){
  async function loadProfile() {
    const data = await auth.getProfile();
    if (!data) return;
    const nome = data.nome || data.name || '';
    const email = data.email || '';
    document.getElementById('perfilNome').value = nome;
    document.getElementById('perfilEmail').value = email;

    const ref = auth.getUserReference();
    const role = ref?.role || auth.user?.role;
    const emailInput = document.getElementById('perfilEmail');
    const emailHelp = document.getElementById('emailHelp');
    if (role === 'empresa' || role === 'colaborador') {
      emailInput.disabled = true;
      emailHelp.textContent = 'Para alterar o e-mail, procure o administrador do sistema na sua empresa.';
    } else if (role === 'consultoria') {
      emailInput.disabled = false;
      emailHelp.textContent = 'Você pode alterar seu e-mail de acesso.';
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const ref = auth.getUserReference();
    if (!ref) { window.showAlert?.('error', 'Sessão inválida'); return; }
    const role = ref.role;
    const idUsuario = ref.idUsuario;

    const nome = document.getElementById('perfilNome').value.trim();
    const email = document.getElementById('perfilEmail').value.trim();

    try {
      const body = { nome };
      if (role === 'consultoria') {
        body.email = email; // consultoria pode alterar e-mail
      }
      const resp = await auth.authenticatedRequest(`${API_CONFIG.BASE_URL.replace('/api','')}/api/usuarios/${idUsuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (data?.success) {
        window.showAlert?.('success', 'Perfil atualizado com sucesso');
        // Atualizar perfil local
        await auth.getProfile();
      } else {
        window.showAlert?.('error', data?.error || 'Falha ao atualizar perfil');
      }
    } catch (e) {
      console.error(e);
      window.showAlert?.('error', 'Erro de conexão');
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    if (!currentPassword || !newPassword) { window.showAlert?.('warning', 'Preencha senha atual e nova senha'); return; }
    try {
      const resp = await auth.authenticatedRequest(`${API_CONFIG.BASE_URL}/auth/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await resp.json();
      if (data?.success) {
        window.showAlert?.('success', 'Senha alterada com sucesso');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
      } else {
        window.showAlert?.('error', data?.error || 'Não foi possível alterar a senha');
      }
    } catch (e) {
      window.showAlert?.('error', 'Erro de conexão');
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadProfile();
    document.getElementById('perfilForm').addEventListener('submit', saveProfile);
    document.getElementById('btnCancelarPerfil').addEventListener('click', loadProfile);
    document.getElementById('senhaForm').addEventListener('submit', changePassword);
    document.getElementById('btnCancelarSenha').addEventListener('click', function(){
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
    });
  });
})();

