import { uiManager } from './ui-manager.js';

export class AuthManager {
    constructor() {
        if (AuthManager.instance) {
            return AuthManager.instance;
        }
        AuthManager.instance = this;

        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.user = null;
        this.userRole = null;
        this.isInitialized = false;

        // Queue of callbacks waiting for auth init
        this.initCallbacks = [];

        this.init();
    }

    init() {
        console.log('[AuthManager] Initializing...');
        // Enforce Local Persistence
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                this.monitorSession();
            })
            .catch(error => {
                console.error('[AuthManager] Persistence Error:', error);
                this.showError('Auth Configuration Error', error.message);
            });
    }

    monitorSession() {
        this.auth.onAuthStateChanged(async (user) => {
            console.log('[AuthManager] State Changed:', user ? user.email : 'No User');

            if (user) {
                this.user = user;
                try {
                    // 1. Try UID Lookup (Standard)
                    let doc = await this.db.collection('users').doc(user.uid).get();

                    if (doc.exists) {
                        this.userRole = (doc.data().role || 'member').toLowerCase();
                        console.log('[AuthManager] Role found via UID:', this.userRole);
                    } else {
                        // 2. Fallback: Email Lookup (for manual admin-created accounts)
                        console.log('[AuthManager] UID lookup failed, trying email fallback...', user.email);
                        const snapshot = await this.db.collection('users')
                            .where('email', '==', user.email)
                            .get();

                        if (!snapshot.empty) {
                            // If multiple found, prioritize highest role
                            const roles = snapshot.docs.map(d => (d.data().role || 'member').toLowerCase());
                            if (roles.includes('superadmin')) this.userRole = 'superadmin';
                            else if (roles.includes('admin')) this.userRole = 'admin';
                            else this.userRole = 'member';

                            console.log('[AuthManager] Role found via Email Fallback:', this.userRole);
                        } else {
                            console.warn('[AuthManager] No user profile found via UID or Email.');
                            this.userRole = 'member';
                        }
                    }
                    this.finishInit(true);
                } catch (error) {
                    console.error('[AuthManager] Profile Fetch Error:', error);
                    this.showError('Profile Error', 'Could not load user profile. ' + error.message);
                    this.finishInit(false);
                }
            } else {
                this.user = null;
                this.userRole = null;
                this.finishInit(false);
            }
        });
    }

    finishInit(isAuthenticated) {
        this.isInitialized = true;

        // Hide loading overlays
        const loader = document.getElementById('auth-loading-overlay');
        if (loader) loader.style.display = 'none';

        // Execute queued callbacks
        this.initCallbacks.forEach(cb => cb(this.user));
        this.initCallbacks = [];

        // Handle page protection
        this.enforceProtection(isAuthenticated);
    }

    enforceProtection(isAuthenticated) {
        const path = window.location.pathname;
        const isLoginPage = path.includes('login.html') || path.includes('signup.html');
        const isDashboard = path.includes('dashboard.html') || path.endsWith('/admin');
        const isProfilePage = path.includes('profile.html');

        console.log('[AuthManager] Enforcing protection. Path:', path, 'Auth:', isAuthenticated);

        if (isAuthenticated) {
            // Logged in: Redirect AWAY from login/signup
            if (isLoginPage) {
                this.redirectBasedOnRole();
            }
            // Update UI
            this.updateUI();
        } else {
            // Not logged in: Redirect AWAY from protected pages
            if (isDashboard || isProfilePage) {
                console.warn('[AuthManager] Protected page access denied. Redirecting to login.');
                // Save intended destination
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                window.location.href = 'login.html';
            }
        }
    }

    redirectBasedOnRole() {
        console.log('[AuthManager] Redirecting based on role:', this.userRole);

        const intendedPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');

        if (this.userRole === 'admin' || this.userRole === 'superadmin') {
            if (intendedPath && (intendedPath.includes('dashboard.html') || intendedPath.includes('chat.html') || intendedPath.includes('/admin'))) {
                window.location.href = intendedPath;
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Member/Default
            if (intendedPath && intendedPath.includes('profile.html')) {
                window.location.href = intendedPath;
            } else {
                window.location.href = 'profile.html';
            }
        }
    }

    updateUI() {
        // Update Dashboard Name
        const nameEl = document.getElementById('currentUserName');
        if (nameEl && this.user) nameEl.textContent = this.user.email;

        // Update Header Button
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <circle cx="10" cy="6" r="4" stroke-width="1.5" />
                    <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke-width="1.5" stroke-linecap="round" />
                </svg>
                Profile
            `;
            loginBtn.href = 'profile.html';
        }

        // Init Profile Page specific logic
        if (window.initProfilePage && this.user) {
            window.initProfilePage(this.user);
        }
    }

    // Public API
    async login(email, password) {
        try {
            this.showLoading('Signing in...');
            await this.auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            this.hideLoading();
            console.error('[AuthManager] Login Failed:', error);
            this.showError('Login Failed', error.message);
        }
    }

    async signup(name, email, password) {
        try {
            this.showLoading('Creating account...');
            const cred = await this.auth.createUserWithEmailAndPassword(email, password);

            // Create Profile
            await this.db.collection('users').doc(cred.user.uid).set({
                name: name,
                email: email,
                role: 'member',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // onAuthStateChanged will redirect
        } catch (error) {
            this.hideLoading();
            console.error('[AuthManager] Signup Failed:', error);
            this.showError('Signup Failed', error.message);
        }
    }

    async logout() {
        try {
            await this.auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('[AuthManager] Logout Error:', error);
            this.showError('Logout Error', error.message);
        }
    }

    // UI Helpers
    showLoading(msg) {
        const btn = document.querySelector('.login-btn') || document.querySelector('.auth-btn');
        if (btn) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = msg;
            btn.disabled = true;
        }
    }

    hideLoading() {
        const btn = document.querySelector('.login-btn') || document.querySelector('.auth-btn');
        if (btn && btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
            btn.disabled = false;
        }
    }

    showError(title, message) {
        // Use global uiManager logic
        uiManager.showAlert(`${title}: ${message}`, 'error');
    }

    /**
     * Ensure we don't run logic until auth is ready
     */
    onReady(callback) {
        if (this.isInitialized) {
            callback(this.user);
        } else {
            this.initCallbacks.push(callback);
        }
    }
}

// Export singleton
export const authManager = new AuthManager();
