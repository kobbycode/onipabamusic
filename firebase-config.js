// Firebase Configuration
// Using Compat libraries for easier integration with existing vanilla JS

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
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
