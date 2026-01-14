import { initializeApp } from 'firebase/app';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCAbfCPrKF_CqkDtJWxiuCyR37q5dLAkpY",
    authDomain: "niseko-ski-app.firebaseapp.com",
    projectId: "niseko-ski-app",
    storageBucket: "niseko-ski-app.firebasestorage.app",
    messagingSenderId: "553061047290",
    appId: "1:553061047290:web:e4646bc25cd5dd622da243"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
