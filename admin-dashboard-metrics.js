// ==========================================
// DASHBOARD METRICS CALCULATOR
// ==========================================
// Calculates and displays real-time statistics for the dashboard

async function updateDashboardMetrics() {
    const statsContainer = document.querySelector('.dashboard-stats');
    if (!statsContainer) return;

    try {
        // Fetch all counts in parallel
        const collections = ['videos', 'audios', 'pdfs', 'news', 'inquiries', 'subscribers', 'users'];
        const results = await Promise.all(
            collections.map(coll => db.collection(coll).get())
        );

        const counts = {};
        collections.forEach((coll, index) => {
            counts[coll] = results[index].size;
        });

        // Calculate drafts and published
        let totalDrafts = 0;
        let totalPublished = 0;

        results.slice(0, 4).forEach(snapshot => {
            snapshot.forEach(doc => {
                if (doc.data().status === 'draft') {
                    totalDrafts++;
                } else {
                    totalPublished++;
                }
            });
        });

        // Generate HTML with IDs for consistency
        let html = `
            <div class="stat-card">
                <div class="stat-number" id="stat-videos">${counts.videos}</div>
                <div class="stat-label">TOTAL VIDEOS</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="stat-audios">${counts.audios}</div>
                <div class="stat-label">TOTAL AUDIOS</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="stat-pdfs">${counts.pdfs}</div>
                <div class="stat-label">TOTAL PDFS</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="stat-news">${counts.news}</div>
                <div class="stat-label">TOTAL NEWS</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #ffc107;">
                <div class="stat-number" id="stat-drafts">${totalDrafts}</div>
                <div class="stat-label">PENDING DRAFTS</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #28a745;">
                <div class="stat-number" id="stat-published">${totalPublished}</div>
                <div class="stat-label">PUBLISHED ITEMS</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="stat-inquiries">${counts.inquiries}</div>
                <div class="stat-label">INQUIRIES</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="stat-subscribers">${counts.subscribers}</div>
                <div class="stat-label">SUBSCRIBERS</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid var(--color-gold-primary);">
                <div class="stat-number" id="stat-users">${counts.users}</div>
                <div class="stat-label">TOTAL USERS</div>
            </div>
        `;

        statsContainer.innerHTML = html;
        console.log('Dashboard metrics updated with live data');
    } catch (error) {
        console.error('Error updating dashboard metrics:', error);
    }
}

// Hook into rendering functions to update metrics automatically
(function () {
    // We override the render functions again to trigger metric updates
    // This is safe because we can chain them

    const triggerUpdate = () => {
        setTimeout(updateDashboardMetrics, 100);
    };

    // Listen for data changes
    const originalUpdateContentItem = window.updateContentItem;
    const originalAddContentItem = window.addContentItem;
    const originalDeleteContentItem = window.deleteContentItem;

    window.updateContentItem = function (...args) {
        originalUpdateContentItem.apply(this, args);
        triggerUpdate();
    };

    window.addContentItem = function (...args) {
        originalAddContentItem.apply(this, args);
        triggerUpdate();
    };

    window.deleteContentItem = function (...args) {
        originalDeleteContentItem.apply(this, args);
        triggerUpdate();
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
    // Wait a bit for data to load
    setTimeout(updateDashboardMetrics, 500);
});

console.log('Dashboard metrics initialized');
