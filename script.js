import { uiManager } from './ui-manager.js';
import { searchManager } from './search-manager.js';

// ==========================================
// SMOOTH SCROLL BEHAVIOR
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// MOBILE MENU TOGGLE
// ==========================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.nav');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// ==========================================
// DYNAMIC NAV HIGHLIGHTING
// ==========================================
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Reset active class
        link.classList.remove('active');

        // Check if current path matches href
        // handles: index.html, / (root), or specific pages
        const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
        const linkIsHome = href === 'index.html' || href === './' || href === '/';

        if (isHome && linkIsHome) {
            link.classList.add('active');
        } else if (href !== 'index.html' && href !== './' && href !== '/' && currentPath.includes(href)) {
            link.classList.add('active');
        } else if (href === 'videos.html' && currentPath.includes('video-player.html')) {
            link.classList.add('active');
        } else if (href === 'news.html' && currentPath.includes('news-detail.html')) {
            link.classList.add('active');
        } else if (href === 'audios.html' && currentPath.includes('audio-player.html')) {
            link.classList.add('active');
        }
    });
}

// Run on load
document.addEventListener('DOMContentLoaded', highlightActiveNav);

// ==========================================
// HEADER SCROLL EFFECT
// ==========================================
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (!header) return;

    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        header.style.background = 'rgba(26, 20, 16, 0.85)';
        header.style.backdropFilter = 'blur(15px)';
        header.style.padding = '0.5rem 0';
        header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    } else {
        header.style.background = 'rgba(26, 20, 16, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.padding = '1rem 0';
        header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ==========================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ==========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.video-card, .audio-card, .pdf-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// ==========================================
// AUDIO PLAYER FUNCTIONALITY (HTML5 Audio)
// ==========================================
const musicPlayer = document.getElementById('musicPlayer');
const currentAudio = new Audio(); // HTML5 Audio Object
let isPlaying = false;
let currentTrackIndex = -1;
let isShuffle = false;
let repeatMode = 'none'; // 'none', 'all', 'one'

// DOM Elements within player
const playerTitle = document.querySelector('.player-title');
const playerArtist = document.querySelector('.player-artist');
const playerCover = document.querySelector('.player-cover');
const playPauseBtn = document.getElementById('playPauseBtn');
const skipNextBtn = document.getElementById('skipNextBtn');
const skipPrevBtn = document.getElementById('skipPrevBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLevel = document.querySelector('.volume-level');
const progressBar = document.querySelector('.progress-bar');
const progressBarWrapper = document.querySelector('.progress-bar-wrapper');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// Handle Audio Card Clicks using delegation
document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.audio-play-btn');
    const audioCard = e.target.closest('.audio-card');

    if (playBtn || audioCard) {
        const target = playBtn || audioCard;
        const index = target.dataset.index;

        if (index !== undefined && publicContentData.audios[index]) {
            const audio = publicContentData.audios[index];
            // Navigate to audio player page
            window.location.href = `audio-player.html?id=${audio.id || index}`;
        }
    }
});

// Load and Play Track
function loadTrack(src, title, artist, cover) {
    if (!src) {
        uiManager.showAlert('Audio source not available.', 'error');
        return;
    }

    // Update UI
    if (playerTitle) playerTitle.textContent = title;
    if (playerArtist) playerArtist.textContent = artist;
    if (playerCover) {
        if (cover) {
            playerCover.style.backgroundImage = `url('${cover}')`;
            playerCover.style.backgroundColor = 'transparent';
        } else {
            playerCover.style.backgroundImage = 'none';
            playerCover.style.backgroundColor = '#333';
        }
    }

    // Show Player
    if (musicPlayer && !musicPlayer.classList.contains('active')) {
        musicPlayer.classList.add('active');
        musicPlayer.style.display = 'flex';
    }

    // Load Audio
    currentAudio.src = src;
    currentAudio.load();

    // Play
    playAudio();
}

function playAudio() {
    const playPromise = currentAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            isPlaying = true;
            updatePlayButton();
        })
            .catch(error => {
                console.error('Playback failed:', error);
                isPlaying = false;
                updatePlayButton();
            });
    }
}

function pauseAudio() {
    currentAudio.pause();
    isPlaying = false;
    updatePlayButton();
}

function togglePlayback() {
    if (currentAudio.paused) {
        playAudio();
    } else {
        pauseAudio();
    }
}

// Skip Next
function playNext() {
    if (publicContentData.audios.length === 0) return;

    if (isShuffle) {
        let nextIndex = Math.floor(Math.random() * publicContentData.audios.length);
        while (nextIndex === currentTrackIndex && publicContentData.audios.length > 1) {
            nextIndex = Math.floor(Math.random() * publicContentData.audios.length);
        }
        currentTrackIndex = nextIndex;
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % publicContentData.audios.length;
    }

    const track = publicContentData.audios[currentTrackIndex];
    loadTrack(track.url, track.title, track.artist || track.composedBy || 'John Onipaba', track.cover);
}

// Skip Previous
function playPrevious() {
    if (publicContentData.audios.length === 0) return;

    // If track is more than 3s in, just restart it
    if (currentAudio.currentTime > 3) {
        currentAudio.currentTime = 0;
        return;
    }

    currentTrackIndex = (currentTrackIndex - 1 + publicContentData.audios.length) % publicContentData.audios.length;
    const track = publicContentData.audios[currentTrackIndex];
    loadTrack(track.url, track.title, track.artist || track.composedBy || 'John Onipaba', track.cover);
}

// Listeners
if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayback);
if (skipNextBtn) skipNextBtn.addEventListener('click', playNext);
if (skipPrevBtn) skipPrevBtn.addEventListener('click', playPrevious);

if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        console.log('Shuffle:', isShuffle);
    });
}

if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
        const icon = repeatBtn.querySelector('.material-icons');
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            icon.textContent = 'repeat';
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('active');
            icon.textContent = 'repeat_one';
        } else {
            repeatMode = 'none';
            repeatBtn.classList.remove('active');
            icon.textContent = 'repeat';
        }
        console.log('Repeat Mode:', repeatMode);
    });
}

