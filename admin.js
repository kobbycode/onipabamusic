// Admin Dashboard JavaScript

// ==========================================
// INITIALIZATION & NAVIGATION
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const adminMenuToggle = document.getElementById('adminMenuToggle');
    const adminSidebar = document.getElementById('adminSidebar');

    if (adminMenuToggle && adminSidebar) {
        adminMenuToggle.addEventListener('click', function () {
            adminSidebar.classList.toggle('active');
            adminMenuToggle.classList.toggle('active');
        });
    }

    // Admin navigation
    const adminNavLinks = document.querySelectorAll('.admin-nav-link');
    const adminSections = document.querySelectorAll('.admin-section');

    adminNavLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            adminNavLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Hide all sections
            adminSections.forEach(section => section.style.display = 'none');

            // Show selected section
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(`admin-${sectionId}`);
            if (targetSection) {
                targetSection.style.display = 'block';

                // Force render based on section
                switch (sectionId) {
                    case 'videos':
                        if (window.renderVideos) window.renderVideos();
                        break;
                    case 'audios':
                        if (window.renderAudios) window.renderAudios();
                        break;
                    case 'pdfs':
                        if (window.renderPdfs) window.renderPdfs();
                        break;
                    case 'news':
                        if (window.renderNews) window.renderNews();
                        break;
                    case 'users':
                        if (window.renderUsers) window.renderUsers();
                        break;
                    case 'settings':
                        if (window.renderNavLinks) window.renderNavLinks();
                        if (window.loadFooterSettings) window.loadFooterSettings();
                        break;
                    case 'chat':
                        if (window.renderChannels) window.renderChannels();
                        if (window.renderModeration) window.renderModeration();
                        break;
                    case 'inquiries':
                        if (window.renderInquiries) window.renderInquiries();
                        break;
                    case 'subscribers':
                        if (window.renderSubscribers) window.renderSubscribers();
                        break;
                    case 'dashboard':
                        if (window.updateDashboardMetrics) window.updateDashboardMetrics();
                        break;
                }
            }

            // Close mobile menu after selection
            if (window.innerWidth <= 768) {
                adminSidebar.classList.remove('active');
                adminMenuToggle.classList.remove('active');
            }
        });
    });

    // Initialize - show dashboard section by default
    const dashboardSection = document.getElementById('admin-dashboard');
    if (dashboardSection) {
        adminSections.forEach(s => s.style.display = 'none');
        dashboardSection.style.display = 'block';
        if (window.updateDashboardMetrics) window.updateDashboardMetrics();
    }
});

// ==========================================
// DASHBOARD METRICS
// ==========================================


// ==========================================
// DATA MANAGEMENT (Firestore)
// ==========================================
window.contentData = {
    videos: [],
    audios: [],
    pdfs: [],
    news: [],
    users: [],
    channels: []
};

