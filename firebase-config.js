// Firebase Configuration
// Using Compat libraries for easier integration with existing vanilla JS

const firebaseConfig = {
    apiKey: "AIzaSyAJcjqiz-nkJBPLcn6YlHpGEmvOUhi_LjQ",
    authDomain: "onipaba-music-app.firebaseapp.com",
    projectId: "onipaba-music-app",
    storageBucket: "onipaba-music-app.firebasestorage.app",
    messagingSenderId: "665245388114",
    appId: "1:665245388114:web:9411e3615a5e1f459a3e8b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services and make them globally available
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

console.log('Firebase Initialized');
