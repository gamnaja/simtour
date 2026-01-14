import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export const authService = {
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Initialize user data in Firestore if it doesn't exist
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    trips: [], // List of trip IDs the user is part of
                    createdAt: new Date()
                });
            }

            return user;
        } catch (error) {
            console.error("Error logging in with Google:", error);
            throw error;
        }
    },

    async logout() {
        return await signOut(auth);
    },

    async updateUserName(uid, newName) {
        try {
            const userRef = doc(db, 'users', uid);
            // Use setDoc with merge: true to ensure the document exists
            await setDoc(userRef, { displayName: newName }, { merge: true });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: newName });
            }
            return true;
        } catch (error) {
            console.error("Error updating user name:", error);
            throw error;
        }
    },

    onAuthSync(callback) {
        return onAuthStateChanged(auth, callback);
    },

    async getAllUsers() {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    },

    async searchUserByEmail(email) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    // In-memory cache for user data
    _userCache: {},
    async getUserData(uid) {
        if (this._userCache[uid]) return this._userCache[uid];

        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.exists() ? userSnap.data() : null;

        if (data) {
            this._userCache[uid] = data;
        }
        return data;
    }
};
