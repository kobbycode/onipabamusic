// Firebase Configuration
// Using Compat libraries for easier integration with existing vanilla JS

const firebaseConfig = {
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) ? String(import.meta.env.VITE_FIREBASE_API_KEY) : "AIzaSyAJcjqiz-nkJBPLcn6YlHpGEmvOUhi_LjQ",
    authDomain: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) ? String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) : "onipaba-music-app.firebaseapp.com",
    projectId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) ? String(import.meta.env.VITE_FIREBASE_PROJECT_ID) : "onipaba-music-app",
    storageBucket: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) ? String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) : "onipaba-music-app.firebasestorage.app",
    messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ? String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) : "665245388114",
    appId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) ? String(import.meta.env.VITE_FIREBASE_APP_ID) : "1:665245388114:web:9411e3615a5e1f459a3e8b"
};

// Debug Mode: Check for missing environment variables
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('undefined')) {
    console.error('❌ FIREBASE ERROR: API Key is missing or invalid!');
}

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase Initialized with Project:', firebaseConfig.projectId);
}

// Initialize Services and make them globally available
try {
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.storage = firebase.storage();
    console.log('Firebase Services Attached to Window');
} catch (error) {
    console.error('Core Firebase services failed to initialize:', error);
}
