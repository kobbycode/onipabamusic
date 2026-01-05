// ==========================================
// DRAFT/APPROVAL WORKFLOW EXTENSION
// ==========================================
// This file extends the existing admin functions to add draft/approval functionality

// Override existing save functions to add status tracking
(function () {
    // Store original functions
    const originalSaveVideo = window.saveVideo;
    const originalSaveAudio = window.saveAudio;
    const originalRenderVideos = window.renderVideos;
    const originalRenderAudios = window.renderAudios;

    // Enhanced saveVideo with draft status
    window.saveVideo = function (event) {
        event.preventDefault();

        const index = document.getElementById('videoIndex').value;
        const currentUser = getCurrentUser();
        const isNew = index === '';

        const video = {
            title: document.getElementById('videoTitle').value,
            duration: document.getElementById('videoDuration').value,
            meta: document.getElementById('videoMeta').value,
            url: document.getElementById('videoUrl').value,
            fileData: document.getElementById('videoFileData').value || null,
            thumbnailData: document.getElementById('videoThumbnailData').value || null,
            id: index !== '' ? contentData.videos[index].id : Date.now(),
            status: isNew ? (isSuperAdmin() ? 'published' : 'draft') : contentData.videos[index].status,
            createdBy: isNew ? currentUser.id : contentData.videos[index].createdBy,
            createdAt: isNew ? new Date().toISOString() : contentData.videos[index].createdAt
        };

        if (index !== '') {
            updateContentItem('videos', parseInt(index), video);
        } else {
            addContentItem('videos', video);
        }

        hideVideoForm();
        renderVideos();

        if (isNew && !isSuperAdmin()) {
            uiManager.showAlert('Video saved as draft. It will be visible after super admin approval.');
        }
    };

    // Enhanced saveAudio with draft status
    window.saveAudio = function (event) {
        event.preventDefault();

        const index = document.getElementById('audioIndex').value;
        const currentUser = getCurrentUser();
        const isNew = index === '';

        const audio = {
            title: document.getElementById('audioTitle').value,
            duration: document.getElementById('audioDuration').value,
            artist: document.getElementById('audioArtist').value,
            url: document.getElementById('audioUrl').value,
            fileData: document.getElementById('audioFileData').value || null,
            coverData: document.getElementById('audioCoverData').value || null,
            id: index !== '' ? contentData.audios[index].id : Date.now(),
            status: isNew ? (isSuperAdmin() ? 'published' : 'draft') : contentData.audios[index].status,
            createdBy: isNew ? currentUser.id : contentData.audios[index].createdBy,
            createdAt: isNew ? new Date().toISOString() : contentData.audios[index].createdAt
        };

        if (index !== '') {
            updateContentItem('audios', parseInt(index), audio);
        } else {
            addContentItem('audios', audio);
        }

        hideAudioForm();
        renderAudios();

        if (isNew && !isSuperAdmin()) {
            uiManager.showAlert('Audio saved as draft. It will be visible after super admin approval.');
        }
    };

    // Enhanced savePdf with draft status
    window.savePdf = function (event) {
        event.preventDefault();

        const index = document.getElementById('pdfIndex').value;
        const currentUser = getCurrentUser();
        const isNew = index === '';

        const pdf = {
            title: document.getElementById('pdfTitle').value,
            composedBy: document.getElementById('pdfComposer').value,
            size: document.getElementById('pdfSize').value,
            description: document.getElementById('pdfDescription').value,
            url: document.getElementById('pdfUrl').value,
            fileData: document.getElementById('pdfFileData').value || null,
            id: index !== '' ? contentData.pdfs[index].id : Date.now(),
            status: isNew ? (isSuperAdmin() ? 'published' : 'draft') : contentData.pdfs[index].status,
            createdBy: isNew ? currentUser.id : contentData.pdfs[index].createdBy,
            createdAt: isNew ? new Date().toISOString() : contentData.pdfs[index].createdAt
        };

        if (index !== '') {
            updateContentItem('pdfs', parseInt(index), pdf);
        } else {
            addContentItem('pdfs', pdf);
        }

        hidePdfForm();
        renderPdfs();

        if (isNew && !isSuperAdmin()) {
            uiManager.showAlert('PDF saved as draft. It will be visible after super admin approval.');
        }
    };

    // Enhanced renderVideos with status badges and approve buttons
    window.renderVideos = function () {
        const tbody = document.getElementById('videosTableBody');
        const emptyState = document.getElementById('videosEmptyState');
        const table = document.querySelector('#videosList .admin-table');

        if (!contentData.videos || contentData.videos.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = contentData.videos.map((video, index) => {
            const status = video.status || 'published'; // Default old content to published
            const statusBadge = status === 'published'
                ? '<span class="badge badge-published">Published</span>'
                : '<span class="badge badge-draft">Draft</span>';

            const approveBtn = isSuperAdmin() && status === 'draft'
                ? `<button class="btn-icon btn-approve" onclick="approveVideo(${index})" title="Approve & Publish">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M15 5L7 13L3 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                   </button>`
                : '';

            const deleteBtn = isSuperAdmin()
                ? `<button class="btn-icon btn-delete" onclick="deleteVideo(${index})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                   </button>`
                : '';

            return `
                <tr>
                    <td><strong>${video.title}</strong></td>
                    <td>${video.duration}</td>
                    <td>${video.meta}</td>
                    <td>${statusBadge}</td>
                    <td class="actions-cell">
                        ${approveBtn}
                        <button class="btn-icon btn-edit" onclick="showVideoForm(${index})" title="Edit">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                            </svg>
                        </button>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Enhanced renderAudios with status badges and approve buttons
    window.renderAudios = function () {
        const tbody = document.getElementById('audiosTableBody');
        const emptyState = document.getElementById('audiosEmptyState');
        const table = document.querySelector('#audiosList .admin-table');

        if (!contentData.audios || contentData.audios.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = contentData.audios.map((audio, index) => {
            const status = audio.status || 'published'; // Default old content to published
            const statusBadge = status === 'published'
                ? '<span class="badge badge-published">Published</span>'
                : '<span class="badge badge-draft">Draft</span>';

            const approveBtn = isSuperAdmin() && status === 'draft'
                ? `<button class="btn-icon btn-approve" onclick="approveAudio(${index})" title="Approve & Publish">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M15 5L7 13L3 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                   </button>`
                : '';

            const deleteBtn = isSuperAdmin()
                ? `<button class="btn-icon btn-delete" onclick="deleteAudio(${index})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                   </button>`
                : '';

            return `
                <tr>
                    <td><strong>${audio.title}</strong></td>
                    <td>${audio.artist}</td>
                    <td>${audio.duration}</td>
                    <td>${statusBadge}</td>
                    <td class="actions-cell">
                        ${approveBtn}
                        <button class="btn-icon btn-edit" onclick="showAudioForm(${index})" title="Edit">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                            </svg>
                        </button>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Enhanced renderPdfs with status badges and approve buttons
    window.renderPdfs = function () {
        const tbody = document.getElementById('pdfsTableBody');
        const emptyState = document.getElementById('pdfsEmptyState');
        const table = document.querySelector('#pdfsList .admin-table');

        if (!contentData.pdfs || contentData.pdfs.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        table.style.display = 'table';
        emptyState.style.display = 'none';

        tbody.innerHTML = contentData.pdfs.map((pdf, index) => {
            const status = pdf.status || 'published';
            const statusBadge = status === 'published'
                ? '<span class="badge badge-published">Published</span>'
                : '<span class="badge badge-draft">Draft</span>';

            const approveBtn = isSuperAdmin() && status === 'draft'
                ? `<button class="btn-icon btn-approve" onclick="approvePdf(${index})" title="Approve & Publish">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M15 5L7 13L3 9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                   </button>`
                : '';

            const deleteBtn = isSuperAdmin()
                ? `<button class="btn-icon btn-delete" onclick="deletePdf(${index})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                            <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                   </button>`
                : '';

            return `
                <tr>
                    <td><strong>${pdf.title}</strong></td>
                    <td>${pdf.composedBy || '-'}</td>
                    <td>${pdf.size}</td>
                    <td>${statusBadge}</td>
                    <td class="actions-cell">
                        ${approveBtn}
                        <button class="btn-icon btn-edit" onclick="showPdfForm(${index})" title="Edit">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                                <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                            </svg>
                        </button>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');
    };

    // Store original renderPdf for fallback if needed, but we replaced the global one.
})();

// Approve Pdf (Super Admin only)
function approvePdf(index) {
    if (!isSuperAdmin()) {
        uiManager.showAlert('Only super admins can approve content', 'error');
        return;
    }

    const pdf = contentData.pdfs[index];
    pdf.status = 'published';
    pdf.approvedBy = getCurrentUser().id;
    pdf.approvedAt = new Date().toISOString();

    updateContentItem('pdfs', index, pdf);
    renderPdfs();
    uiManager.showAlert('PDF approved and published successfully!', 'success');
}

// Check original overrides again
(function () {
    // ... video and audio delete overrides are already there

    // Add PDF delete override
    const originalDeletePdf = window.deletePdf;
    window.deletePdf = function (index) {
        if (!isSuperAdmin()) {
            uiManager.showAlert('Only super admins can delete content', 'error');
            return;
        }

        const performDelete = () => {
            deleteContentItem('pdfs', index);
            renderPdfs();
        };

        if (window.showConfirm) {
            window.showConfirm('Are you sure you want to delete this PDF?', performDelete);
        } else {
            uiManager.showConfirm('Are you sure you want to delete this PDF?', async () => {
                performDelete();
            });
        }
    };
})();
function approveVideo(index) {
    if (!isSuperAdmin()) {
        uiManager.showAlert('Only super admins can approve content', 'error');
        return;
    }

    const video = contentData.videos[index];
    video.status = 'published';
    video.approvedBy = getCurrentUser().id;
    video.approvedAt = new Date().toISOString();

    updateContentItem('videos', index, video);
    renderVideos();
    uiManager.showAlert('Video approved and published successfully!', 'success');
}

// Approve Audio (Super Admin only)
function approveAudio(index) {
    if (!isSuperAdmin()) {
        uiManager.showAlert('Only super admins can approve content', 'error');
        return;
    }

    const audio = contentData.audios[index];
    audio.status = 'published';
    audio.approvedBy = getCurrentUser().id;
    audio.approvedAt = new Date().toISOString();

    updateContentItem('audios', index, audio);
    renderAudios();
    uiManager.showAlert('Audio approved and published successfully!', 'success');
}

// Override delete functions to add permission check
(function () {
    const originalDeleteVideo = window.deleteVideo;
    const originalDeleteAudio = window.deleteAudio;

    window.deleteVideo = function (index) {
        if (!isSuperAdmin()) {
            uiManager.showAlert('Only super admins can delete content', 'error');
            return;
        }

        const performDelete = () => {
            deleteContentItem('videos', index);
            renderVideos();
        };

        if (window.showConfirm) {
            window.showConfirm('Are you sure you want to delete this video?', performDelete);
        } else {
            uiManager.showConfirm('Are you sure you want to delete this video?', async () => {
                performDelete();
            });
        }
    };

    window.deleteAudio = function (index) {
        if (!isSuperAdmin()) {
            uiManager.showAlert('Only super admins can delete content', 'error');
            return;
        }

        const performDelete = () => {
            deleteContentItem('audios', index);
            renderAudios();
        };

        if (window.showConfirm) {
            window.showConfirm('Are you sure you want to delete this audio track?', performDelete);
        } else {
            uiManager.showConfirm('Are you sure you want to delete this audio track?', async () => {
                performDelete();
            });
        }
    };
})();

console.log('Draft/Approval workflow loaded successfully');
