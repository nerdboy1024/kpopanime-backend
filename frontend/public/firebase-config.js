// Firebase Configuration
// Chordeva Cave Project

const firebaseConfig = {
  apiKey: "AIzaSyCQfQUmUuKHp3VvHQ2MFX9r9Me_Tl59CQo",
  authDomain: "chordeva-cave.firebaseapp.com",
  projectId: "chordeva-cave",
  storageBucket: "chordeva-cave.firebasestorage.app",
  messagingSenderId: "1045932482811",
  appId: "1:1045932482811:web:e901a4d6d971671513905e",
  measurementId: "G-2MB3PKNQH3"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export app for other uses
export default app;
