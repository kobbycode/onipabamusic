/**
 * Firebase Configuration and Initialization (Modular SDK v10+)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJcjqiz-nkJBPLcn6YlHpGEmvOUhi_LjQ", // Keeping existing keys
    authDomain: "onipaba-music-app.firebaseapp.com",
    projectId: "onipaba-music-app",
    storageBucket: "onipaba-music-app.firebasestorage.app",
    messagingSenderId: "665245388114",
    appId: "1:665245388114:web:9411e3615a5e1f459a3e8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log('Firebase Modular SDK Initialized');
