
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyChc7TveXX1TJ4NI6TgVpuu7nGnKYNPiZI",
    authDomain: "payme-5259f.firebaseapp.com",
    projectId: "payme-5259f",
    storageBucket: "payme-5259f.firebasestorage.app",
    messagingSenderId: "378246228500",
    appId: "1:378246228500:web:4c7bdb4d7b9356ac4a9501"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };