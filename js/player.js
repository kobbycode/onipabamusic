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

    const isYoutube = videoData.url?.includes('youtube.com') || videoData.url?.includes('youtu.be');

    if (isYoutube) {
        const videoId = videoData.url.split('v=')[1] || videoData.url.split('/').pop();
        container.innerHTML = `
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="video-container">
                <video controls crossorigin playsinline>
                    <source src="${videoData.url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    }
};
