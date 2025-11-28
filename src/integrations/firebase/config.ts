import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyALqL3KflVWOLEPZs1vlbW30tcDTJospKs",
    authDomain: "marg-darshak-aa9d2.firebaseapp.com",
    projectId: "marg-darshak-aa9d2",
    storageBucket: "marg-darshak-aa9d2.firebasestorage.app",
    messagingSenderId: "503744409390",
    appId: "1:503744409390:web:73194298d460ca889fd4bf",
    measurementId: "G-21ZPTK1H3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
