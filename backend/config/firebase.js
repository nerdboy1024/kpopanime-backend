const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Use environment variables in production (Render), fall back to file for local development
let credential;

if (process.env.FIREBASE_PRIVATE_KEY) {
    // Production: Use environment variables
    credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
} else {
    // Local development: Use service account file
    const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));
    credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({
    credential: credential,
    storageBucket: 'kpopanimeshop.firebasestorage.app'
});

// Get Firestore instance
const db = admin.firestore();

// Get Auth instance
const auth = admin.auth();

// Get Storage instance
const bucket = admin.storage().bucket();

module.exports = {
    admin,
    db,
    auth,
    bucket
};
