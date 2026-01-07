// ==========================================
// USER MANAGEMENT FUNCTIONS (Firestore)
// ==========================================

// Render Users Table
window.renderUsers = async function () {
    const tbody = document.getElementById('usersTableBody');
    // Ensure fetchCollection exists or define it (assuming admin.js loaded)
    if (typeof fetchCollection === 'function') {
        await fetchCollection('users');
    }

    if (!contentData.users || contentData.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = contentData.users.map((user, index) => `
        <tr>
            <td data-label="User">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--color-gold-primary); font-weight: 600; font-size: 0.9rem;">
                        ${(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span>${user.name}</span>
                </div>
            </td>
            <td data-label="Email">${user.email}</td>
            <td data-label="Role"><span class="badge ${user.role === 'superadmin' ? '' : 'badge-secondary'}">${user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span></td>
            <td data-label="Created">${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showUserForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show/Hide User Form
window.showUserForm = function (index = null) {
    const form = document.getElementById('userForm');
    const formTitle = document.getElementById('userFormTitle');
    const userFormElement = document.getElementById('userFormElement');

    if (index !== null && contentData.users[index]) {
        // Edit mode
        formTitle.textContent = 'Edit User';
        const user = contentData.users[index];
        document.getElementById('userIndex').value = index;
        if (document.getElementById('userId')) document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current';
        document.getElementById('userPassword').required = false;
        document.getElementById('userRole').value = user.role;
    } else {
        // Add mode
        formTitle.textContent = 'Add New User';
        userFormElement.reset();
        document.getElementById('userIndex').value = '';
        if (document.getElementById('userId')) document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('userPassword').placeholder = 'Min. 6 characters';
    }

    form.style.display = 'block';
    document.getElementById('usersList').style.display = 'none';
}

window.hideUserForm = function () {
    document.getElementById('userForm').style.display = 'none';
    document.getElementById('usersList').style.display = 'block';
    document.getElementById('userFormElement').reset();
}

// Save User
window.saveUser = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-admin-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const idInput = document.getElementById('userId');
    const id = idInput ? idInput.value : '';

    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;

    const user = {
        name,
        email,
        role,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // NOTE: Password handling is omitted for Firestore metadata storage.

    try {
        if (id) {
            await db.collection('users').doc(id).update(user);
        } else {
            user.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').add(user);
            uiManager.showAlert("User record created.", 'success');
        }
        hideUserForm();
        renderUsers();
    } catch (e) {
        console.error(e);
        uiManager.showAlert("Error saving user: " + e.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Delete User
window.deleteUser = function (id) {
    const doDelete = async () => {
        try {
            await db.collection('users').doc(id).delete();
            renderUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            uiManager.showAlert("Error: " + error.message, 'error');
        }
    };

    uiManager.showConfirm('Are you sure you want to delete this user metadata?', doDelete);
}

// Initialize users on section load
document.addEventListener('DOMContentLoaded', function () {
    const usersLink = document.querySelector('[data-section="users"]');
    if (usersLink) {
        usersLink.addEventListener('click', renderUsers);
    }
});
