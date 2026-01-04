import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                audios: resolve(__dirname, 'audios.html'),
                chat: resolve(__dirname, 'chat.html'),
                contact: resolve(__dirname, 'contact.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
                login: resolve(__dirname, 'login.html'),
                news: resolve(__dirname, 'news.html'),
                'news-detail': resolve(__dirname, 'news-detail.html'),
                pdfs: resolve(__dirname, 'pdfs.html'),
                profile: resolve(__dirname, 'profile.html'),
                signup: resolve(__dirname, 'signup.html'),
                'video-player': resolve(__dirname, 'video-player.html'),
                videos: resolve(__dirname, 'videos.html'),
                '404': resolve(__dirname, '404.html')
            }
        }
    }
});
