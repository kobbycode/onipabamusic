// ==========================================
// WEBSITE SETTINGS - HEADER NAV MANAGEMENT
// ==========================================

// Show/Hide Nav Link Form
function showNavLinkForm(index = null) {
    const form = document.getElementById('navLinkForm');
    const formTitle = document.getElementById('navLinkFormTitle');
    const navLinkFormElement = document.getElementById('navLinkFormElement');

    if (index !== null && contentData.navLinks && contentData.navLinks[index]) {
        // Edit mode
        formTitle.textContent = 'Edit Navigation Link';
        const navLink = contentData.navLinks[index];
        document.getElementById('navLinkIndex').value = index;
        document.getElementById('navLinkText').value = navLink.text;
        document.getElementById('navLinkUrl').value = navLink.url;
    } else {
        // Add mode
        formTitle.textContent = 'Add Navigation Link';
        navLinkFormElement.reset();
        document.getElementById('navLinkIndex').value = '';
    }

    form.style.display = 'block';
    document.getElementById('navLinksList').style.display = 'none';
}

function hideNavLinkForm() {
    document.getElementById('navLinkForm').style.display = 'none';
    document.getElementById('navLinksList').style.display = 'block';
    document.getElementById('navLinkFormElement').reset();
}

// Save Nav Link (Add or Update)
function saveNavLink(event) {
    event.preventDefault();

    if (!contentData.navLinks) {
        contentData.navLinks = [];
    }

    const index = document.getElementById('navLinkIndex').value;
    const navLink = {
        text: document.getElementById('navLinkText').value,
        url: document.getElementById('navLinkUrl').value,
        id: index !== '' ? contentData.navLinks[index].id : Date.now()
    };

    if (index !== '') {
        updateContentItem('navLinks', parseInt(index), navLink);
    } else {
        addContentItem('navLinks', navLink);
    }

    hideNavLinkForm();
    renderNavLinks();
}

// Delete Nav Link
function deleteNavLink(index) {
    uiManager.showConfirm('Are you sure you want to delete this navigation link?', function () {
        deleteContentItem('navLinks', index);
        renderNavLinks();
    });
}

