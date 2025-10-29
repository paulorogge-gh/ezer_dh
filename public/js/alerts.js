(function(){
    function ensureContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            // Garantir que o container fique acima de qualquer overlay
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '2147483647';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }
        return container;
    }

    function getIconByType(type) {
        switch(type) {
            case 'success': return 'bi-check-circle-fill';
            case 'error': return 'bi-exclamation-triangle-fill';
            case 'warning': return 'bi-exclamation-triangle-fill';
            default: return 'bi-info-circle-fill';
        }
    }

    function showAlert(type, message, options = {}) {
        const container = ensureContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // Garantir sobreposição máxima
        toast.style.zIndex = '2147483647';
        toast.style.pointerEvents = 'auto';
        const title = options.title || (type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Atenção' : 'Informação');
        const autoClose = options.autoClose ?? true;
        const duration = options.duration ?? 4500;

        toast.innerHTML = `
            <div class="toast-icon"><i class="bi ${getIconByType(type)}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fechar" title="Fechar">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => dismiss());

        function dismiss() {
            try {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-8px)';
                setTimeout(() => toast.remove(), 250);
            } catch {}
        }

        container.appendChild(toast);

        if (autoClose) {
            setTimeout(dismiss, duration);
        }

        return { dismiss };
    }

    window.showAlert = showAlert;
})();


