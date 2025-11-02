// Firebase Configuration
// K-pop Anime Shop Project

const firebaseConfig = {
  apiKey: "AIzaSyAuxalH8BqkQrxNSz-01RAmPhK6d_MHbFA",
  authDomain: "kpopanimeshop.firebaseapp.com",
  projectId: "kpopanimeshop",
  storageBucket: "kpopanimeshop.firebasestorage.app",
  messagingSenderId: "367322718227",
  appId: "1:367322718227:web:43b259f301af61ca6c5fe6"
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