// Render Nav Links Table
function renderNavLinks() {
    const tbody = document.getElementById('navLinksTableBody');
    const emptyState = document.getElementById('navLinksEmptyState');
    const table = document.querySelector('#navLinksList .admin-table');

    if (!contentData.navLinks || contentData.navLinks.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = contentData.navLinks.map((navLink, index) => `
        <tr>
            <td><strong>${navLink.text}</strong></td>
            <td>${navLink.url}</td>
            <td class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showNavLinkForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteNavLink(${index})" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Tab Switching logic
window.switchSettingsTab = function (tabName) {
    // Buttons
    document.querySelectorAll('#admin-settings .admin-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Content
    document.querySelectorAll('#admin-settings .settings-tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`settings-${tabName}`).style.display = 'block';
};

// ==========================================
// WEBSITE SETTINGS - FOOTER & SOCIAL MANAGEMENT
// ==========================================

// Load Settings (Footer & Social)
function loadSettings() {
    // Footer Settings
    if (contentData.footerSettings) {
        document.getElementById('footerTitle').value = contentData.footerSettings.title || '';
        document.getElementById('footerDescription').value = contentData.footerSettings.description || '';
        document.getElementById('footerNewsletter').value = contentData.footerSettings.newsletter || '';
        document.getElementById('footerCopyright').value = contentData.footerSettings.copyright || '';
    }

    // Social Settings
    if (contentData.socialSettings) {
        document.getElementById('socialFacebook').value = contentData.socialSettings.facebook || '';
        document.getElementById('socialTwitter').value = contentData.socialSettings.twitter || '';
        document.getElementById('socialInstagram').value = contentData.socialSettings.instagram || '';
        document.getElementById('socialYoutube').value = contentData.socialSettings.youtube || '';
    }
}

// Save Footer Settings
function saveFooterSettings(event) {
    event.preventDefault();

    contentData.footerSettings = {
        title: document.getElementById('footerTitle').value,
        description: document.getElementById('footerDescription').value,
        newsletter: document.getElementById('footerNewsletter').value,
        copyright: document.getElementById('footerCopyright').value
    };

    saveContentData();
    uiManager.showAlert('Footer settings saved successfully!', 'success');
}

// Save Social Settings
window.saveSocialSettings = function (event) {
    event.preventDefault();

    contentData.socialSettings = {
        facebook: document.getElementById('socialFacebook').value,
        twitter: document.getElementById('socialTwitter').value,
        instagram: document.getElementById('socialInstagram').value,
        youtube: document.getElementById('socialYoutube').value
    };

    saveContentData();
    uiManager.showAlert('Social media links saved successfully!', 'success');
};

// Helper to save content data to Firestore
async function saveContentData() {
    try {
        const batch = db.batch();
        const settingsRef = db.collection('settings').doc('general');

        // Prepare data
        const data = {};
        if (contentData.footerSettings) data.footerSettings = contentData.footerSettings;
        if (contentData.socialSettings) data.socialSettings = contentData.socialSettings;
        if (contentData.navLinks) data.navLinks = contentData.navLinks;

        batch.set(settingsRef, data, { merge: true });
        await batch.commit();
        console.log('Settings saved to Firestore');
    } catch (error) {
        console.error('Error saving settings:', error);
        uiManager.showAlert('Failed to save settings: ' + error.message, 'error');
    }
}

// Initialize Website Settings on section load
document.addEventListener('DOMContentLoaded', async function () {
    // Nav Links
    const settingsLink = document.querySelector('[data-section="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', async function () {
            // Load settings from Firestore if not already loaded
            if (!contentData.footerSettings || !contentData.socialSettings) {
                try {
                    const doc = await db.collection('settings').doc('general').get();
                    if (doc.exists) {
                        const data = doc.data();
                        contentData.footerSettings = data.footerSettings || {};
                        contentData.socialSettings = data.socialSettings || {};
                        contentData.navLinks = data.navLinks || [];
                    }
                } catch (e) {
                    console.error("Error loading initial settings:", e);
                }

                // Apply Defaults if empty (Migration Strategy)
                if (!contentData.navLinks || contentData.navLinks.length === 0) {
                    contentData.navLinks = [
                        { text: 'Home', url: 'index.html', id: 1 },
                        { text: 'About', url: 'about.html', id: 2 },
                        { text: 'Videos', url: 'videos.html', id: 3 },
                        { text: 'Audios', url: 'audios.html', id: 4 },
                        { text: 'PDFs', url: 'pdfs.html', id: 5 },
                        { text: 'News', url: 'news.html', id: 6 },
                        { text: 'Contact', url: 'contact.html', id: 7 },
                        { text: 'Chat', url: 'chat.html', id: 8 }
                    ];
                }
                if (!contentData.footerSettings || !contentData.footerSettings.title) {
                    contentData.footerSettings = {
                        title: 'Onipaba Music',
                        description: 'Touching souls and elevating spirits through the divine power of choral harmony. Join us in our musical journey.',
                        newsletter: 'Stay Updated',
                        copyright: '© 2025 Onipaba Music. All rights reserved.'
                    };
                }
                if (!contentData.socialSettings) {
                    contentData.socialSettings = {
                        facebook: 'https://facebook.com',
                        twitter: 'https://twitter.com',
                        instagram: 'https://instagram.com',
                        youtube: 'https://youtube.com'
                    };
                }
            }
            renderNavLinks();
            loadSettings();
        });
    }

    // Initial render if on settings section
    if (window.location.hash === '#settings') {
        const doc = await db.collection('settings').doc('general').get();
        if (doc.exists) {
            const data = doc.data();
            contentData.footerSettings = data.footerSettings || {};
            contentData.socialSettings = data.socialSettings || {};
            contentData.navLinks = data.navLinks || [];
        }
        renderNavLinks();
        loadSettings();
    }
});
