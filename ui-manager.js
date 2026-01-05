
// ==========================================
// GLOBAL UI MANAGER (Alerts & Confirmations)
// ==========================================

export const uiManager = {
    // Show custom alert modal
    showAlert(message, type = 'info') {
        // Remove existing alert if any
        const existingAlert = document.getElementById('customAlertModal');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Determine icon and color based on type
        let icon, colorClass;
        switch (type) {
            case 'success':
                icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#22c55e" stroke-width="3">
                            <circle cx="24" cy="24" r="20"/>
                            <path d="M14 24L20 30L34 16" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;
                colorClass = 'alert-success';
                break;
            case 'error':
                icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#ef4444" stroke-width="3">
                            <circle cx="24" cy="24" r="20"/>
                            <line x1="16" y1="16" x2="32" y2="32" stroke-linecap="round"/>
                            <line x1="32" y1="16" x2="16" y2="32" stroke-linecap="round"/>
                        </svg>`;
                colorClass = 'alert-error';
                break;
            case 'warning':
                icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#eab308" stroke-width="3">
                            <path d="M24 4L44 40H4L24 4Z"/>
                            <line x1="24" y1="18" x2="24" y2="28" stroke-linecap="round"/>
                            <circle cx="24" cy="34" r="1.5" fill="#eab308"/>
                        </svg>`;
                colorClass = 'alert-warning';
                break;
            default:
                icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#3b82f6" stroke-width="3">
                            <circle cx="24" cy="24" r="20"/>
                            <line x1="24" y1="16" x2="24" y2="26" stroke-linecap="round"/>
                            <circle cx="24" cy="32" r="1.5" fill="#3b82f6"/>
                        </svg>`;
                colorClass = 'alert-info';
        }

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'customAlertModal';
        modal.className = 'custom-alert-overlay'; // Requires CSS in styles.css
        modal.innerHTML = `
            <div class="custom-alert-modal ${colorClass}">
                <div class="alert-icon">${icon}</div>
                <div class="alert-message">${message}</div>
                <button class="alert-close-btn" id="btnAlertClose">OK</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Event Listener
        document.getElementById('btnAlertClose').onclick = () => this.closeAlert();

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    },

    closeAlert() {
        const modal = document.getElementById('customAlertModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    },

    // Show custom confirm modal
    // Returns a Promise if no callback is provided, or executes callback
    showConfirm(message, onConfirm) {
        return new Promise((resolve) => {
            // Remove existing modal if any
            const existingModal = document.getElementById('customConfirmModal');
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.id = 'customConfirmModal';
            modal.className = 'custom-alert-overlay';
            modal.innerHTML = `
                <div class="custom-alert-modal alert-warning">
                    <div class="alert-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#eab308" stroke-width="3">
                            <circle cx="24" cy="24" r="20"/>
                            <path d="M24 14V28" stroke-linecap="round"/>
                            <circle cx="24" cy="34" r="1.5" fill="#eab308"/>
                        </svg>
                    </div>
                    <div class="alert-message">${message}</div>
                    <div class="alert-actions">
                        <button class="alert-btn-cancel" id="btnConfirmCancel">Cancel</button>
                        <button class="alert-btn-confirm" id="btnConfirmAction">Yes, Proceed</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Event Listeners
            document.getElementById('btnConfirmAction').onclick = () => {
                this.closeConfirm();
                if (onConfirm) onConfirm();
                resolve(true);
            };

            document.getElementById('btnConfirmCancel').onclick = () => {
                this.closeConfirm();
                resolve(false);
            };

            // Animate in
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
        });
    },

    closeConfirm() {
        const modal = document.getElementById('customConfirmModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
};

// ==========================================
// WINDOW EXPORTS (For backward compatibility)
// ==========================================
window.uiManager = uiManager;
window.showAlert = (msg, type) => uiManager.showAlert(msg, type);
window.showConfirm = (msg, cb) => uiManager.showConfirm(msg, cb);
window.closeAlert = () => uiManager.closeAlert();
window.closeConfirm = () => uiManager.closeConfirm();

// Override Native Alert
window.alert = (msg) => uiManager.showAlert(msg, 'info');

console.log('[UIManager] Global Alerts Initialized');