if (volumeSlider) {
    let isDraggingVolume = false;

    const updateVolumeFromEvent = (e) => {
        const rect = volumeSlider.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        let volume = offsetX / rect.width;
        volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        currentAudio.volume = volume;
        if (volumeLevel) volumeLevel.style.width = `${volume * 100}%`;
    };

    volumeSlider.addEventListener('mousedown', (e) => {
        isDraggingVolume = true;
        updateVolumeFromEvent(e);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingVolume) {
            updateVolumeFromEvent(e);
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingVolume = false;
    });

    // Also support click (already handled by mousedown, but touch could follow)
}

function updatePlayButton() {
    const icon = playPauseBtn.querySelector('.material-icons');
    if (isPlaying) {
        icon.textContent = 'pause';
    } else {
        icon.textContent = 'play_arrow';
    }
}

// Update Progress Bar & Time
currentAudio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = currentAudio;
    if (isNaN(duration)) return;

    const progressPercent = (currentTime / duration) * 100;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;

    // Time Formatting
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
    if (durationEl) durationEl.textContent = formatTime(duration);
});

// Track Ended
currentAudio.addEventListener('ended', () => {
    if (repeatMode === 'one') {
        currentAudio.currentTime = 0;
        playAudio();
    } else if (repeatMode === 'all' || currentTrackIndex < publicContentData.audios.length - 1 || isShuffle) {
        playNext();
    } else {
        isPlaying = false;
        updatePlayButton();
    }
});

// Seek Functionality (Draggable)
if (progressBarWrapper) {
    let isDraggingProgress = false;

    const updateProgressFromEvent = (e) => {
        const rect = progressBarWrapper.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const duration = currentAudio.duration;

        if (!isNaN(duration) && width > 0) {
            let progress = offsetX / width;
            progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
            currentAudio.currentTime = progress * duration;
        }
    };

    progressBarWrapper.addEventListener('mousedown', (e) => {
        isDraggingProgress = true;
        updateProgressFromEvent(e);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDraggingProgress) {
            updateProgressFromEvent(e);
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingProgress = false;
    });
}

// Helper: Format Time
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}


// PDF DOWNLOAD HANDLER
// ==========================================
const downloadButtons = document.querySelectorAll('.btn-download');

downloadButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const pdfCard = button.closest('.pdf-card');
        const pdfTitle = pdfCard.querySelector('.pdf-title').textContent;

        // Add downloading state
        const originalText = button.textContent;
        button.textContent = 'Downloading...';
        button.disabled = true;
        button.style.opacity = '0.7';

        // Simulate download (replace with actual download logic)
        setTimeout(() => {
            button.textContent = '✓ Downloaded';
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.style.opacity = '1';
            }, 2000);
        }, 1500);
    });
});

// ==========================================
// PARALLAX EFFECT FOR HERO
// ==========================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');

    if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ==========================================
// DYNAMIC LOADING ANIMATION
// ==========================================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});


// ==========================================
// DYNAMIC CONTENT MANAGEMENT
// ==========================================
let publicContentData = {
    videos: [],
    audios: [],
    pdfs: [],
    news: []
};

