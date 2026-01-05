/**
 * Admin Inquiries & Subscribers Management
 */

// Initialize data if not present
if (!window.contentData) window.contentData = {};
window.contentData.inquiries = [];
window.contentData.subscribers = [];

// ==========================================
// INQUIRIES MANAGEMENT
// ==========================================

window.renderInquiries = async function () {
    console.log('Rendering Inquiries...');
    const tbody = document.getElementById('inquiriesTableBody');
    const emptyState = document.getElementById('inquiriesEmptyState');
    const listContainer = document.getElementById('inquiriesList');

    try {
        // Fetch inquiries from Firestore
        const snapshot = await firebase.firestore().collection('inquiries')
            .orderBy('timestamp', 'desc').get();

        window.contentData.inquiries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (window.contentData.inquiries.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            listContainer.querySelector('.admin-table').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        listContainer.querySelector('.admin-table').style.display = 'table';

        tbody.innerHTML = window.contentData.inquiries.map(item => {
            const date = item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Pending';
            const isRead = item.read === true;

            return `
                <tr class="${isRead ? 'row-read' : 'row-unread'}">
                    <td data-label="Name"><strong>${item.name}</strong></td>
                    <td data-label="Email">${item.email}</td>
                    <td data-label="Subject">${item.subject}</td>
                    <td data-label="Date">${date}</td>
                    <td data-label="Status">
                        <span class="badge ${isRead ? 'badge-secondary' : 'badge-primary'}">
                            ${isRead ? 'Read' : 'New'}
                        </span>
                    </td>
                    <td data-label="Actions" class="actions-cell">
                        <button class="btn-icon" onclick="viewInquiry('${item.id}')" title="View Message">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        ${!isRead ? `
                        <button class="btn-icon" onclick="markInquiryRead('${item.id}')" title="Mark as Read">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </button>` : ''}
                        <button class="btn-icon btn-delete" onclick="deleteInquiry('${item.id}')" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error rendering inquiries:", error);
    }
};

window.viewInquiry = function (id) {
    const inquiry = window.contentData.inquiries.find(i => i.id === id);
    if (!inquiry) return;

    const message = `
        <strong>From:</strong> ${inquiry.name} (${inquiry.email})<br>
        <strong>Subject:</strong> ${inquiry.subject}<br>
        <strong>Message:</strong><br>
        <p style="white-space: pre-wrap; margin-top: 10px; color: var(--color-text-primary); font-family: inherit;">${inquiry.message}</p>
    `;

    uiManager.showAlert(message, 'info');

    if (!inquiry.read) {
        markInquiryRead(id);
    }
};

window.markInquiryRead = async function (id) {
    try {
        await firebase.firestore().collection('inquiries').doc(id).update({
            read: true
        });
        window.renderInquiries();
    } catch (error) {
        console.error("Error marking inquiry read:", error);
    }
};

window.deleteInquiry = async function (id) {
    const doDelete = async () => {
        try {
            await firebase.firestore().collection('inquiries').doc(id).delete();
            window.renderInquiries();
        } catch (error) {
            console.error("Error deleting inquiry:", error);
        }
    };

    uiManager.showConfirm('Are you sure you want to delete this inquiry?', doDelete);
};

// ==========================================
// SUBSCRIBERS MANAGEMENT
// ==========================================

window.renderSubscribers = async function () {
    console.log('Rendering Subscribers...');
    const tbody = document.getElementById('subscribersTableBody');
    const emptyState = document.getElementById('subscribersEmptyState');
    const listContainer = document.getElementById('subscribersList');

    try {
        const snapshot = await firebase.firestore().collection('subscribers')
            .orderBy('subscribedAt', 'desc').get();

        window.contentData.subscribers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (window.contentData.subscribers.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            listContainer.querySelector('.admin-table').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        listContainer.querySelector('.admin-table').style.display = 'table';

        tbody.innerHTML = window.contentData.subscribers.map(sub => {
            const date = sub.subscribedAt ? new Date(sub.subscribedAt.seconds * 1000).toLocaleDateString() : 'Pending';

            return `
                <tr>
                    <td data-label="Email"><strong>${sub.email}</strong></td>
                    <td data-label="Date">${date}</td>
                    <td data-label="Status">
                        <span class="badge ${sub.active ? 'badge-success' : 'badge-secondary'}">
                            ${sub.active ? 'Subscribed' : 'Inactive'}
                        </span>
                    </td>
                    <td data-label="Actions" class="actions-cell">
                        <button class="btn-icon btn-delete" onclick="deleteSubscriber('${sub.id}')" title="Remove Subscriber">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error rendering subscribers:", error);
    }
};

window.deleteSubscriber = async function (id) {
    const doDelete = async () => {
        try {
            await firebase.firestore().collection('subscribers').doc(id).delete();
            window.renderSubscribers();
        } catch (error) {
            console.error("Error deleting subscriber:", error);
        }
    };

    uiManager.showConfirm('Are you sure you want to remove this subscriber?', doDelete);
};
