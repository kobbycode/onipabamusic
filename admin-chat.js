// ==========================================
// CHAT & MODERATION MANAGEMENT (Firestore)
// ==========================================

// Global state for chat management
window.chatData = {
    channels: [],
    members: []
};

// Render Channels Table
window.renderChannels = async function () {
    const tbody = document.getElementById('channelsTableBody');

    // Fetch channels from a dedicated 'channels' collection
    try {
        const snapshot = await db.collection('channels').orderBy('name', 'asc').get();
        window.chatData.channels = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching channels:", error);
    }

    if (!window.chatData.channels || window.chatData.channels.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No channels found. Create one!</td></tr>';
        return;
    }

    tbody.innerHTML = window.chatData.channels.map((channel, index) => {
        const iconHtml = channel.iconUrl
            ? `<img src="${channel.iconUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
            : '<div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 50%; color: var(--color-gold-primary); font-weight: bold; border: 1px solid rgba(212,175,55,0.2);">#</div>';

        return `
            <tr>
                <td data-label="Channel">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        ${iconHtml}
                        <div>
                            <div style="font-weight: 600; color: white; font-size: 1rem;">${channel.name}</div>
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: monospace;">id: ${channel.id}</div>
                        </div>
                    </div>
                </td>
                <td data-label="Description">
                    <div style="color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.4; max-width: 400px;">
                        ${channel.description || 'No description set'}
                    </div>
                </td>
                <td data-label="Actions" style="text-align: right;">
                    <div class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn-icon btn-edit" onclick="window.showChannelForm(${index})" title="Edit Channel" style="background: rgba(255,255,255,0.05);">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.deleteChannel('${channel.id}')" title="Delete Channel" style="background: rgba(239, 68, 68, 0.1);">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Show/Hide Channel Form
window.showChannelForm = function (index = null) {
    const form = document.getElementById('channelForm');
    const formTitle = document.getElementById('channelFormTitle');
    const formElement = document.getElementById('channelFormElement');
    const preview = document.getElementById('channelIconPreview');
    const previewImg = document.getElementById('iconPreviewImg');

    if (index !== null && window.chatData.channels[index]) {
        const channel = window.chatData.channels[index];
        formTitle.textContent = 'Edit Channel';
        document.getElementById('channelId').value = channel.id;
        document.getElementById('channelName').value = channel.name;
        document.getElementById('channelDescription').value = channel.description || '';

        if (channel.iconUrl) {
            previewImg.src = channel.iconUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    } else {
        formTitle.textContent = 'Create New Channel';
        formElement.reset();
        document.getElementById('channelId').value = '';
        preview.style.display = 'none';
    }

    form.style.display = 'block';
}

// Add preview listener
document.addEventListener('DOMContentLoaded', () => {
    const iconInput = document.getElementById('channelIcon');
    const preview = document.getElementById('channelIconPreview');
    const previewImg = document.getElementById('iconPreviewImg');

    if (iconInput) {
        iconInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

window.hideChannelForm = function () {
    document.getElementById('channelForm').style.display = 'none';
    document.getElementById('channelFormElement').reset();
    document.getElementById('channelIconPreview').style.display = 'none';
}

// Save Channel
window.saveChannel = async function (event) {
    event.preventDefault();
    const idInput = document.getElementById('channelId').value;
    const name = document.getElementById('channelName').value.trim();
    const description = document.getElementById('channelDescription').value.trim();
    const fileInput = document.getElementById('channelIcon');
    const file = fileInput.files[0];

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    if (!name) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    // Slugify name for ID if new, otherwise use existing
    const id = idInput || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
        let iconUrl = '';

        // Handle image upload if a new file is picked
        if (file) {
            const storageRef = firebase.storage().ref(`channels/${id}/icon_${Date.now()}`);
            const uploadTask = await storageRef.put(file);
            iconUrl = await uploadTask.ref.getDownloadURL();
        } else if (idInput) {
            // Keep existing icon if editing and no new file
            const existing = window.chatData.channels.find(c => c.id === idInput);
            iconUrl = existing ? existing.iconUrl : '';
        }

        const data = {
            name: name,
            description: description,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (iconUrl) {
            data.iconUrl = iconUrl;
        }

        await db.collection('channels').doc(id).set(data, { merge: true });

        hideChannelForm();
        renderChannels();
        alert(`Channel #${name} saved successfully!`);
    } catch (error) {
        console.error("Error saving channel:", error);
        alert("Failed to save channel: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Delete Channel
window.deleteChannel = async function (id) {
    const doDelete = async () => {
        try {
            await db.collection('channels').doc(id).delete();
            renderChannels();
        } catch (error) {
            console.error("Error deleting channel:", error);
            alert("Error: " + error.message);
        }
    };

    if (window.showConfirm) {
        window.showConfirm(`Are you sure you want to delete the #${id} channel? All messages will remain in history but the channel will be removed from navigation.`, doDelete);
    } else {
        if (confirm(`Delete #${id} channel?`)) {
            doDelete();
        }
    }
}

// Switch Tabs
window.switchChatTab = function (tab, element) {
    // UI Update: Toggle tab content
    document.querySelectorAll('.chat-tab-content').forEach(c => c.style.display = 'none');
    const targetTab = document.getElementById(`chat-${tab}-tab`);
    if (targetTab) targetTab.style.display = 'block';

    // UI Update: Toggle active class on tab buttons
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    // Load Data
    if (tab === 'channels') renderChannels();
    if (tab === 'moderation') renderModeration();
}

// Render User Moderation
window.renderModeration = async function () {
    const tbody = document.getElementById('moderationTableBody');

    try {
        const snapshot = await db.collection('users').orderBy('name', 'asc').get();
        window.chatData.members = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching members:", error);
    }

    if (!window.chatData.members || window.chatData.members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = window.chatData.members.map((user) => `
        <tr>
            <td data-label="Member">${user.name || 'Unnamed'}</td>
            <td data-label="Email">${user.email}</td>
            <td data-label="Role"><span class="badge ${user.role === 'superadmin' ? 'badge-primary' : 'badge-secondary'}">${user.role || 'member'}</span></td>
            <td data-label="Status">
                <span class="badge ${user.isBlocked ? 'badge-danger' : 'badge-success'}" 
                      style="background: ${user.isBlocked ? '#ff4444' : '#22c55e'}; color: #000; font-weight: 700;">
                    ${user.isBlocked ? 'Blocked' : 'Active'}
                </span>
            </td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-admin-${user.isBlocked ? 'secondary' : 'danger'}" 
                        onclick="window.toggleBlockUser('${user.id}', ${!!user.isBlocked})"
                        style="padding: 4px 12px; font-size: 0.8rem;">
                    ${user.isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Toggle Block User
window.toggleBlockUser = async function (uid, currentlyBlocked) {
    const action = currentlyBlocked ? 'unblock' : 'block';

    const doToggle = async () => {
        try {
            await db.collection('users').doc(uid).update({
                isBlocked: !currentlyBlocked
            });
            renderModeration();
        } catch (error) {
            console.error(`Error ${action}ing user:`, error);
            alert(`Failed to ${action} user.`);
        }
    };

    if (window.showConfirm) {
        window.showConfirm(`Are you sure you want to ${action} this user? ${!currentlyBlocked ? 'They will no longer be able to send messages.' : 'They will regain chat access.'}`, doToggle);
    } else {
        if (confirm(`Confirm ${action}?`)) doToggle();
    }
}