// Load content from Firestore (Public)
async function loadPublicContent() {
    if (typeof db === 'undefined' || !db) {
        logError('loadPublicContent', 'Firestore not initialized', {
            dbType: typeof db,
            dbValue: db
        });

        // Show error in all content sections
        ['.video-grid', '.news-grid', '.audio-grid', '.pdf-grid'].forEach(selector => {
            showError(selector, 'Database connection failed. Please refresh the page.', {
                retryFn: 'location.reload',
                type: 'error'
            });
        });
        return;
    }
    console.log('🚀 Loading public content from Firestore...');

    window.publicContentData = {
        videos: [],
        news: [],
        audios: [],
        pdfs: []
    };

    const collections = ['videos', 'news', 'audios', 'pdfs'];
    const orderFields = {
        videos: 'createdAt',
        news: 'date',
        audios: 'createdAt',
        pdfs: 'createdAt'
    };


    // Use individual fetchers to isolate errors
    const fetchCollection = async (collName) => {
        try {
            console.log(`Fetching ${collName}...`);
            const snap = await db.collection(collName).orderBy(orderFields[collName], 'desc').get();
            console.log(`✅ ${collName} fetched: ${snap.size} items`);
            publicContentData[collName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
            // Enhanced error logging with context
            logError(`loadPublicContent/${collName}`, err, {
                collection: collName,
                orderField: orderFields[collName],
                dbInitialized: typeof db !== 'undefined'
            });

            // User-friendly error display with retry option
            const gridSelector = `.${collName.slice(0, -1)}-grid`;
            showError(gridSelector, `Unable to load ${collName}. Please check your connection and try again.`, {
                retryFn: 'loadPublicContent',
                type: 'error'
            });
        }
    };

    await Promise.all(collections.map(fetchCollection));

    // Update Search Data
    if (window.searchManager) {
        window.searchManager.setSearchData({
            videos: publicContentData.videos,
            audios: publicContentData.audios,
            news: publicContentData.news
        });
    } else if (searchManager) {
        searchManager.setSearchData({
            videos: publicContentData.videos,
            audios: publicContentData.audios,
            news: publicContentData.news
        });
    }

    // Render results
    renderPublicVideos();
    renderPublicNews();
    renderPublicAudios();
    renderPublicPDFs();
    updateSearchIndex();

    // Init page-specific components
    if (document.getElementById('news-detail-content')) initNewsDetail();
    if (document.getElementById('video-player-content')) initVideoPlayer();
    if (document.getElementById('audio-player-content')) initAudioPlayer();
}

// ==========================================
// ERROR HANDLING UTILITIES
// ==========================================

/**
 * Display a user-friendly error message in a container
 * @param {string} selector - CSS selector for the container
 * @param {string} message - User-friendly error message
 * @param {Object} options - Additional options (retryFn, details, type)
 */
function showError(selector, message, options = {}) {
    const container = document.querySelector(selector);
    if (!container) return;

    const { retryFn, details, type = 'error' } = options;

    const errorHTML = `
        <div class="error-container">
            <div class="${type}-card">
                <div class="${type}-icon">${type === 'error' ? '⚠️' : '⚡'}</div>
                <div class="${type}-title">${type === 'error' ? 'Oops! Something went wrong' : 'Connection Issue'}</div>
                <div class="${type}-message">${message}</div>
                ${details ? `<div class="error-details">${details}</div>` : ''}
                ${retryFn ? '<button class="retry-btn" onclick="' + retryFn + '()">🔄 Try Again</button>' : ''}
            </div>
        </div>
    `;

    container.innerHTML = errorHTML;
}

/**
 * Enhanced error logging with context
 * @param {string} context - Where the error occurred
 * @param {Error|string} error - The error object or message
 * @param {Object} additionalInfo - Any additional context
 */
function logError(context, error, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const errorMessage = error.message || error.toString();

    console.group(`❌ [${context}] Error at ${timestamp}`);
    console.error('Message:', errorMessage);
    if (error.stack) console.error('Stack:', error.stack);
    if (Object.keys(additionalInfo).length > 0) {
        console.log('Additional Info:', additionalInfo);
    }
    console.groupEnd();
}

/**
 * Simple UI message update (for backwards compatibility)
 */
function updateUIMessage(selector, message) {
    const container = document.querySelector(selector);
    if (container) {
        container.innerHTML = `<p class="empty-message">${message}</p>`;
    }
}

// Render Public Videos
function renderPublicVideos() {
    const container = document.querySelector('.video-grid');
    if (!container) return;

    // Don't render videos on dedicated player pages
    const currentPath = window.location.pathname;
    // Exact match or includes check for audio player
    if (currentPath.includes('audio-player') || currentPath.includes('news-detail')) {
        return;
    }

    // Show skeleton loaders while data is loading
    if (!publicContentData.videos || publicContentData.videos.length === 0) {
        // Check if we're still loading (no data yet) vs truly empty
        if (!window.publicContentData || window.publicContentData.videos === undefined) {
            container.innerHTML = Array(3).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-thumbnail"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text skeleton-text-short"></div>
                    </div>
                </div>
            `).join('');
            return;
        }

        // Data loaded but empty
        container.innerHTML = '<div class="empty-state"><p class="empty-message">No videos available at the moment.</p></div>';
        return;
    }

    // Limit to 3 on homepage
    const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    const displayVideos = isHomePage ? publicContentData.videos.slice(0, 3) : publicContentData.videos;

    container.innerHTML = displayVideos.map((video, index) => `
        <article class="video-card fade-in" data-index="${index}">
            <div class="video-thumbnail-wrapper" style="position: relative; aspect-ratio: 16/9; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <img src="${video.thumbnail || 'images/logo-placeholder.png'}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease;" onerror="this.src='images/logo-placeholder.png'">
                <!-- Play Overlay -->
                 <div class="video-play-overlay">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2">
                        <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.5)" />
                        <path d="M18 16L34 24L18 32V16Z" fill="#fff" stroke="none"/>
                    </svg>
                 </div>
            </div>
            <div class="video-info" style="padding: 1.25rem;">
                <!-- Title Section -->
                <div style="margin-bottom: 1rem;">
                    <span style="display: block; color: var(--color-text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; opacity: 0.8;">Title</span>
                    <h4 class="video-title" style="font-family: 'Playfair Display', serif; font-size: 1.25rem; margin: 0; color: #fff; line-height: 1.2;">${video.title}</h4>
                </div>

                <!-- Divider -->
                <div style="width: 100%; height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 1rem;"></div>

                <!-- Metadata Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <!-- Category -->
                    <div>
                        <span style="display: block; color: var(--color-text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; opacity: 0.8;">Category</span>
                        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #e0e0e0;">${video.meta || 'Performance'}</div>
                    </div>

                    <!-- Composer (if exists) -->
                    ${video.composedBy ? `
                    <div>
                        <span style="display: block; color: var(--color-text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; opacity: 0.8;">Composer</span>
                        <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; color: var(--color-gold-primary); font-weight: 500;">${video.composedBy}</div>
                    </div>` : ''}
                </div>
            </div>
        </article>
    `).join('');

    // Re-attach event listeners for the new cards
    attachVideoCardListeners();
}

function attachVideoCardListeners() {
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const index = card.dataset.index;
            if (index !== undefined && publicContentData.videos[index]) {
                const video = publicContentData.videos[index];
                // Navigate to video player page
                window.location.href = `video-player.html?id=${video.id || index}`;
            }
        });
    });
}


// Render Public News
function renderPublicNews() {
    const container = document.querySelector('.news-grid');
    if (!container) return;

    // Don't render news on dedicated player pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('video-player.html') || currentPath.includes('audio-player.html')) {
        return;
    }

    // Show skeleton loaders while data is loading
    if (!publicContentData.news || publicContentData.news.length === 0) {
        if (!window.publicContentData || window.publicContentData.news === undefined) {
            container.innerHTML = Array(3).fill(0).map(() => `
                <div class="skeleton-news-card">
                    <div class="skeleton-news-image"></div>
                    <div class="skeleton-news-content">
                        <div class="skeleton-text skeleton-text-short"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text" style="width: 90%;"></div>
                    </div>
                </div>
            `).join('');
            return;
        }
        container.innerHTML = '<div class="empty-state"><p class="empty-message">No news updates available.</p></div>';
        return;
    }

    // Limit to 3 on homepage
    const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    const displayNews = isHomePage ? publicContentData.news.slice(0, 3) : publicContentData.news;

    container.innerHTML = displayNews.map(item => `
        <article class="news-card fade-in">
            <img src="${item.image || 'images/logo-placeholder.png'}" alt="${item.title}" class="news-card-image" onerror="this.src='images/logo-placeholder.png'">
            <div class="news-content">
                <div class="news-date">${item.date}</div>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-excerpt">${item.excerpt}</p>
                <a href="news-detail.html?id=${item.id}" class="news-link">
                    Read full article
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </div>
        </article>
    `).join('');
}

// Render Public Audios
function renderPublicAudios() {
    const container = document.querySelector('.audio-grid');
    if (!container) return;

    // Don't render audios on dedicated player pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('video-player.html') || currentPath.includes('news-detail.html')) {
        return;
    }

    // Show skeleton loaders while data is loading
    if (!publicContentData.audios || publicContentData.audios.length === 0) {
        if (!window.publicContentData || window.publicContentData.audios === undefined) {
            container.innerHTML = Array(4).fill(0).map(() => `
                <div class="skeleton-audio-card">
                    <div class="skeleton-audio-cover"></div>
                    <div class="skeleton-title" style="width: 90%; margin: 0 auto;"></div>
                    <div class="skeleton-text skeleton-text-short" style="margin: 0.5rem auto 0;"></div>
                </div>
            `).join('');
            return;
        }
        container.innerHTML = '<div class="empty-state"><p class="empty-message">No audio tracks available.</p></div>';
        return;
    }

    // Limit to 4 on homepage
    const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    const displayAudios = isHomePage ? publicContentData.audios.slice(0, 4) : publicContentData.audios;

    container.innerHTML = displayAudios.map((audio, index) => `
        <article class="audio-card fade-in" data-index="${index}">
            <div class="audio-cover" style="background-image: url('${audio.cover || 'images/logo-placeholder.png'}');" onerror="this.style.backgroundImage='url(images/logo-placeholder.png)'">
                <button class="audio-play-btn" 
                        data-audio-title="${audio.title}" 
                        data-audio-artist="${audio.artist || audio.composedBy || 'John Onipaba'}" 
                        data-audio-src="${audio.url}" 
                        data-audio-cover="${audio.cover || 'images/logo-placeholder.png'}"
                        data-index="${index}"
                        aria-label="Play ${audio.title}">
                </button>
            </div>
            <div class="audio-info">
                <h4 class="audio-title">${audio.title}</h4>
                <div class="audio-artist">${audio.artist || audio.composedBy || 'John Onipaba'}</div>
                <div class="audio-duration">${audio.duration || '--:--'}</div>
            </div>
        </article>
    `).join('');
}

// Render Public PDFs
function renderPublicPDFs() {
    const container = document.querySelector('.pdf-grid');
    if (!container) return;

    // Don't render PDFs on dedicated player pages
    const currentPath = window.location.pathname;
    if (currentPath.includes('video-player.html') || currentPath.includes('audio-player.html') || currentPath.includes('news-detail.html')) {
        return;
    }

    // Show skeleton loaders while data is loading
    if (!publicContentData.pdfs || publicContentData.pdfs.length === 0) {
        if (!window.publicContentData || window.publicContentData.pdfs === undefined) {
            container.innerHTML = Array(3).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-thumbnail" style="height: 150px;"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text skeleton-text-short"></div>
                    </div>
                </div>
            `).join('');
            return;
        }
        container.innerHTML = '<div class="empty-state"><p class="empty-message">No sheet music available.</p></div>';
        return;
    }

    // Limit to 4 on homepage
    const isHomePage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    const displayPdfs = isHomePage ? publicContentData.pdfs.slice(0, 4) : publicContentData.pdfs;

    container.innerHTML = displayPdfs.map(pdf => `
        <div class="pdf-card">
            <div class="pdf-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <div class="pdf-info">
                <h3 class="pdf-title">${pdf.title}</h3>
                ${pdf.composedBy ? `<p class="pdf-composer">By ${pdf.composedBy}</p>` : ''}
                <p class="pdf-meta">${pdf.description || ''}</p>
                <div class="pdf-actions">
                    <span class="pdf-size">${pdf.size || ''}</span>
                    <button class="btn-download" onclick="forceDownload('${pdf.url}', '${pdf.title}.pdf')" ${!pdf.url ? 'disabled' : ''}>Download</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper to force download for cross-origin URLs
window.forceDownload = async function (url, filename) {
    if (!url || url === '#') return;

    // Find the button that was clicked to show loading state
    const btn = event.target.closest('.btn-download');
    const originalText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        // Fallback: open in new tab if blob fetch fails (e.g. CORS)
        window.open(url, '_blank');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};


// Initialize dynamic content
document.addEventListener('DOMContentLoaded', () => {
    loadPublicContent();
    // Other functions called inside loadPublicContent after fetch
});

// Replaces static newsData
// const newsData = []; // dynamic data is used now logic-wise, but I'll update the variable usage

function initVideoPlayer() {
    const container = document.getElementById('video-player-content');
    if (!container) return; // Not on player page

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = '<p class="error-message">Video not specified.</p>';
        return;
    }

    // Find video by ID or Index (fallback)
    let video = publicContentData.videos.find(v => v.id == id);
    if (!video && !isNaN(id) && publicContentData.videos[id]) {
        video = publicContentData.videos[id];
    }

    if (video) {
        const url = video.url || '';
        const poster = video.thumbnail || 'images/logo-placeholder.png';
        let playerHtml = '';

        // YouTube Detection & Player Construction
        let videoId = '';
        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(youtubeRegex);

        if (match && match[1]) {
            videoId = match[1];
        } else if (url.length === 11) {
            videoId = url;
        }

        if (videoId) {
            playerHtml = `
                <div class="youtube-preview" id="ytPreview" onclick="loadYoutubeIframe('${videoId}')">
                    <img src="${poster}" alt="${video.title}" class="preview-poster">
                    <div class="video-play-overlay" style="opacity: 1;">
                        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2">
                            <circle cx="24" cy="24" r="22" fill="rgba(0,0,0,0.6)" />
                            <path d="M18 16L34 24L18 32V16Z" fill="#fff" stroke="none"/>
                        </svg>
                    </div>
                </div>
            `;
        } else if (url.includes('firebasestorage.googleapis.com') || url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
            // Direct Video with Poster and no autoplay
            playerHtml = `
                <video controls preload="metadata" poster="${poster}" style="width: 100%; height: 100%;">
                    <source src="${url}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            playerHtml = `
                <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#fff; flex-direction:column; text-align: center; padding: 2rem;">
                    <p style="margin-bottom: 1rem; font-size: 1.1rem;">Video format not directly embeddable or URL is missing.</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 4px; margin-bottom: 1rem; word-break: break-all; font-family: monospace; font-size: 0.9rem;">${url || 'No URL provided'}</div>
                    ${url ? `<a href="${url}" target="_blank" class="btn btn-primary">Watch on External Site</a>` : ''}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="player-wrapper">
                ${playerHtml}
            </div>
            
            <div class="video-info-container">
                <div class="video-header-section">
                    <h1 class="video-player-title">${video.title}</h1>
                    <div class="video-player-meta">
                        <div class="meta-item">
                            <strong>Category</strong>
                            <span>${video.meta || 'Performance'}</span>
                        </div>
                        ${video.composedBy ? `
                        <div class="meta-item">
                            <strong>Composer</strong>
                            <span>${video.composedBy}</span>
                        </div>` : ''}
                        <div class="meta-item">
                            <strong>Date</strong>
                            <span>${video.date || 'Recently Added'}</span>
                        </div>
                    </div>
                </div>

                ${video.description ? `
                <div class="video-description">
                    <h3 class="description-title">About this Video</h3>
                    <p>${video.description}</p>
                </div>` : ''}

                <!-- Share Buttons -->
                <div class="share-buttons">
                    <span class="share-label">Share:</span>
                    <button onclick="shareContent('whatsapp')" class="share-btn share-btn-whatsapp" title="Share on WhatsApp">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </button>
                    <button onclick="shareContent('facebook')" class="share-btn share-btn-facebook" title="Share on Facebook">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </button>
                    <button onclick="shareContent('twitter')" class="share-btn share-btn-twitter" title="Share on X (Twitter)">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                    </button>
                    <button onclick="shareContent('copy')" class="share-btn share-btn-copy" title="Copy Link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = '<p class="error-message">Video not found.</p>';
    }
}

