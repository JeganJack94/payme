// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider, db };