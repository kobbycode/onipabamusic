export class SearchManager {
    constructor() {
        this.modal = document.getElementById('searchModal');
        this.input = document.getElementById('searchInput');
        this.resultsContainer = document.getElementById('searchResults');
        this.closeBtn = document.getElementById('searchClose');
        this.triggerBtn = document.getElementById('searchTrigger');

        this.isOpen = false;
        this.data = {
            videos: [],
            audios: [],
            news: []
        };

        this.init();
    }

    init() {
        if (!this.modal || !this.input || !this.triggerBtn) {
            return;
        }

        // Event Listeners
        this.triggerBtn.addEventListener('click', () => this.openSearch());

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeSearch());
        }

        // Close on click outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeSearch();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.closeSearch();
        });

        // Search Input Handler (Debounced)
        let debounceTimer;
        this.input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
    }

    setSearchData(data) {
        this.data = data;
    }

    openSearch() {
        this.modal.classList.add('active');
        this.input.focus();
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    closeSearch() {
        this.modal.classList.remove('active');
        this.input.value = '';
        this.resultsContainer.innerHTML = '';
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    performSearch(query) {
        if (!query || query.trim().length < 2) {
            this.resultsContainer.innerHTML = '';
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const results = {
            videos: this.filterCollection(this.data.videos, searchTerm),
            audios: this.filterCollection(this.data.audios, searchTerm),
            news: this.filterCollection(this.data.news, searchTerm)
        };

        this.renderResults(results, searchTerm);
    }

    filterCollection(collection, term) {
        if (!collection) return [];
        return collection.filter(item => {
            const title = (item.title || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const artist = (item.artist || item.composedBy || '').toLowerCase();
            const category = (item.category || item.meta || '').toLowerCase();

            return title.includes(term) ||
                description.includes(term) ||
                artist.includes(term) ||
                category.includes(term);
        });
    }

    renderResults(results, term) {
        const totalResults = results.videos.length + results.audios.length + results.news.length;

        if (totalResults === 0) {
            this.resultsContainer.innerHTML = `
                <div class="no-results">
                    <p>No results found for "<strong>${term}</strong>"</p>
                </div>
            `;
            return;
        }

        let html = '';

        // Videos Section
        if (results.videos.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">Videos (${results.videos.length})</h3>
                    <div class="search-grid">
                        ${results.videos.map(video => `
                            <a href="video-player.html?id=${video.id}" class="search-card">
                                <div class="search-card-img">
                                    <img src="${video.thumbnail || 'images/logo-placeholder.png'}" alt="${video.title}">
                                </div>
                                <div class="search-card-info">
                                    <h4>${video.title}</h4>
                                    <p>${video.composedBy || 'Performance'}</p>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Audios Section
        if (results.audios.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">Music (${results.audios.length})</h3>
                    <div class="search-grid">
                        ${results.audios.map(audio => `
                            <a href="audio-player.html?id=${audio.id}" class="search-card">
                                <div class="search-card-img search-audio-img">
                                    <span class="material-icons">music_note</span>
                                </div>
                                <div class="search-card-info">
                                    <h4>${audio.title}</h4>
                                    <p>${audio.artist || 'John Onipaba'}</p>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // News Section
        if (results.news.length > 0) {
            html += `
                <div class="search-section">
                    <h3 class="search-section-title">News (${results.news.length})</h3>
                    <div class="search-grid">
                        ${results.news.map(news => `
                            <a href="news-detail.html?id=${news.id}" class="search-card">
                                <div class="search-card-img">
                                    <img src="${news.image || 'images/logo-placeholder.png'}" alt="${news.title}">
                                </div>
                                <div class="search-card-info">
                                    <h4>${news.title}</h4>
                                    <p>${new Date(news.date?.seconds * 1000).toLocaleDateString()}</p>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.resultsContainer.innerHTML = html;
    }
}

// Export singleton instance
export const searchManager = new SearchManager();
