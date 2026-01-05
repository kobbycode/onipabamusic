// Firebase Configuration
// Using Compat libraries for easier integration with existing vanilla JS

const firebaseConfig = {
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_API_KEY : "AIzaSyAJcjqiz-nkJBPLcn6YlHpGEmvOUhi_LjQ",
    authDomain: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN : "onipaba-music-app.firebaseapp.com",
    projectId: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_PROJECT_ID : "onipaba-music-app",
    storageBucket: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET : "onipaba-music-app.firebasestorage.app",
    messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID : "665245388114",
    appId: (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_FIREBASE_APP_ID : "1:665245388114:web:9411e3615a5e1f459a3e8b"
};

// Debug Mode: Check for missing environment variables
if (!firebaseConfig.apiKey) {
    console.error('❌ FIREBASE ERROR: API Key is missing! Have you added VITE_FIREBASE_API_KEY to your deployment environment variables?');
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services and make them globally available
window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

console.log('Firebase Initialized');
