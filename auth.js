import { authManager } from './auth-manager.js';
import { uiManager } from './ui-manager.js';

// ==========================================
// AUTH MANAGER BRIDGE
// This file connects global UI events to the AuthManager
// ==========================================

// Expose handlers to global scope for HTML onclick availability
window.handleLogin = function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    authManager.login(email, password);
};

window.handleSignup = function (event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        uiManager.showAlert('Passwords do not match', 'error');
        return;
    }

    authManager.signup(name, email, password);
};

window.logout = function () {
    uiManager.showConfirm('Are you sure you want to logout?', () => {
        authManager.logout();
    });
};

// Initial logs
console.log('[Auth Bridge] Auth Manager connected.');
