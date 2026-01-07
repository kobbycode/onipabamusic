// ==========================================
// TEAM MEMBER MANAGEMENT
// ==========================================

// Global object to store team data
if (!window.contentData) window.contentData = {};
window.contentData.team = [];

// Initialize Team Section
document.addEventListener('DOMContentLoaded', () => {
    // Add logic to load team when section is accessed?
    // Actually, dashboard.html needs a link to "Team" section first.
    // We will add that in dashboard.html modifications.
});


// Load Team Members
window.renderTeam = async function () {
    await fetchCollection('team');

    // Sort by order/priority if available, else by name
    if (contentData.team) {
        contentData.team.sort((a, b) => (a.order || 99) - (b.order || 99));
    }

    const tbody = document.getElementById('teamTableBody');
    const emptyState = document.getElementById('teamEmptyState');
    const table = document.querySelector('#teamList .admin-table');

    if (!contentData.team || contentData.team.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = contentData.team.map((member, index) => `
        <tr>
            <td data-label="Image">
                <img src="${member.image || 'images/logo-placeholder.png'}" 
                     alt="${member.name}" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td data-label="Name"><strong>${member.name}</strong></td>
            <td data-label="Role">${member.role}</td>
            <td data-label="Order">${member.order || '-'}</td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showTeamForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteTeamMember('${member.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}


// Show/Hide Form
window.showTeamForm = function (index = null) {
    const form = document.getElementById('teamForm');
    const formTitle = document.getElementById('teamFormTitle');
    const formElement = document.getElementById('teamFormElement');
    const submitBtn = formElement.querySelector('button[type="submit"]');

    window.currentTeamImageFile = null;

    if (index !== null && contentData.team[index]) {
        // Edit
        const member = contentData.team[index];
        formTitle.textContent = 'Edit Team Member';
        submitBtn.textContent = 'Update Member';

        document.getElementById('teamIndex').value = index;
        document.getElementById('teamId').value = member.id;
        document.getElementById('teamName').value = member.name;
        document.getElementById('teamRole').value = member.role;
        document.getElementById('teamOrder').value = member.order || '';
        document.getElementById('teamImageUrl').value = member.image || '';
        // Could show existing image preview here if we added an img element
    } else {
        // Add
        formTitle.textContent = 'Add Team Member';
        submitBtn.textContent = 'Save Member';
        formElement.reset();
        document.getElementById('teamIndex').value = '';
        document.getElementById('teamId').value = '';
    }

    form.style.display = 'block';
    document.getElementById('teamList').style.display = 'none';
}

window.hideTeamForm = function () {
    document.getElementById('teamForm').style.display = 'none';
    document.getElementById('teamList').style.display = 'block';
    document.getElementById('teamFormElement').reset();
    window.currentTeamImageFile = null;
}

// Save Team Member
window.saveTeamMember = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('teamId').value;
        let imageUrl = document.getElementById('teamImageUrl').value;

        // Handle Image Upload
        const fileInput = document.getElementById('teamImageFile');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`team/${Date.now()}_${file.name}`);
            await fileRef.put(file);
            imageUrl = await fileRef.getDownloadURL();
        }

        const member = {
            name: document.getElementById('teamName').value,
            role: document.getElementById('teamRole').value,
            order: parseInt(document.getElementById('teamOrder').value) || 99,
            image: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await db.collection('team').doc(id).update(member);
        } else {
            member.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('team').add(member);
        }

        uiManager.showToast('Team member saved successfully!', 'success');
        hideTeamForm();
        renderTeam();

    } catch (error) {
        console.error('Error saving team member:', error);
        uiManager.showAlert('Error saving team member: ' + error.message, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Delete Team Member
window.deleteTeamMember = function (id) {
    uiManager.showConfirm('Are you sure you want to delete this team member?', async () => {
        try {
            await db.collection('team').doc(id).delete();
            uiManager.showToast('Team member deleted', 'success');
            renderTeam();
        } catch (error) {
            console.error('Error deleting team member:', error);
            uiManager.showAlert('Error deleting: ' + error.message, 'error');
        }
    });
}