// Generic Fetch Function
async function fetchCollection(collectionName) {
    // Critical Check: Ensure db is initialized
    if (typeof db === 'undefined' || !db) {
        console.error(`❌ [Admin] Firestore (db) is not initialized! Cannot fetch ${collectionName}.`);
        alert(`Database connection error. Please refresh the page.`);
        return [];
    }

    try {
        console.log(`🚀 [Admin] Fetching ${collectionName}...`);
        const snapshot = await db.collection(collectionName).get();
        window.contentData[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ [Admin] Fetched ${collectionName}: ${window.contentData[collectionName].length} items`, window.contentData[collectionName]);
        return window.contentData[collectionName];
    } catch (error) {
        console.error(`❌ [Admin] Error fetching ${collectionName}:`, error);
        alert(`Error loading ${collectionName}: ${error.message}`);
        return [];
    }
}

// Expose globally for other admin scripts
window.fetchCollection = fetchCollection;

// ==========================================
// FILE UPLOAD HANDLERS (Helpers)
// ==========================================

// Helper to convert file to Base64 (Legacy/Small files)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Helper to Resize and Compress Image
function resizeImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Helper to get media duration
function getMediaDuration(file, type = 'video') {
    return new Promise((resolve) => {
        const element = document.createElement(type);
        element.preload = 'metadata';
        element.onloadedmetadata = function () {
            window.URL.revokeObjectURL(element.src);
            const duration = element.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        element.onerror = () => resolve("0:00");
        element.src = URL.createObjectURL(file);
    });
}

// VIDEO HANDLERS
window.handleVideoFileUpload = async function (event) {
    const file = event.target.files[0];
    if (file) {
        window.currentVideoFile = file; // Store file for upload
        // Detect duration
        try {
            const duration = await getMediaDuration(file, 'video');
            document.getElementById('videoDuration').value = duration;
        } catch (e) {
            console.error(e);
        }
        document.getElementById('videoFileData').value = file.name;
    }
};

window.handleVideoThumbnailUpload = async function (event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const compressedBase64 = await resizeImage(file, 800, 0.7);
            if (compressedBase64.length > 1000000) {
                uiManager.showAlert("Image is still too large. Please pick a smaller image or use an external URL.", 'error');
                return;
            }
            document.getElementById('videoThumbnailData').value = compressedBase64;
        } catch (e) {
            console.error(e);
            uiManager.showAlert("Error processing image", 'error');
        }
    }
};

// AUDIO HANDLERS
window.handleAudioFileUpload = async function (event) {
    const file = event.target.files[0];
    if (file) {
        window.currentAudioFile = file; // Store for upload
        try {
            const duration = await getMediaDuration(file, 'audio');
            document.getElementById('audioDuration').value = duration;
            document.getElementById('audioFileData').value = file.name;
        } catch (e) {
            console.error(e);
        }
    }
};

window.handleAudioCoverUpload = async function (event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const compressedBase64 = await resizeImage(file, 800, 0.7);
            if (compressedBase64.length > 1000000) {
                uiManager.showAlert("Image is still too large. Please pick a smaller image or use an external URL.", 'error');
                return;
            }
            document.getElementById('audioCoverData').value = compressedBase64;
        } catch (e) {
            console.error(e);
        }
    }
};


// ==========================================
// VIDEO MANAGEMENT FUNCTIONS
// ==========================================

window.renderVideos = async function () {
    await fetchCollection('videos');

    const tbody = document.getElementById('videosTableBody');
    const emptyState = document.getElementById('videosEmptyState');
    const table = document.querySelector('#videosList .admin-table');

    if (!contentData.videos || contentData.videos.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = contentData.videos.map((video, index) => `
        <tr>
            <td data-label="Title"><strong>${video.title}</strong></td>
            <td data-label="Composer">${video.composedBy || '-'}</td>
            <td data-label="Duration">${video.duration}</td>
            <td data-label="Category"><span class="badge">${video.meta || 'General'}</span></td>
            <td data-label="Thumbnail"><span class="badge ${video.thumbnail ? 'badge-primary' : 'badge-secondary'}">${video.thumbnail ? 'Has Image' : 'No Image'}</span></td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showVideoForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteVideo('${video.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}



window.showVideoForm = function (index = null) {
    const form = document.getElementById('videoForm');
    const formTitle = document.getElementById('videoFormTitle');
    const videoFormElement = document.getElementById('videoFormElement');
    const submitBtn = videoFormElement.querySelector('button[type="submit"]');

    // Clear previous file selection
    window.currentVideoFile = null;

    if (index !== null && contentData.videos[index]) {
        // Edit mode
        formTitle.textContent = 'Edit Video';
        if (submitBtn) submitBtn.textContent = 'Update Video';
        const video = contentData.videos[index];
        document.getElementById('videoIndex').value = index;
        document.getElementById('videoId').value = video.id;
        document.getElementById('videoTitle').value = video.title;
        document.getElementById('videoComposer').value = video.composedBy || '';
        document.getElementById('videoDuration').value = video.duration;
        document.getElementById('videoMeta').value = video.meta;
        document.getElementById('videoThumbnailData').value = video.thumbnail || '';
        document.getElementById('videoUrl').value = video.url || '';
    } else {
        // Add mode
        formTitle.textContent = 'Add New Video';
        if (submitBtn) submitBtn.textContent = 'Save Video';
        videoFormElement.reset();
        document.getElementById('videoIndex').value = '';
        document.getElementById('videoId').value = '';
    }

    form.style.display = 'block';
    document.getElementById('videosList').style.display = 'none';
}

window.hideVideoForm = function () {
    const videoFormElement = document.getElementById('videoFormElement');
    const submitBtn = videoFormElement.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Video';

    document.getElementById('videoForm').style.display = 'none';
    document.getElementById('videosList').style.display = 'block';
    videoFormElement.reset();
    window.currentVideoFile = null;
}

window.saveVideo = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-admin-primary') || event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save Video';
    if (btn) {
        btn.textContent = 'Saving...';
        btn.disabled = true;
    }

    const id = document.getElementById('videoId').value;
    let videoUrl = document.getElementById('videoUrl').value;

    try {
        // Handle Video File Upload
        if (window.currentVideoFile) {
            btn.textContent = 'Uploading Video...';
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`videos/${Date.now()}_${window.currentVideoFile.name}`);
            await fileRef.put(window.currentVideoFile);
            videoUrl = await fileRef.getDownloadURL();
            console.log('Video uploaded:', videoUrl);
        }

        const video = {
            title: document.getElementById('videoTitle').value,
            composedBy: document.getElementById('videoComposer').value,
            duration: document.getElementById('videoDuration').value,
            meta: document.getElementById('videoMeta').value,
            url: videoUrl,
            thumbnail: document.getElementById('videoThumbnailData').value || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Clean undefined
        Object.keys(video).forEach(key => video[key] === undefined && delete video[key]);

        if (id) {
            await db.collection('videos').doc(id).update(video);
            console.log('Video updated');
        } else {
            video.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('videos').add(video);
            console.log('Video added');
        }
        hideVideoForm();
        renderVideos();
    } catch (error) {
        console.error("Error saving video: ", error);
        uiManager.showAlert("Error saving video: " + error.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

window.deleteVideo = function (id) {
    const doDelete = async () => {
        try {
            await db.collection('videos').doc(id).delete();
            renderVideos();
        } catch (error) {
            console.error("Error deleting video: ", error);
            uiManager.showAlert("Error deleting video: " + error.message, 'error');
        }
    };

    uiManager.showConfirm('Are you sure you want to delete this video?', doDelete);
}


// ==========================================
// AUDIO MANAGEMENT FUNCTIONS
// ==========================================

window.renderAudios = async function () {
    await fetchCollection('audios');

    const tbody = document.getElementById('audiosTableBody');
    const emptyState = document.getElementById('audiosEmptyState');
    const table = document.querySelector('#audiosList .admin-table');

    if (!contentData.audios || contentData.audios.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = contentData.audios.map((audio, index) => `
        <tr>
            <td data-label="Title"><strong>${audio.title}</strong></td>
            <td data-label="Composer">${audio.composedBy || ''}</td>
            <td data-label="Artist">${audio.artist}</td>
            <td data-label="Duration">${audio.duration}</td>
            <td data-label="Status">${audio.artist ? 'Published' : 'Draft'}</td>
            <td data-label="Actions" class="actions-cell">
                <button class="btn-icon btn-edit" onclick="showAudioForm(${index})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteAudio('${audio.id}')" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                        <path d="M3 5H15M7 8V13M11 8V13M4 5L5 15H13L14 5" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

window.showAudioForm = function (index = null) {
    const form = document.getElementById('audioForm');
    const formTitle = document.getElementById('audioFormTitle');
    const audioFormElement = document.getElementById('audioFormElement');
    const submitBtn = audioFormElement.querySelector('button[type="submit"]');

    window.currentAudioFile = null; // Clear previous file selection

    if (index !== null && contentData.audios[index]) {
        // Edit mode
        formTitle.textContent = 'Edit Audio';
        if (submitBtn) submitBtn.textContent = 'Update Audio';
        const audio = contentData.audios[index];
        document.getElementById('audioIndex').value = index;
        document.getElementById('audioId').value = audio.id;
        document.getElementById('audioTitle').value = audio.title;
        document.getElementById('audioComposer').value = audio.composedBy || '';
        document.getElementById('audioDuration').value = audio.duration;
        document.getElementById('audioArtist').value = audio.artist;
        document.getElementById('audioCoverData').value = audio.cover || '';
        document.getElementById('audioUrl').value = audio.url || '';
    } else {
        // Add mode
        formTitle.textContent = 'Add New Audio';
        if (submitBtn) submitBtn.textContent = 'Save Audio';
        audioFormElement.reset();
        document.getElementById('audioIndex').value = '';
        document.getElementById('audioId').value = '';
    }

    form.style.display = 'block';
    document.getElementById('audiosList').style.display = 'none';
}

window.hideAudioForm = function () {
    const audioFormElement = document.getElementById('audioFormElement');
    const submitBtn = audioFormElement.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Audio';

    document.getElementById('audioForm').style.display = 'none';
    document.getElementById('audiosList').style.display = 'block';
    audioFormElement.reset();
    window.currentAudioFile = null; // Clear stored file
}

window.saveAudio = async function (event) {
    event.preventDefault();
    const btn = event.target.querySelector('.btn-admin-primary') || event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save Audio';
    if (btn) {
        btn.textContent = 'Saving...';
        btn.disabled = true;
    }

    const id = document.getElementById('audioId').value;
    let audioUrl = document.getElementById('audioUrl').value; // Use let for potential update

    try {
        // Handle Audio File Upload
        if (window.currentAudioFile) {
            btn.textContent = 'Uploading Audio...';
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`audios/${Date.now()}_${window.currentAudioFile.name}`);
            await fileRef.put(window.currentAudioFile);
            audioUrl = await fileRef.getDownloadURL();
            console.log('Audio uploaded:', audioUrl);
        }

        const audio = {
            title: document.getElementById('audioTitle').value,
            composedBy: document.getElementById('audioComposer').value,
            duration: document.getElementById('audioDuration').value,
            artist: document.getElementById('audioArtist').value,
            url: audioUrl, // Use the potentially updated audioUrl
            cover: document.getElementById('audioCoverData').value || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        Object.keys(audio).forEach(key => audio[key] === undefined && delete audio[key]);

        if (id) {
            await db.collection('audios').doc(id).update(audio);
            console.log('Audio updated');
        } else {
            audio.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('audios').add(audio);
            console.log('Audio added');
        }
        hideAudioForm();
        renderAudios();
    } catch (error) {
        console.error("Error saving audio: ", error);
        uiManager.showAlert("Error saving audio: " + error.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

window.deleteAudio = function (id) {
    const doDelete = async () => {
        try {
            await db.collection('audios').doc(id).delete();
            renderAudios();
        } catch (error) {
            console.error("Error deleting audio: ", error);
            uiManager.showAlert("Error deleting audio: " + error.message, 'error');
        }
    };

    uiManager.showConfirm('Are you sure you want to delete this audio track?', doDelete);
}
