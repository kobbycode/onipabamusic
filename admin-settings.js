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
    if (window.showConfirm) {
        window.showConfirm('Are you sure you want to delete this navigation link?', function () {
            deleteContentItem('navLinks', index);
            renderNavLinks();
        });
    } else if (confirm('Are you sure you want to delete this navigation link?')) {
        deleteContentItem('navLinks', index);
        renderNavLinks();
    }
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

// ==========================================
// WEBSITE SETTINGS - FOOTER MANAGEMENT
// ==========================================

// Load Footer Settings into Form
function loadFooterSettings() {
    if (contentData.footerSettings) {
        document.getElementById('footerTitle').value = contentData.footerSettings.title || '';
        document.getElementById('footerDescription').value = contentData.footerSettings.description || '';
        document.getElementById('footerNewsletter').value = contentData.footerSettings.newsletter || '';
        document.getElementById('footerCopyright').value = contentData.footerSettings.copyright || '';
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
    alert('Footer settings saved successfully!');
}

// Initialize Website Settings on section load
document.addEventListener('DOMContentLoaded', function () {
    // Nav Links
    const settingsLink = document.querySelector('[data-section="settings"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', function () {
            renderNavLinks();
            loadFooterSettings();
        });
    }

    // Initial render if on settings section
    if (window.location.hash === '#settings') {
        renderNavLinks();
        loadFooterSettings();
    }
});
