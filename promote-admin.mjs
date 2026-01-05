// Temporary script to promote user to superadmin
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAJcjqiz-nkJBPLcn6YlHpGEmvOUhi_LjQ",
    authDomain: "onipaba-music-app.firebaseapp.com",
    projectId: "onipaba-music-app",
    storageBucket: "onipaba-music-app.firebasestorage.app",
    messagingSenderId: "665245388114",
    appId: "1:665245388114:web:9411e3615a5e1f459a3e8b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function promoteToSuperAdmin() {
    try {
        const userRef = doc(db, 'users', 'NMJOfOEeeSari8ZvTlsOGWULG0B3');
        await updateDoc(userRef, {
            role: 'superadmin'
        });
        console.log('✅ User alexco.ao@gmail.com successfully promoted to superadmin!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error promoting user:', error);
        process.exit(1);
    }
}

promoteToSuperAdmin();
