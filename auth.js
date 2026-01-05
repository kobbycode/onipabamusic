

// ==========================================
// AUTHENTICATION & SESSION MANAGEMENT (FIREBASE)
// ==========================================

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.querySelector('.login-btn');
    const originalText = btn.textContent;

    btn.textContent = 'Signing in...';
    btn.disabled = true;

    // Explicitly set persistence to LOCAL
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return firebase.auth().signInWithEmailAndPassword(email, password);
        })
        .then(async (userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('Login successful:', user.email);

            // Fetch user role from Firestore
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            if (userData && userData.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'profile.html';
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Login error:', errorCode, errorMessage);

            // Show error
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.textContent = 'Invalid email or password';
            errorMsg.classList.add('show');

            btn.textContent = originalText;
            btn.disabled = false;

            setTimeout(() => {
                errorMsg.classList.remove('show');
            }, 3000);
        });
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const btn = document.querySelector('.auth-btn');
    const originalText = btn.textContent;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    btn.textContent = 'Creating account...';
    btn.disabled = true;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Create user profile in Firestore
            await firebase.firestore().collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'member',
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Signup successful:', user.email);
            window.location.href = 'profile.html';
        })
        .catch((error) => {
            console.error('Signup error:', error.code, error.message);
            alert(error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        });
}

// Logout function
function logout() {
    const doLogout = () => {
        firebase.auth().signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error', error);
        });
    };

    if (window.showConfirm) {
        window.showConfirm('Are you sure you want to logout?', doLogout);
    } else {
        if (confirm('Are you sure you want to logout?')) {
            doLogout();
        }
    }
}

// Auth State Observer - Centralized Protection
firebase.auth().onAuthStateChanged((user) => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('login.html');
    const isSignupPage = path.includes('signup.html');
    const isDashboard = path.includes('dashboard.html') || path.endsWith('/admin') || path.includes('/admin/');
    const isProfilePage = path.includes('profile.html');

    console.log('[Auth Debug] Path:', path, '| User:', user ? user.email : 'No User', '| isDashboard:', isDashboard);

    // Update Header Login Button globally
    updateHeaderAuthUI(user);

    if (user) {
        // User is signed in
        if (isLoginPage || isSignupPage) {
            // Check role for redirect
            console.log('[Auth Debug] User on Auth Page, checking role...');
            firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
                const data = doc.data();
                console.log('[Auth Debug] Role:', data ? data.role : 'None');
                if (data && data.role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'profile.html';
                }
            });
        }

        // Update Dashboard UI
        if (isDashboard) {
            const nameEl = document.getElementById('currentUserName');
            if (nameEl) nameEl.textContent = user.email;
        }

        // Update Profile Page UI
        if (isProfilePage && window.initProfilePage) {
            window.initProfilePage(user);
        }
    } else {
        // No user is signed in
        if (isDashboard || isProfilePage) {
            console.log('[Auth Debug] Protected page accessed without user. (Redirect disabled for debugging)');
            // window.location.href = 'login.html'; // DISABLED FOR DEBUGGING
            const nameEl = document.getElementById('currentUserName');
            if (nameEl) nameEl.textContent = "Not Logged In (Debug Mode)";
        }
    }
});

// Update Header Auth UI (Login vs Profile)
function updateHeaderAuthUI(user) {
    const loginBtn = document.querySelector('.btn-login');
    if (!loginBtn) return;

    if (user) {
        loginBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5" />
                <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            Profile
        `;
        loginBtn.href = 'profile.html';
    } else {
        loginBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5" />
                <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            Login
        `;
        loginBtn.href = 'login.html';
    }
}

// Helper to get current user synchronously (might be null if auth not resolved)
function getCurrentUser() {
    return firebase.auth().currentUser;
}

