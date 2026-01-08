/**
 * Firebase Services Layer (Modular SDK)
 */
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db, auth } from "./config.js";
import { logError } from "./utils.js";

export const publicContentData = {
    videos: [],
    audios: [],
    news: [],
    pdfs: []
};

export const paginationState = {
    videos: { lastDoc: null, hasMore: true, limit: 6 },
    news: { lastDoc: null, hasMore: true, limit: 4 },
    audios: { lastDoc: null, hasMore: true, limit: 12 },
    pdfs: { lastDoc: null, hasMore: true, limit: 8 }
};

const orderFields = {
    videos: 'createdAt',
    news: 'date',
    audios: 'createdAt',
    pdfs: 'createdAt'
};

/**
 * Fetch a collection with pagination support
 */
export const fetchCollection = async (collName, isLoadMore = false) => {
    try {
        const state = paginationState[collName];
        if (!state.hasMore && isLoadMore) return null;

        let q = query(
            collection(db, collName),
            orderBy(orderFields[collName], 'desc'),
            limit(state.limit)
        );

        if (isLoadMore && state.lastDoc) {
            q = query(q, startAfter(state.lastDoc));
        }

        const snap = await getDocs(q);

        if (snap.empty) {
            state.hasMore = false;
            return [];
        }

        const newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        state.lastDoc = snap.docs[snap.docs.length - 1];
        state.hasMore = snap.size === state.limit;

        if (isLoadMore) {
            publicContentData[collName] = [...publicContentData[collName], ...newData];
        } else {
            publicContentData[collName] = newData;
        }

        return newData;
    } catch (err) {
        logError(`fetchCollection/${collName}`, err);
        return null;
    }
};

/**
 * Initialize Auth state listener
 */
export const initAuthListener = (callback) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

/**
 * Logout user
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (err) {
        logError('logoutUser', err);
    }
};
