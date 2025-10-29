// UI helper comum para carregar componentes e gerenciar sidebar/user menu
(function(){
    async function loadSidebar() {
        try {
            const cacheKey = 'ui_sidebar_html_v3';
            let html = sessionStorage.getItem(cacheKey);
            if (!html) {
                const resp = await fetch('/components/sidebar.html', { cache: 'no-store' });
                if (!resp.ok) return false;
                html = await resp.text();
                try { sessionStorage.setItem(cacheKey, html); } catch (e) {}
            }
            const placeholder = document.getElementById('sidebar-placeholder');
            if (placeholder) placeholder.innerHTML = html;
            return true;
        } catch (err) {
            console.error('Erro ao carregar sidebar:', err);
            return false;
        }
    }

    async function loadTopbar() {
        try {
            const cacheKey = 'ui_topbar_html_v1';
            let html = sessionStorage.getItem(cacheKey);
            if (!html) {
                const resp = await fetch('/components/topbar.html', { cache: 'no-store' });
                if (!resp.ok) return false;
                html = await resp.text();
                try { sessionStorage.setItem(cacheKey, html); } catch (e) {}
            }
            const placeholder = document.getElementById('topbar-placeholder');
            // remover quaisquer topbars existentes para evitar duplicação
            try {
                document.querySelectorAll('.topbar').forEach(el => el.remove());
            } catch(e) {}
            if (placeholder) placeholder.innerHTML = html;
            // remove duplicate topbars if any (keep first)
            const topbars = document.querySelectorAll('.topbar');
            if (topbars.length > 1) {
                for (let i = 1; i < topbars.length; i++) {
                    topbars[i].remove();
                }
            }
            // attach handlers using selectors (ensure handlers after insertion)
            setTimeout(() => {
                try {
                    const userBtn = document.querySelector('.topbar .user-button');
                    const dropdown = document.querySelector('.topbar .user-dropdown');
                    if (userBtn && dropdown) {
                        // toggleUserMenu is also bound inline via onclick to be resilient
                        userBtn.addEventListener('click', function(e){
                            try { e.preventDefault(); } catch(e){}
                            dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
                            userBtn.setAttribute('aria-expanded', dropdown.style.display === 'block');
                        });
                    }
                    if (dropdown) {
                        const logoutBtn = dropdown.querySelector('#user-logout-btn');
                        if (logoutBtn) {
                            logoutBtn.addEventListener('click', function(e){
                                try { e.preventDefault(); } catch(e){}
                                logout();
                            });
                        }
                    }
                } catch (e) { console.warn('Erro ao anexar handlers do topbar:', e); }
            }, 0);
            return true;
        } catch (err) {
            console.error('Erro ao carregar topbar:', err);
            return false;
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (!sidebar || !mainContent) return;
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }


    async function logout() {
        if (typeof auth !== 'undefined') {
            try {
                await auth.logout();
            } catch (e) {
                console.warn('Logout error', e);
            }
        }
        try { localStorage.setItem('logged_out_by_user', '1'); } catch(e){}
        window.location.href = window.FRONTEND_CONFIG?.LOGIN_PAGE || '/login-minimal';
    }



    function highlightActiveNav() {
        try {
            const links = document.querySelectorAll('.nav-link');
            const path = window.location.pathname;
            links.forEach(link => {
                try {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    if (href === path || (href !== '/' && path.startsWith(href))) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                } catch (e) {}
            });
        } catch (e) { console.warn(e); }
    }

    function populateUserInfo() {
        try {
            const userJson = localStorage.getItem('ezer_user');
            if (!userJson) return;
            const user = JSON.parse(userJson);
            const name = user?.name || user?.nome || 'Usuário';
            const email = user?.email || 'email@dominio.com';

            const userNameEls = document.querySelectorAll('#userName, .user-name, #dropdownUserName');
            userNameEls.forEach(el => { try { el.textContent = name; } catch(e){} });
            const userEmailEls = document.querySelectorAll('.user-email, #dropdownUserEmail');
            userEmailEls.forEach(el => { try { el.textContent = email; } catch(e){} });
            const avatarEl = document.getElementById('userAvatar');
            if (avatarEl && name) avatarEl.textContent = (name[0] || 'U').toUpperCase();
        } catch(e) {}
    }

    // Expor funções globais esperadas
    window.toggleSidebar = toggleSidebar;
    
    window.logout = logout;

    // Auto load both components and then initialize UI
    document.addEventListener('DOMContentLoaded', async function() {
        const sidebarOk = await loadSidebar();
        if (sidebarOk) {
            document.dispatchEvent(new Event('sidebar:loaded'));
            // Vincular botão de logout da sidebar
            try {
                const btnLogout = document.getElementById('btnLogout');
                if (btnLogout) {
                    btnLogout.addEventListener('click', function(e){
                        try { e.preventDefault(); } catch(e){}
                        logout();
                    });
                }
            } catch(e) { console.warn('Falha ao vincular logout na sidebar:', e); }
        }

        // Carregar topbar
        const topbarOk = await loadTopbar();
        if (topbarOk) document.dispatchEvent(new Event('topbar:loaded'));

        // Now that components are present, populate user and highlight nav (idle)
        const schedule = window.requestIdleCallback || function(cb){ setTimeout(cb, 0); };
        schedule(() => {
            try { highlightActiveNav(); populateUserInfo(); } catch(e){}
        });
    });

})();