// Global function to load YouTube iframe on click
window.loadYoutubeIframe = function (videoId) {
    const preview = document.getElementById('ytPreview');
    if (preview) {
        preview.outerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
}

window.initNewsDetail = function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('news-detail-content');

    if (!container) return; // Not on detail page

    if (!id) {
        container.innerHTML = '<p>Article not found.</p>';
        return;
    }

    // Use dynamic data
    const article = publicContentData.news.find(item => item.id == id); // Loose equality for potential string/number mix

    if (article) {
        container.innerHTML = `
            <div class="news-detail-title-block" style="margin-top: 2rem;">
                 <div class="news-detail-meta">${article.date}</div>
                 <h1 class="news-detail-title">${article.title}</h1>
            </div>
            
            <div class="news-detail-image-container">
                <img src="${article.image || 'images/logo-placeholder.png'}" alt="${article.title}" class="news-detail-image" onerror="this.src='images/logo-placeholder.png'">
            </div>

            <div class="news-detail-content">
                ${article.content ? article.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('') : ''}
            </div>

            <!-- Share Buttons -->
            <div class="share-buttons" style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
                <span class="share-label">Share Article:</span>
                <button onclick="shareContent('whatsapp')" class="share-btn share-btn-whatsapp" title="Share on WhatsApp">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </button>
                <button onclick="shareContent('facebook')" class="share-btn share-btn-facebook" title="Share on Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button onclick="shareContent('twitter')" class="share-btn share-btn-twitter" title="Share on X (Twitter)">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                </button>
                <button onclick="shareContent('copy')" class="share-btn share-btn-copy" title="Copy Link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </button>
            </div>
        `;
    } else {
        container.innerHTML = '<p class="error-message">Article not found.</p>';
    }
};

