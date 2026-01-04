// ==========================================
// CUSTOM ALERT MODAL & LOADING STATES
// ==========================================

// Create and show custom alert modal
function showAlert(message, type = 'info') {
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
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert-modal ${colorClass}">
            <div class="alert-icon">${icon}</div>
            <div class="alert-message">${message}</div>
            <button class="alert-close-btn" onclick="closeAlert()">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Close alert modal
function closeAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Create and show custom confirm modal
window.showConfirm = function (message, onConfirm) {
    // Remove existing modal if any
    const existingModal = document.getElementById('customConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.className = 'custom-alert-overlay'; // Reuse same overlay class
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
                <button class="alert-btn-cancel" onclick="closeConfirm()">Cancel</button>
                <button class="alert-btn-confirm" id="confirmBtnAction">Yes, Proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    document.getElementById('confirmBtnAction').addEventListener('click', function () {
        closeConfirm();
        if (onConfirm) onConfirm();
    });

    // Animate in
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
};

// Close confirm modal
window.closeConfirm = function () {
    const modal = document.getElementById('customConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Override native alert
window.alert = function (message) {
    showAlert(message, 'info');
};

// Enhanced alert function with types
window.showSuccessAlert = function (message) {
    showAlert(message, 'success');
};

window.showErrorAlert = function (message) {
    showAlert(message, 'error');
};

window.showWarningAlert = function (message) {
    showAlert(message, 'warning');
};

// ==========================================
// BUTTON LOADING STATES
// ==========================================

// Show loading state on button
function setButtonLoading(button, isLoading = true) {
    if (!button) return;

    if (isLoading) {
        // Store original content
        button.dataset.originalContent = button.innerHTML;
        button.disabled = true;
        button.classList.add('btn-loading');

        // Add spinner
        button.innerHTML = `
            <span class="btn-spinner"></span>
            <span style="margin-left: 0.5rem;">Loading...</span>
        `;
    } else {
        // Restore original content
        button.disabled = false;
        button.classList.remove('btn-loading');
        if (button.dataset.originalContent) {
            button.innerHTML = button.dataset.originalContent;
        }
    }
}

// Helper to wrap async button clicks with loading state
function handleAsyncButtonClick(button, asyncFunction) {
    setButtonLoading(button, true);

    Promise.resolve(asyncFunction())
        .finally(() => {
            setButtonLoading(button, false);
        });
}

console.log('Custom alert modal and loading states initialized');
