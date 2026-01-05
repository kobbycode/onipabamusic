// ==========================================
// PDF MANAGEMENT FUNCTIONS (Firestore)
// ==========================================

// Handle PDF File Selection
window.handlePdfFileUpload = function (event) {
    const file = event.target.files[0];
    if (file) {
        window.currentPdfFile = file;
        // Detect size
        let sizeStr = (file.size / 1024).toFixed(1) + ' KB';
        if (file.size > 1024 * 1024) {
            sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        }
        document.getElementById('pdfSize').value = sizeStr;
        document.getElementById('pdfFileData').value = file.name;
    }
};

// Render PDFs Table
window.renderPdfs = async function () {
    // Ensure fetchCollection exists or define it (assuming admin.js loaded)
    if (typeof fetchCollection === 'function') {
        await fetchCollection('pdfs');
    } else {
        console.warn('fetchCollection not found');
    }

    const tbody = document.getElementById('pdfsTableBody');
    const emptyState = document.getElementById('pdfsEmptyState');
    const table = document.querySelector('#pdfsList .admin-table');

    if (!contentData.pdfs || contentData.pdfs.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = contentData.pdfs.map((pdf, index) => `
        <tr>
            <td data-label="Title"><strong>${pdf.title}</strong></td>
            <td data-label="Composer">${pdf.composedBy || '<span class="text-muted">N/A</span>'}</td>
            <td data-label="Description">${pdf.description}</td>
            <td data-label="Size"><span class="badge">📄 ${pdf.size}</span></td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showPdfForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deletePdf('${pdf.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show/Hide PDF Form
window.showPdfForm = function (index = null) {
    const form = document.getElementById('pdfForm');
    const formTitle = document.getElementById('pdfFormTitle');
    const pdfFormElement = document.getElementById('pdfFormElement');
    const submitBtn = pdfFormElement.querySelector('button[type="submit"]');

    if (index !== null && contentData.pdfs[index]) {
        // Edit mode
        formTitle.textContent = 'Edit PDF';
        if (submitBtn) submitBtn.textContent = 'Update PDF';
        const pdf = contentData.pdfs[index];
        document.getElementById('pdfIndex').value = index;
        if (document.getElementById('pdfId')) document.getElementById('pdfId').value = pdf.id;
        document.getElementById('pdfTitle').value = pdf.title;
        document.getElementById('pdfComposer').value = pdf.composedBy || '';
        document.getElementById('pdfSize').value = pdf.size;
        document.getElementById('pdfDescription').value = pdf.description;
        document.getElementById('pdfUrl').value = pdf.url || '';
    } else {
        // Add mode
        formTitle.textContent = 'Add New PDF';
        if (submitBtn) submitBtn.textContent = 'Save PDF';
        pdfFormElement.reset();
        document.getElementById('pdfIndex').value = '';
        if (document.getElementById('pdfId')) document.getElementById('pdfId').value = '';
    }

    window.currentPdfFile = null; // Clear previous selection
    form.style.display = 'block';
    document.getElementById('pdfsList').style.display = 'none';
}

window.hidePdfForm = function () {
    const pdfFormElement = document.getElementById('pdfFormElement');
    const submitBtn = pdfFormElement.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save PDF';

    document.getElementById('pdfForm').style.display = 'none';
    document.getElementById('pdfsList').style.display = 'block';
    pdfFormElement.reset();
    window.currentPdfFile = null;
}

// Save PDF
window.savePdf = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-admin-primary') || event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save PDF';
    if (btn) {
        btn.textContent = 'Saving...';
        btn.disabled = true;
    }

    const idInput = document.getElementById('pdfId');
    const id = idInput ? idInput.value : '';
    let pdfUrl = document.getElementById('pdfUrl').value;

    try {
        // Handle PDF File Upload
        if (window.currentPdfFile) {
            btn.textContent = 'Uploading PDF...';
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`pdfs/${Date.now()}_${window.currentPdfFile.name}`);
            await fileRef.put(window.currentPdfFile);
            pdfUrl = await fileRef.getDownloadURL();
            console.log('PDF uploaded:', pdfUrl);
        }

        const pdf = {
            title: document.getElementById('pdfTitle').value,
            composedBy: document.getElementById('pdfComposer').value || '',
            size: document.getElementById('pdfSize').value,
            description: document.getElementById('pdfDescription').value,
            url: pdfUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Clean
        Object.keys(pdf).forEach(key => pdf[key] === undefined && delete pdf[key]);

        if (id) {
            await db.collection('pdfs').doc(id).update(pdf);
        } else {
            pdf.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('pdfs').add(pdf);
        }
        hidePdfForm();
        renderPdfs();
    } catch (error) {
        console.error('Error saving PDF', error);
        uiManager.showAlert("Error saving PDF: " + error.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// Delete PDF
window.deletePdf = function (id) {
    const doDelete = async () => {
        try {
            await db.collection('pdfs').doc(id).delete();
            renderPdfs();
        } catch (error) {
            console.error('Error deleting PDF', error);
            uiManager.showAlert("Error deleting PDF: " + error.message, 'error');
        }
    };

    uiManager.showConfirm("Are you sure you want to delete this PDF?", doDelete);
};

// ==========================================
// NEWS MANAGEMENT FUNCTIONS
// ==========================================

// Render News Table
window.renderNews = async function () {
    if (typeof fetchCollection === 'function') {
        await fetchCollection('news');
    }

    const tbody = document.getElementById('newsTableBody');
    const emptyState = document.getElementById('newsEmptyState');
    const table = document.querySelector('#newsList .admin-table');

    if (!contentData.news || contentData.news.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = contentData.news.map((item, index) => `
        <tr>
            <td data-label="Image">
                <img src="${item.image || 'images/logo-placeholder.png'}" alt="" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">
            </td>
            <td data-label="Title"><strong>${item.title}</strong></td>
            <td data-label="Date">${item.date}</td>
            <td data-label="Category"><span class="badge">${item.category}</span></td>
            <td data-label="Excerpt">${item.excerpt.substring(0, 50)}...</td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showNewsForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteNews('${item.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show/Hide News Form
window.showNewsForm = function (index = null) {
    const form = document.getElementById('newsForm');
    const formTitle = document.getElementById('newsFormTitle');
    const newsFormElement = document.getElementById('newsFormElement');
    const submitBtn = newsFormElement.querySelector('button[type="submit"]');

    // Clear previous selection
    window.currentNewsFile = null;

    if (index !== null && contentData.news[index]) {
        // Edit mode
        formTitle.textContent = 'Edit Article';
        if (submitBtn) submitBtn.textContent = 'Update Article';
        const item = contentData.news[index];
        document.getElementById('newsIndex').value = index;
        if (document.getElementById('newsId')) document.getElementById('newsId').value = item.id;
        document.getElementById('newsTitle').value = item.title;
        document.getElementById('newsDate').value = item.date;
        document.getElementById('newsCategory').value = item.category;
        document.getElementById('newsImageUrl').value = item.image || ''; // Set existing URL
        document.getElementById('newsExcerpt').value = item.excerpt;
        document.getElementById('newsContent').value = item.content || '';
    } else {
        // Add mode
        formTitle.textContent = 'Add New Article';
        if (submitBtn) submitBtn.textContent = 'Save Article';
        newsFormElement.reset();
        document.getElementById('newsIndex').value = '';
        if (document.getElementById('newsId')) document.getElementById('newsId').value = '';
        document.getElementById('newsImageUrl').value = '';
    }

    form.style.display = 'block';
    document.getElementById('newsList').style.display = 'none';
}

window.hideNewsForm = function () {
    const newsFormElement = document.getElementById('newsFormElement');
    const submitBtn = newsFormElement.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Article';

    document.getElementById('newsForm').style.display = 'none';
    document.getElementById('newsList').style.display = 'block';
    newsFormElement.reset();
    window.currentNewsFile = null;
}

// Save News
window.saveNews = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-admin-primary') || event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save Article';
    if (btn) {
        btn.textContent = 'Saving...';
        btn.disabled = true;
    }

    const idInput = document.getElementById('newsId');
    const id = idInput ? idInput.value : '';
    let imageUrl = document.getElementById('newsImageUrl').value;

    try {
        // Handle Image File Upload
        if (window.currentNewsFile) {
            btn.textContent = 'Uploading Image...';
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`news/${Date.now()}_${window.currentNewsFile.name}`);
            await fileRef.put(window.currentNewsFile);
            imageUrl = await fileRef.getDownloadURL();
            console.log('News image uploaded:', imageUrl);
        }

        const news = {
            title: document.getElementById('newsTitle').value,
            date: document.getElementById('newsDate').value,
            category: document.getElementById('newsCategory').value,
            image: imageUrl,
            excerpt: document.getElementById('newsExcerpt').value,
            content: document.getElementById('newsContent').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        Object.keys(news).forEach(key => news[key] === undefined && delete news[key]);

        if (id) {
            await db.collection('news').doc(id).update(news);
        } else {
            news.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('news').add(news);
        }
        hideNewsForm();
        renderNews();
    } catch (error) {
        console.error('Error saving news', error);
        uiManager.showAlert("Error saving news: " + error.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// Delete News
window.deleteNews = function (id) {
    const doDelete = async () => {
        try {
            await db.collection('news').doc(id).delete();
            renderNews();
        } catch (error) {
            console.error('Error deleting news', error);
            uiManager.showAlert("Error deleting news: " + error.message, 'error');
        }
    };

    uiManager.showConfirm("Are you sure you want to delete this article?", doDelete);
};

// Initialize PDFs and News on section load
document.addEventListener('DOMContentLoaded', function () {
    // PDFs
    const pdfsLink = document.querySelector('[data-section="pdfs"]');
    if (pdfsLink) {
        pdfsLink.addEventListener('click', renderPdfs);
    }
    if (window.location.hash === '#pdfs') {
        renderPdfs();
    }

    // News
    const newsLink = document.querySelector('[data-section="news"]');
    if (newsLink) {
        newsLink.addEventListener('click', renderNews);
    }
    if (window.location.hash === '#news') {
        renderNews();
    }
});