window.initAudioPlayer = function () {
    const container = document.getElementById('audio-player-content');
    if (!container) return; // Not on player page

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        container.innerHTML = '<p class="error-message">Audio track not specified.</p>';
        return;
    }

    // Find audio by ID or Index (fallback)
    let audio = publicContentData.audios.find(a => a.id == id);
    if (!audio && !isNaN(id) && publicContentData.audios[id]) {
        audio = publicContentData.audios[id];
    }

    if (audio) {
        const url = audio.url || '';
        const cover = audio.cover || 'images/logo-placeholder.png';
        const artist = audio.artist || audio.composedBy || 'John Onipaba';

        container.innerHTML = `
            <div class="audio-player-layout">
                <div class="audio-visual-section">
                    <div class="audio-main-cover">
                        <img src="${cover}" alt="${audio.title}" class="player-cover-img" onerror="this.src='images/logo-placeholder.png'">
                        <div class="playback-ring"></div>
                    </div>
                </div>
                
                <div class="audio-info-container">
                    <div class="audio-header-section">
                        <h1 class="audio-player-title">${audio.title}</h1>
                        <p class="audio-player-subtitle">${artist}</p>
                        
                        <div class="audio-player-meta">
                            <div class="meta-item">
                                <strong>Category</strong>
                                <span>${audio.category || 'Choral'}</span>
                            </div>
                            <div class="meta-item">
                                <strong>Duration</strong>
                                <span>${audio.duration || '--:--'}</span>
                            </div>
                            ${audio.date ? `
                            <div class="meta-item">
                                <strong>Release Date</strong>
                                <span>${audio.date}</span>
                            </div>` : ''}
                        </div>
                    </div>

                    <div class="custom-audio-player" id="mainAudioPlayer">
                        <div class="player-controls-main">
                            <button class="control-btn" id="mainPrev"><span class="material-icons">skip_previous</span></button>
                            <button class="control-btn play-main" id="mainPlayPause"><span class="material-icons">play_arrow</span></button>
                            <button class="control-btn" id="mainNext"><span class="material-icons">skip_next</span></button>
                        </div>
                        
                        <div class="player-progress-area">
                            <span id="mainCurrentTime">0:00</span>
                            <div class="main-progress-bar-wrapper" id="mainProgressWrapper">
                                <div class="main-progress-bar" id="mainProgressBar" style="width: 0%"></div>
                            </div>
                            <span id="mainDuration">${audio.duration || '0:00'}</span>
                        </div>
                        
                        <div class="player-extra-controls">
                            <div class="volume-control-main">
                                <span class="material-icons">volume_up</span>
                                <div class="main-volume-slider" id="mainVolumeSlider">
                                    <div class="main-volume-level" id="mainVolumeLevel" style="width: 80%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${audio.description ? `
                    <div class="audio-description">
                        <h3 class="description-title">About this Track</h3>
                        <p>${audio.description}</p>
                    </div>` : ''}

                    <!-- Share Buttons -->
                    <div class="share-buttons" style="margin-top: 1rem;">
                        <span class="share-label">Share:</span>
                        <button onclick="shareContent('whatsapp')" class="share-btn share-btn-whatsapp" title="Share on WhatsApp">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </button>
                        <button onclick="shareContent('facebook')" class="share-btn share-btn-facebook" title="Share on Facebook">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </button>
                        <button onclick="shareContent('twitter')" class="share-btn share-btn-twitter" title="Share on X (Twitter)">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </button>
                        <button onclick="shareContent('copy')" class="share-btn share-btn-copy" title="Copy Link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize Audio Object & Controls
        setupMainAudioControls(url);
    } else {
        container.innerHTML = '<p class="error-message">Audio track not found.</p>';
    }
};

function setupMainAudioControls(url) {
    const playBtn = document.getElementById('mainPlayPause');
    const prevBtn = document.getElementById('mainPrev');
    const nextBtn = document.getElementById('mainNext');
    const progressWrapper = document.getElementById('mainProgressWrapper');
    const progressBar = document.getElementById('mainProgressBar');
    const currentTimeEl = document.getElementById('mainCurrentTime');
    const durationEl = document.getElementById('mainDuration');
    const volumeSlider = document.getElementById('mainVolumeSlider');
    const volumeLevel = document.getElementById('mainVolumeLevel');

    if (!playBtn) return;

    // Use the existing currentAudio object from script.js global scope
    currentAudio.src = url;
    currentAudio.load();

    const updateControls = () => {
        const icon = playBtn.querySelector('.material-icons');
        icon.textContent = currentAudio.paused ? 'play_arrow' : 'pause';
    };

    playBtn.addEventListener('click', () => {
        if (currentAudio.paused) {
            currentAudio.play();
        } else {
            currentAudio.pause();
        }
        updateControls();
    });

    currentAudio.addEventListener('play', updateControls);
    currentAudio.addEventListener('pause', updateControls);

    currentAudio.addEventListener('timeupdate', () => {
        const { currentTime, duration } = currentAudio;
        if (isNaN(duration)) return;

        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
        durationEl.textContent = formatTime(duration);
    });

    // Progress Seeker
    progressWrapper.addEventListener('click', (e) => {
        const rect = progressWrapper.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const duration = currentAudio.duration;
        if (!isNaN(duration) && width > 0) {
            currentAudio.currentTime = (offsetX / width) * duration;
        }
    });

    // Volume Seeker
    if (volumeSlider) {
        volumeSlider.addEventListener('click', (e) => {
            const rect = volumeSlider.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const volume = Math.max(0, Math.min(1, offsetX / rect.width));
            currentAudio.volume = volume;
            volumeLevel.style.width = `${volume * 100}%`;
        });
    }

    // Local prev/next rely on finding index in publicContentData
    prevBtn.addEventListener('click', () => {
        const id = new URLSearchParams(window.location.search).get('id');
        let index = publicContentData.audios.findIndex(a => a.id == id);
        if (index === -1 && !isNaN(id)) index = parseInt(id);

        if (index > 0) {
            const prevAudio = publicContentData.audios[index - 1];
            window.location.href = `audio-player.html?id=${prevAudio.id || (index - 1)}`;
        }
    });

    nextBtn.addEventListener('click', () => {
        const id = new URLSearchParams(window.location.search).get('id');
        let index = publicContentData.audios.findIndex(a => a.id == id);
        if (index === -1 && !isNaN(id)) index = parseInt(id);

        if (index < publicContentData.audios.length - 1) {
            const nextAudio = publicContentData.audios[index + 1];
            window.location.href = `audio-player.html?id=${nextAudio.id || (index + 1)}`;
        }
    });
}

console.log('%c🎵 Onipaba Music Website', 'font-size: 20px; font-weight: bold; color: #D4AF37;');


// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================
// (Modal creation code remains before this block)
const searchTrigger = document.getElementById('searchTrigger');
const searchModal = document.getElementById('searchModal');
const searchClose = document.getElementById('searchClose');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// ...

// Search Index (Dynamic)
let searchIndex = [];

function updateSearchIndex() {
    searchIndex = [];

    // Add News
    if (publicContentData.news) {
        publicContentData.news.forEach(item => {
            searchIndex.push({
                title: item.title,
                type: 'News',
                link: `news-detail.html?id=${item.id}`,
                image: item.image || 'images/logo-placeholder.png'
            });
        });
    }

    // Add Videos
    if (publicContentData.videos) {
        publicContentData.videos.forEach(item => {
            searchIndex.push({
                title: item.title,
                type: 'Video',
                link: `video-player.html?id=${item.id}`,
                image: item.thumbnail || 'images/logo-placeholder.png'
            });
        });
    }

    // Add PDFs
    if (publicContentData.pdfs) {
        publicContentData.pdfs.forEach(item => {
            searchIndex.push({
                title: item.title,
                type: 'PDF',
                link: 'pdfs.html',
                image: 'images/file.svg' // Placeholder icon
            });
        });
    }

    // Add Audios
    if (publicContentData.audios) {
        publicContentData.audios.forEach(item => {
            searchIndex.push({
                title: item.title,
                type: 'Audio',
                link: `audio-player.html?id=${item.id}`,
                image: item.cover || 'images/audio.svg'
            });
        });
    }
}


function toggleSearch() {
    searchModal.classList.toggle('active');
    if (searchModal.classList.contains('active')) {
        setTimeout(() => searchInput.focus(), 100);
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
        searchInput.value = '';
        searchResults.innerHTML = '';
    }
}

if (searchTrigger) {
    searchTrigger.addEventListener('click', toggleSearch);
}

if (searchClose) {
    searchClose.addEventListener('click', toggleSearch);
}

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
        toggleSearch();
    }
});

// Search Logic
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 2) return;

        const matches = searchIndex.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            matches.forEach(item => {
                const resultItem = document.createElement('a');
                resultItem.href = item.link;
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="result-image" onerror="this.src='images/logo-placeholder.png'">
                <div class="result-info">
                    <span class="result-type">${item.type}</span>
                    <span class="result-title">${item.title}</span>
                </div>
            `;
                resultItem.addEventListener('click', toggleSearch);
                searchResults.appendChild(resultItem);
            });

        } else {
            searchResults.innerHTML = '<div class="no-results">No matches found</div>';
        }
    });
}

