/**
 * Media Player Management (Audio & Video)
 */
import { formatTime, logError } from "./utils.js";

// Global Audio Instance
const globalAudio = new Audio();
let isPlaying = false;

export const initGlobalPlayer = () => {
    // Logic for the persistent floating player (if applicable)
    // and handling audio card clicks
    document.addEventListener('click', (e) => {
        const audioCard = e.target.closest('.audio-card');
        if (audioCard) {
            // Already handled by renderer (navigation), but can add global play logic here
        }
    });
};

export const setupAudioPlayer = (audioData) => {
    const playBtn = document.getElementById('mainPlayPause');
    const progressBar = document.getElementById('mainProgressBar');
    const currentTimeEl = document.getElementById('mainCurrentTime');
    const durationEl = document.getElementById('mainDuration');
    const progressWrapper = document.getElementById('mainProgressWrapper');

    if (!playBtn || !audioData) return;

    globalAudio.src = audioData.url;
    globalAudio.load();

    const togglePlay = () => {
        if (globalAudio.paused) {
            globalAudio.play();
        } else {
            globalAudio.pause();
        }
        updateIcon();
    };

    const updateIcon = () => {
        const icon = playBtn.querySelector('.material-icons');
        if (icon) icon.textContent = globalAudio.paused ? 'play_arrow' : 'pause';
    };

    playBtn.addEventListener('click', togglePlay);

    globalAudio.addEventListener('timeupdate', () => {
        const { currentTime, duration } = globalAudio;
        if (isNaN(duration)) return;

        const percent = (currentTime / duration) * 100;
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
        if (durationEl) durationEl.textContent = formatTime(duration);
    });

    if (progressWrapper) {
        progressWrapper.addEventListener('click', (e) => {
            const rect = progressWrapper.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            globalAudio.currentTime = pos * globalAudio.duration;
        });
    }

    globalAudio.addEventListener('play', updateIcon);
    globalAudio.addEventListener('pause', updateIcon);
};

export const initVideoPlayer = (videoData) => {
    const container = document.getElementById('video-player-content');
    if (!container || !videoData) return;

    const url = videoData.url || '';
    const poster = videoData.thumbnail || 'images/logo-placeholder.png';
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

    let playerHtml = '';
    if (isYoutube) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        playerHtml = `
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
            </div>
        `;
    } else {
        playerHtml = `
            <div class="video-container">
                <video controls crossorigin playsinline poster="${poster}" style="width: 100%; height: 100%;">
                    <source src="${url}">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="player-wrapper">
            ${playerHtml}
        </div>
        
        <div class="video-info-container">
            <div class="video-header-section">
                <h1 class="video-player-title">${videoData.title}</h1>
                <div class="video-player-meta">
                    <div class="meta-item">
                        <strong>Category</strong>
                        <span>${videoData.meta || videoData.category || 'Performance'}</span>
                    </div>
                    ${videoData.composedBy ? `
                    <div class="meta-item">
                        <strong>Composer</strong>
                        <span>${videoData.composedBy}</span>
                    </div>` : ''}
                    <div class="meta-item">
                        <strong>Date</strong>
                        <span>${videoData.date || 'Recently Added'}</span>
                    </div>
                </div>
            </div>

            ${videoData.description ? `
            <div class="video-description">
                <h3 class="description-title">About this Video</h3>
                <p>${videoData.description}</p>
            </div>` : ''}

            <!-- Share Buttons -->
            <div class="share-buttons" style="margin-top: 2rem;">
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
};
