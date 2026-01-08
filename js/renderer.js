/**
 * Renderer for Onipaba Music
 */
import { formatDate } from "./utils.js";

export const renderVideos = (container, videos, append = false) => {
    if (!container) return;
    if (!append) container.innerHTML = '';

    if (!videos || videos.length === 0) {
        if (!append) container.innerHTML = `
            <div class="empty-state-premium">
                <span class="material-icons">movie_filter</span>
                <p>New performances are being curated. Check back soon!</p>
            </div>`;
        return;
    }

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card reveal-scale';
        card.innerHTML = `
            <div class="video-thumbnail" style="background-image: url('${video.thumbnail || 'images/video-1.png'}')">
                <div class="video-play-overlay">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
                ${video.duration ? `<span class="video-duration">${video.duration}</span>` : ''}
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-meta">${video.category || 'Performance'}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `video-player.html?id=${video.id}`;
        });
        container.appendChild(card);
    });
};

export const renderAudios = (container, audios, append = false) => {
    if (!container) return;
    if (!append) container.innerHTML = '';

    if (!audios || audios.length === 0) {
        if (!append) container.innerHTML = `
            <div class="empty-state-premium">
                <span class="material-icons">library_music</span>
                <p>Musical tracks are being recorded. Stay tuned!</p>
            </div>`;
        return;
    }

    audios.forEach(audio => {
        const card = document.createElement('div');
        card.className = 'audio-card reveal-scale';
        card.innerHTML = `
            <div class="audio-cover" style="background-image: url('${audio.cover || 'images/logo-placeholder.png'}')">
                <div class="audio-play-btn">
                    <span class="material-icons">play_arrow</span>
                </div>
            </div>
            <div class="audio-info">
                <h4 class="audio-title">${audio.title}</h4>
                <p class="audio-artist">${audio.artist || audio.composedBy || 'Japheth Onipaba'}</p>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `audio-player.html?id=${audio.id}`;
        });
        container.appendChild(card);
    });
};

export const renderNews = (container, news, append = false) => {
    if (!container) return;
    if (!append) container.innerHTML = '';

    if (!news || news.length === 0) {
        if (!append) container.innerHTML = `
            <div class="empty-state-premium">
                <span class="material-icons">newspaper</span>
                <p>No recent updates. Check our social media for quick news!</p>
            </div>`;
        return;
    }

    news.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card reveal';
        card.innerHTML = `
            <div class="news-image">
                <img src="${item.image || 'images/logo-placeholder.png'}" alt="${item.title}" loading="lazy">
            </div>
            <div class="news-content">
                <span class="news-date">${item.date || ''}</span>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-excerpt">${item.excerpt || (item.content ? item.content.substring(0, 100) + '...' : '')}</p>
                <a href="news-detail.html?id=${item.id}" class="news-link">Read More →</a>
            </div>
        `;
        container.appendChild(card);
    });
};

export const renderPDFs = (container, pdfs, append = false) => {
    if (!container) return;
    if (!append) container.innerHTML = '';

    if (!pdfs || pdfs.length === 0) {
        if (!append) container.innerHTML = `
            <div class="empty-state-premium">
                <span class="material-icons">description</span>
                <p>Sheet music is being transcribed. Check back later!</p>
            </div>`;
        return;
    }

    pdfs.forEach(pdf => {
        const card = document.createElement('div');
        card.className = 'pdf-card reveal';
        card.innerHTML = `
            <div class="pdf-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>
            <div class="pdf-info">
                <h4 class="pdf-title">${pdf.title}</h4>
                <p class="pdf-meta">${pdf.category || 'Sheet Music'}</p>
                <a href="${pdf.url}" target="_blank" class="pdf-download-link">Download PDF</a>
            </div>
        `;
        container.appendChild(card);
    });
};

export const renderSettings = (settings) => {
    if (!settings) return;

    // 1. Render Navbar
    if (settings.navLinks && settings.navLinks.length > 0) {
        const navContainer = document.querySelector('.nav');
        if (navContainer) {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            navContainer.innerHTML = settings.navLinks.map(link =>
                `<a href="${link.url}" class="nav-link ${currentPath === link.url ? 'active' : ''}">${link.text}</a>`
            ).join('');
        }
    }

    // 2. Render Footer
    if (settings.footerSettings) {
        const footerBrand = document.querySelector('.footer-brand');
        if (footerBrand) {
            const p = footerBrand.querySelector('p');
            if (p && settings.footerSettings.description) p.textContent = settings.footerSettings.description;

            // Handle footer title if exists in HTML but it's usually just description in our current HTML
        }

        const footerBottom = document.querySelector('.footer-bottom p');
        if (footerBottom && settings.footerSettings.copyright) {
            footerBottom.textContent = settings.footerSettings.copyright;
        }

        if (settings.footerSettings.newsletter) {
            const newsHeader = document.querySelector('.newsletter-section h3');
            if (newsHeader) newsHeader.textContent = settings.footerSettings.newsletter;
        }
    }

    // 3. Render Social Links
    const social = settings.socialSettings;
    if (social) {
        const facebookLinks = document.querySelectorAll('a[href*="facebook.com"], #contact-facebook');
        const twitterLinks = document.querySelectorAll('a[href*="twitter.com"], #contact-twitter');
        const instagramLinks = document.querySelectorAll('a[href*="instagram.com"], #contact-instagram');
        const youtubeLinks = document.querySelectorAll('a[href*="youtube.com"], #contact-youtube');

        if (social.facebook) facebookLinks.forEach(link => link.href = social.facebook);
        if (social.twitter) twitterLinks.forEach(link => link.href = social.twitter);
        if (social.instagram) instagramLinks.forEach(link => link.href = social.instagram);
        if (social.youtube) youtubeLinks.forEach(link => link.href = social.youtube);
    }
};