// ==========================================
// NEWSLETTER FORM
// ==========================================
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = newsletterForm.querySelector('.newsletter-btn');
        const input = newsletterForm.querySelector('.newsletter-input');
        const originalText = btn.textContent;

        btn.textContent = 'Subscribing...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = 'Subscribed!';
            if (input) input.value = '';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// ==========================================
// CUSTOM ALERT & CONFIRM MODALS
// ==========================================

// Create and show custom alert modal
function showAlert(message, type = 'info') {
    // Remove existing alert if any
    const existingAlert = document.getElementById('customAlertModal');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Determine icon and color based on type
    let icon, colorClass;
    switch (type) {
        case 'success':
            icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#22c55e" stroke-width="3">
                        <circle cx="24" cy="24" r="20"/>
                        <path d="M14 24L20 30L34 16" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>`;
            colorClass = 'alert-success';
            break;
        case 'error':
            icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#ef4444" stroke-width="3">
                        <circle cx="24" cy="24" r="20"/>
                        <line x1="16" y1="16" x2="32" y2="32" stroke-linecap="round"/>
                        <line x1="32" y1="16" x2="16" y2="32" stroke-linecap="round"/>
                    </svg>`;
            colorClass = 'alert-error';
            break;
        case 'warning':
            icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#eab308" stroke-width="3">
                        <path d="M24 4L44 40H4L24 4Z"/>
                        <line x1="24" y1="18" x2="24" y2="28" stroke-linecap="round"/>
                        <circle cx="24" cy="34" r="1.5" fill="#eab308"/>
                    </svg>`;
            colorClass = 'alert-warning';
            break;
        default:
            icon = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#3b82f6" stroke-width="3">
                        <circle cx="24" cy="24" r="20"/>
                        <line x1="24" y1="16" x2="24" y2="26" stroke-linecap="round"/>
                        <circle cx="24" cy="32" r="1.5" fill="#3b82f6"/>
                    </svg>`;
            colorClass = 'alert-info';
    }

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'customAlertModal';
    modal.className = 'custom-alert-overlay';
    modal.innerHTML = `
        <div class="custom-alert-modal ${colorClass}">
            <div class="alert-icon">${icon}</div>
            <div class="alert-message">${message}</div>
            <button class="alert-close-btn" onclick="closeAlert()">OK</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// Close alert modal
function closeAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}
window.closeAlert = closeAlert; // Expose globally

// Create and show custom confirm modal
window.showConfirm = function (message, onConfirm) {
    // Remove existing modal if any
    const existingModal = document.getElementById('customConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'customConfirmModal';
    modal.className = 'custom-alert-overlay'; // Reuse same overlay class
    modal.innerHTML = `
        <div class="custom-alert-modal alert-warning">
            <div class="alert-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#eab308" stroke-width="3">
                    <circle cx="24" cy="24" r="20"/>
                    <path d="M24 14V28" stroke-linecap="round"/>
                    <circle cx="24" cy="34" r="1.5" fill="#eab308"/>
                </svg>
            </div>
            <div class="alert-message">${message}</div>
            <div class="alert-actions">
                <button class="alert-btn-cancel" onclick="closeConfirm()">Cancel</button>
                <button class="alert-btn-confirm" id="confirmBtnAction">Yes, Proceed</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    document.getElementById('confirmBtnAction').addEventListener('click', function () {
        closeConfirm();
        if (onConfirm) onConfirm();
    });

    // Animate in
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
};

