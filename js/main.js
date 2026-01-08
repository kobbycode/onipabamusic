/**
 * Main Application Entry Point
 */
import {
    initRippleEffect,
    initRevealScroll,
    initHeaderScroll,
    highlightActiveNav
} from "./ui.js";
import {
    fetchCollection,
    fetchDocument,
    initAuthListener,
    publicContentData
} from "./services.js";
import {
    renderVideos,
    renderAudios,
    renderNews,
    renderPDFs
} from "./renderer.js";
import { setupAudioPlayer, initVideoPlayer } from "./player.js";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. UI Setup
    initRippleEffect();
    initRevealScroll();
    initHeaderScroll();
    highlightActiveNav();

    // 2. Auth Context
    initAuthListener((user) => {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            if (user) {
                loginBtn.innerHTML = '<span class="material-icons">person</span> Profile';
                loginBtn.href = 'profile.html';
            } else {
                loginBtn.innerHTML = '<span class="material-icons">login</span> Login';
                loginBtn.href = 'login.html';
            }
        }
    });

    // 3. Content Loading Logic
    const page = window.location.pathname.split('/').pop() || 'index.html';

    // Helper to observe targets after rendering
    const observeNewItems = () => {
        setTimeout(initRevealScroll, 100);
    };

    if (page === 'index.html' || page === '') {
        const videos = await fetchCollection('videos');
        renderVideos(document.querySelector('.video-grid'), videos?.slice(0, 3));

        const audios = await fetchCollection('audios');
        renderAudios(document.querySelector('.audio-grid'), audios?.slice(0, 4));

        const news = await fetchCollection('news');
        renderNews(document.querySelector('.news-grid'), news?.slice(0, 2));

        const pdfs = await fetchCollection('pdfs');
        renderPDFs(document.querySelector('.pdf-grid'), pdfs?.slice(0, 3));

        observeNewItems();
    } else if (page === 'videos.html') {
        const videos = await fetchCollection('videos');
        renderVideos(document.querySelector('.video-grid'), videos);
        observeNewItems();
    } else if (page === 'audios.html') {
        const audios = await fetchCollection('audios');
        renderAudios(document.querySelector('.audio-grid'), audios);
        observeNewItems();
    } else if (page === 'news.html') {
        const news = await fetchCollection('news');
        renderNews(document.querySelector('.news-grid'), news);
        observeNewItems();
    } else if (page === 'pdfs.html') {
        const pdfs = await fetchCollection('pdfs');
        renderPDFs(document.querySelector('.pdf-grid'), pdfs);
        observeNewItems();
    } else if (page.includes('video-player')) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            const video = await fetchDocument('videos', id);
            if (video) {
                initVideoPlayer(video);
            } else {
                console.error('Video not found:', id);
            }
        }
    } else if (page.includes('audio-player')) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            const audio = await fetchDocument('audios', id);
            if (audio) {
                setupAudioPlayer(audio);
            } else {
                console.error('Audio not found:', id);
            }
        }
    }
});
