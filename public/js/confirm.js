(function(){
    const ConfirmTexts = {
        delete: {
            empresa: {
                title: 'Excluir empresa',
                message: 'Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            colaborador: {
                title: 'Excluir colaborador',
                message: 'Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            departamento: {
                title: 'Excluir departamento',
                message: 'Tem certeza que deseja excluir este departamento? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            ocorrencia: {
                title: 'Excluir ocorrência',
                message: 'Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            treinamento: {
                title: 'Excluir treinamento',
                message: 'Tem certeza que deseja excluir este treinamento? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            feedback: {
                title: 'Excluir feedback',
                message: 'Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            avaliacao: {
                title: 'Excluir avaliação',
                message: 'Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            },
            pdi: {
                title: 'Excluir PDI',
                message: 'Tem certeza que deseja excluir este PDI? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                cancelText: 'Cancelar'
            }
        },
        logout: {
            title: 'Sair do sistema',
            message: 'Você será desconectado e precisará fazer login novamente. Deseja sair agora?',
            confirmText: 'Sair',
            cancelText: 'Cancelar'
        }
    };

    function buildModal({ title = 'Confirmar ação', message = 'Tem certeza?', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const card = document.createElement('div');
        card.className = 'modal-card';
        card.innerHTML = `
            <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
            </div>
            <div class="modal-body">${message}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" data-action="cancel">${cancelText}</button>
                <button type="button" class="btn btn-error" data-action="confirm">${confirmText}</button>
            </div>
        `;
        overlay.appendChild(card);
        return overlay;
    }

    function showConfirm(opts = {}) {
        return new Promise((resolve) => {
            const modal = buildModal(opts);
            document.body.appendChild(modal);
            // Trigger open animation
            requestAnimationFrame(() => modal.classList.add('open'));

            function cleanup(result) {
                try {
                    modal.classList.remove('open');
                    setTimeout(() => modal.remove(), 200);
                } catch {}
                detach();
                resolve(result);
            }

            let isSelecting = false;
            function onMouseDown(e) {
                // Iniciar seleção de texto dentro do modal-card
                const card = modal.querySelector('.modal-card');
                if (card && card.contains(e.target)) {
                    isSelecting = true;
                }
            }
            function onMouseUp() { isSelecting = false; }
            function onClick(e) {
                const target = e.target;
                if (target.dataset.action === 'confirm') return cleanup(true);
                if (target.dataset.action === 'cancel') return cleanup(false);
                // Não fechar se estiver ocorrendo seleção
                if (isSelecting) return;
                if (e.target === modal) return cleanup(false);
            }

            function onKey(e) {
                if (e.key === 'Escape') return cleanup(false);
                if (e.key === 'Enter') return cleanup(true);
            }

            function detach() {
                modal.removeEventListener('mousedown', onMouseDown, true);
                modal.removeEventListener('mouseup', onMouseUp, true);
                modal.removeEventListener('click', onClick);
                document.removeEventListener('keydown', onKey, true);
            }

            modal.addEventListener('mousedown', onMouseDown, true);
            modal.addEventListener('mouseup', onMouseUp, true);
            modal.addEventListener('click', onClick);
            document.addEventListener('keydown', onKey, true);
        });
    }

    function getDeleteTexts(resourceKey) {
        const map = ConfirmTexts.delete || {};
        return map[resourceKey] || { title: 'Excluir item', message: 'Tem certeza que deseja excluir este item?', confirmText: 'Excluir', cancelText: 'Cancelar' };
    }

    function showDeleteConfirm(resourceKey, extra = {}) {
        const base = getDeleteTexts(resourceKey);
        return showConfirm({ ...base, ...extra });
    }

    function showLogoutConfirm(extra = {}) {
        const base = ConfirmTexts.logout;
        return showConfirm({ ...base, ...extra });
    }

    window.showConfirm = showConfirm;
    window.showDeleteConfirm = showDeleteConfirm;
    window.showLogoutConfirm = showLogoutConfirm;

    // Modal informativo (visualização de detalhes)
    function showInfoModal({ title = 'Detalhes', html = '', closeText = 'Fechar', size = 'lg' } = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const card = document.createElement('div');
        card.className = `modal-card modal-${size}`;
        card.innerHTML = `
            <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
            </div>
            <div class="modal-body">${html}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" data-action="close">${closeText}</button>
            </div>
        `;
        overlay.appendChild(card);

        function close() {
            try {
                overlay.classList.remove('open');
                setTimeout(() => {
                    try {
                        // Remover qualquer overlay de loading dentro do modal
                        overlay.querySelectorAll('.loading-overlay').forEach(el => { try { el.remove(); } catch {} });
                        // Remover overlay de loading global se estiver aberto
                        document.querySelectorAll('.loading-overlay.global').forEach(el => { try { el.remove(); } catch {} });
                    } catch {}
                    overlay.remove();
                }, 200);
            } catch {}
            detach();
        }

        let isSelectingInfo = false;
        function onMouseDownInfo(e) {
            const card = overlay.querySelector('.modal-card');
            if (card && card.contains(e.target)) { isSelectingInfo = true; }
        }
        function onMouseUpInfo() { isSelectingInfo = false; }
        function onClick(e) {
            if (e.target.dataset.action === 'close') { return close(); }
            if (isSelectingInfo) return; // não fechar durante seleção
            if (e.target === overlay) { return close(); }
        }
        function onKey(e) {
            if (e.key === 'Escape' || e.key === 'Enter') {
                close();
            }
        }
        function detach() {
            overlay.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKey, true);
        }

        overlay.addEventListener('mousedown', onMouseDownInfo, true);
        overlay.addEventListener('mouseup', onMouseUpInfo, true);
        overlay.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(overlay);

        return { close };
    }

    window.showInfoModal = showInfoModal;

    // Modal de formulário reutilizável (Novo/Editar)
    function showFormModal({ title = 'Formulário', formHtml = '', submitText = 'Salvar', cancelText = 'Cancelar', size = 'md', onSubmit, lockClose = false } = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const card = document.createElement('div');
        card.className = `modal-card modal-${size}`;
        card.innerHTML = `
            <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
            </div>
            <div class="modal-body">
                <form id="__formModal">${formHtml}</form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" data-action="cancel">${cancelText}</button>
                <button type="submit" class="btn btn-primary" form="__formModal">${submitText}</button>
            </div>
        `;
        overlay.appendChild(card);

        function close() {
            try {
                overlay.classList.remove('open');
                setTimeout(() => {
                    try {
                        // Remover qualquer overlay de loading dentro do modal
                        overlay.querySelectorAll('.loading-overlay').forEach(el => { try { el.remove(); } catch {} });
                        // Remover overlay de loading global se estiver aberto
                        document.querySelectorAll('.loading-overlay.global').forEach(el => { try { el.remove(); } catch {} });
                    } catch {}
                    overlay.remove();
                }, 200);
            } catch {}
            detach();
        }

        let isSelectingForm = false;
        function onMouseDownForm(e) {
            const card = overlay.querySelector('.modal-card');
            if (card && card.contains(e.target)) { isSelectingForm = true; }
        }
        function onMouseUpForm() { isSelectingForm = false; }
        function onClick(e) {
            if (e.target.dataset.action === 'cancel') {
                // Sempre permitir cancelar a operação (fecha o modal)
                return close();
            }
            if (isSelectingForm) return; // não fechar durante seleção
            if (e.target === overlay) {
                if (!lockClose) { return close(); }
                return; // travado: não fecha por overlay
            }
        }

        async function onFormSubmit(e) {
            if (!onSubmit) return;
            e.preventDefault();
            try {
                const form = e.target;
                await onSubmit(form, close);
            } catch (err) {
                console.error('showFormModal onSubmit error:', err);
            }
        }

        function onKey(e) {
            if (e.key === 'Escape') {
                if (!lockClose) {
                    e.preventDefault();
                    close();
                } else {
                    e.preventDefault();
                }
            }
        }

        function detach() {
            overlay.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKey, true);
            const form = card.querySelector('#__formModal');
            if (form) form.removeEventListener('submit', onFormSubmit);
        }

        overlay.addEventListener('mousedown', onMouseDownForm, true);
        overlay.addEventListener('mouseup', onMouseUpForm, true);
        overlay.addEventListener('click', onClick);
        document.addEventListener('keydown', onKey, true);
        const formEl = card.querySelector('#__formModal');
        if (formEl) formEl.addEventListener('submit', onFormSubmit);
        document.body.appendChild(overlay);

        return { close, el: overlay };
    }

    window.showFormModal = showFormModal;
})();