// Close confirm modal
window.closeConfirm = function () {
    const modal = document.getElementById('customConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Override native alert
window.alert = function (message) {
    showAlert(message, 'info');
};

// Enhanced alert function with types
window.showSuccessAlert = function (message) {
    showAlert(message, 'success');
};

window.showErrorAlert = function (message) {
    showAlert(message, 'error');
};

window.showWarningAlert = function (message) {
    showAlert(message, 'warning');
};

// ==========================================
// FORM SUBMISSION HANDLERS (Contact & Newsletter)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            try {
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase is not loaded. Please check your connection or try again later.');
                }
                await firebase.firestore().collection('inquiries').add({
                    name: name,
                    email: email,
                    subject: subject,
                    message: message,
                    status: 'new', // For admin to track
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    read: false
                });

                window.showSuccessAlert('Message sent successfully! We will get back to you soon.');
                contactForm.reset();
            } catch (error) {
                console.error("Error sending message:", error);
                window.showErrorAlert('Failed to send message. Please try again later.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // 2. Newsletter Form Handler
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value;
            const originalText = submitBtn.textContent;

            submitBtn.textContent = '...';
            submitBtn.disabled = true;

            try {
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase is not loaded.');
                }
                // Check if already subscribed
                const snapshot = await firebase.firestore().collection('subscribers')
                    .where('email', '==', email).get();

                if (!snapshot.empty) {
                    window.showWarningAlert('You are already subscribed to our newsletter!');
                    newsletterForm.reset();
                    return;
                }

                await firebase.firestore().collection('subscribers').add({
                    email: email,
                    subscribedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    active: true
                });

                window.showSuccessAlert('Thank you for subscribing!');
                newsletterForm.reset();
            } catch (error) {
                console.error("Error subscribing:", error);
                window.showErrorAlert('Failed to subscribe. Please try again.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
// ==========================================
// SOCIAL SHARING HELPER
// ==========================================
window.shareContent = async function (type, url = window.location.href, title = document.title) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (type) {
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
            break;
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
            break;
        case 'copy':
            try {
                await navigator.clipboard.writeText(url);
                window.uiManager.showToast('Link copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy:', err);
                window.uiManager.showToast('Failed to copy link', 'error');
            }
            break;
        case 'native':
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: title,
                        text: `Check this out on Onipaba Music: ${title}`,
                        url: url
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Error sharing:', err);
                }
            } else {
                // Fallback to copy if native share not supported
                shareContent('copy', url, title);
            }
            break;
    }
};

