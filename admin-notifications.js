// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

// Notification Structure:
// { id, type, message, contentType, contentId, createdBy, createdAt, read, linkSection }

function getNotifications() {
    return JSON.parse(localStorage.getItem('adminNotifications') || '[]');
}

function saveNotifications(notifications) {
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function addNotification(notification) {
    const notifications = getNotifications();
    notification.id = Date.now();
    notification.createdAt = new Date().toISOString();
    notification.read = false;

    // Add to beginning of array
    notifications.unshift(notification);

    // Keep max 50 notifications
    if (notifications.length > 50) {
        notifications.pop();
    }

    saveNotifications(notifications);
    showNotificationToast(notification);
}

function markAsRead(id) {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        saveNotifications(notifications);
        renderNotificationsDropdown();
    }
}

function markAllAsRead() {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
    renderNotificationsDropdown();
}

function getUnreadCount() {
    const notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
}

function updateNotificationBadge() {
    const count = getUnreadCount();
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Show little toast when notification happens
function showNotificationToast(notification) {
    // Only show if user is logged in
    if (!getCurrentUser()) return;

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-icon">🔔</div>
        <div class="toast-content">
            <div class="toast-message">${notification.message}</div>
            <div class="toast-time">Just now</div>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Render dropdown content
function renderNotificationsDropdown() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    const notifications = getNotifications();

    if (notifications.length === 0) {
        container.innerHTML = '<div class="notification-empty">No notifications yet</div>';
        return;
    }

    container.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="handleNotificationClick(${n.id}, '${n.linkSection}')">
            <div class="notification-icon">
                ${getNotificationIcon(n.type)}
            </div>
            <div class="notification-content">
                <div class="notification-message">${n.message}</div>
                <div class="notification-time">${formatTimeAgo(n.id)}</div>
            </div>
            ${!n.read ? '<div class="notification-dot"></div>' : ''}
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    switch (type) {
        case 'content_created': return '📝';
        case 'content_approved': return '✅';
        case 'user_added': return '👤';
        case 'content_deleted': return '🗑️';
        default: return '📢';
    }
}

function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// Handle clicking a notification
window.handleNotificationClick = function (id, section) {
    markAsRead(id);

    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.remove('show');

    // Navigate
    if (section) {
        const link = document.querySelector(`[data-section="${section}"]`);
        if (link) {
            link.click();
            // Scroll to top of section
            document.getElementById(`admin-${section}`).scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Toggle dropdown
window.toggleNotifications = function (event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
        renderNotificationsDropdown();
    }
}

// Close when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    const bellBtn = document.getElementById('notificationBtn');

    if (dropdown && dropdown.classList.contains('show') &&
        !dropdown.contains(event.target) &&
        !bellBtn.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Hook into actions to generate notifications
(function () {
    // We'll hook into addContentItem and updateContentItem manually 
    // where they calculate metrics, to also trigger notifications

    const originalAddContentItem = window.addContentItem;

    window.addContentItem = function (type, item) {
        originalAddContentItem.apply(this, [type, item]);

        // Notify super admins about new drafts
        if (item.status === 'draft') {
            addNotification({
                type: 'content_created',
                message: `New ${type.slice(0, -1)} "${item.title}" submitted for review`,
                contentType: type,
                linkSection: type,
                createdBy: getCurrentUser().id
            });
        }
        // Notify about published content
        else if (item.status === 'published') {
            addNotification({
                type: 'content_created',
                message: `New ${type.slice(0, -1)} "${item.title}" published`,
                contentType: type,
                linkSection: type,
                createdBy: getCurrentUser().id
            });
        }
    };

    // Hook into updateContentItem to track approvals
    const originalUpdateContentItem = window.updateContentItem;
    window.updateContentItem = function (type, index, item) {
        const oldItem = contentData[type][index];
        const wasDraft = oldItem && oldItem.status === 'draft';
        const isNowPublished = item.status === 'published';

        originalUpdateContentItem.apply(this, [type, index, item]);

        // Track approvals
        if (wasDraft && isNowPublished) {
            addNotification({
                type: 'content_approved',
                message: `${type.slice(0, -1)} "${item.title}" was approved`,
                contentType: type,
                linkSection: type,
                createdBy: getCurrentUser().id
            });
        }
    };
})();

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    updateNotificationBadge();
});

console.log('Notification system initialized');