// ==========================================
// DYNAMIC CONTENT (Settings & Team)
// ==========================================

async function loadSiteSettings() {
    try {
        if (typeof firebase === 'undefined' || typeof db === 'undefined') {
            console.warn("Firebase not initialized.");
            return;
        }

        const doc = await db.collection('settings').doc('general').get();
        if (doc.exists) {
            const data = doc.data();

            // 1. Render Navbar
            if (data.navLinks && data.navLinks.length > 0) {
                const navContainer = document.querySelector('.nav');
                if (navContainer) {
                    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
                    navContainer.innerHTML = data.navLinks.map(link =>
                        `<a href="${link.url}" class="nav-link ${currentPath === link.url ? 'active' : ''}">${link.text}</a>`
                    ).join('');
                }
            }

            // 2. Render Footer
            if (data.footerSettings) {
                const footerBrand = document.querySelector('.footer-brand');
                if (footerBrand) {
                    const p = footerBrand.querySelector('p');
                    if (p && data.footerSettings.description) p.textContent = data.footerSettings.description;
                }

                const footerBottom = document.querySelector('.footer-bottom p');
                if (footerBottom && data.footerSettings.copyright) footerBottom.textContent = data.footerSettings.copyright;

                // Newsletter title check if needed
                if (data.footerSettings.newsletter) {
                    const newsHeader = document.querySelector('.newsletter-section h3');
                    if (newsHeader) newsHeader.textContent = data.footerSettings.newsletter;
                }
            }

            // 3. Render Social Links (Contact Page & Footer if implemented)
            const social = data.socialSettings;
            if (social) {
                // Contact Page Links
                if (document.getElementById('contact-facebook') && social.facebook) document.getElementById('contact-facebook').href = social.facebook;
                if (document.getElementById('contact-twitter') && social.twitter) document.getElementById('contact-twitter').href = social.twitter;
                if (document.getElementById('contact-instagram') && social.instagram) document.getElementById('contact-instagram').href = social.instagram;
                if (document.getElementById('contact-youtube') && social.youtube) document.getElementById('contact-youtube').href = social.youtube;
            }
        }
    } catch (error) {
        console.warn("Could not load site settings:", error);
    }
}

async function loadTeamMembers() {
    const teamGrid = document.getElementById('teamGrid');
    if (!teamGrid) return; // Not on about page

    try {
        if (typeof db === 'undefined') {
            return;
        }

        const snapshot = await db.collection('team').orderBy('order').get();

        if (snapshot.empty) {
            teamGrid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No team members found.</p>';
            return;
        }

        teamGrid.innerHTML = snapshot.docs.map(doc => {
            const member = doc.data();
            const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return `
            <div class="team-card">
                ${member.image
                    ? `<img src="${member.image}" alt="${member.name}" class="team-avatar-img" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; border: 2px solid var(--color-gold-primary);">`
                    : `<div class="team-avatar">${initials}</div>`
                }
                <div class="team-name">${member.name}</div>
                <div class="team-role">${member.role}</div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Error loading team members:", error);
        teamGrid.innerHTML = '<p style="text-align: center;">Our team is loading...</p>';
    }
}

// Initialize Dynamic Content
document.addEventListener('DOMContentLoaded', () => {
    loadSiteSettings();
    loadTeamMembers();
});

// ==========================================
// MOBILE CHAT MENU TOGGLE
// ==========================================
// Expose globally to ensure HTML onclick can find it
window.toggleMobileMenu = function () {
    console.log('Toggle Mobile Menu Clicked'); // Debugging
    const menu = document.getElementById('mobileMoreMenu');
    if (!menu) {
        console.error('Menu element not found!');
        return;
    }

    // Check if currently visible
    const isVisible = menu.style.display === 'flex';

    // Close other menus first if needed
    const emojiMenu = document.getElementById('emojiPickerMenu');
    if (emojiMenu) emojiMenu.style.display = 'none';

    // Toggle
    menu.style.display = isVisible ? 'none' : 'flex';
    console.log('Menu display set to:', menu.style.display);
};

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobileMoreMenu');
    const btn = document.getElementById('mobileMenuBtn');

    if (menu && menu.style.display === 'flex') {
        if (e.target !== menu && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            menu.style.display = 'none';
        }
    }
});
