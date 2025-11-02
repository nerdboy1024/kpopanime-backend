#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * Creates an admin user in Firebase Auth and Firestore
 *
 * Usage:
 *   node scripts/create-admin.js
 *   node scripts/create-admin.js admin@kpopanimeshop.com SecurePassword123!
 */

const { auth, db } = require('../config/firebase');

const defaultEmail = 'admin@kpopanimeshop.com';
const defaultPassword = 'Admin123!';

async function createAdminUser(email, password) {
    console.log('\n🔐 Creating Admin User...\n');

    try {
        // Check if user already exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log(`✓ User already exists in Firebase Auth: ${email}`);
            console.log(`  UID: ${userRecord.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create new user in Firebase Auth
                console.log(`Creating new user in Firebase Auth: ${email}`);
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: 'Administrator',
                    emailVerified: true
                });
                console.log(`✓ User created in Firebase Auth`);
                console.log(`  UID: ${userRecord.uid}`);
                console.log(`  Email: ${userRecord.email}`);
            } else {
                throw error;
            }
        }

        // Set admin custom claim
        await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' });
        console.log(`✓ Admin custom claims set`);

        // Create or update user document in Firestore
        const userDoc = db.collection('users').doc(userRecord.uid);
        const userDocData = await userDoc.get();

        if (userDocData.exists) {
            // Update existing document
            await userDoc.update({
                role: 'admin',
                updatedAt: new Date()
            });
            console.log(`✓ User document updated in Firestore`);
        } else {
            // Create new document
            await userDoc.set({
                email: email,
                displayName: 'Administrator',
                role: 'admin',
                emailOptIn: false,
                smsOptIn: false,
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`✓ User document created in Firestore`);
        }

        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

        return userRecord;
    } catch (error) {
        console.error('\n❌ Error creating admin user:', error);
        throw error;
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0] || defaultEmail;
const password = args[1] || defaultPassword;

// Validate email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error('❌ Invalid email address');
    process.exit(1);
}

// Validate password
if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters');
    process.exit(1);
}

// Run if called directly
if (require.main === module) {
    createAdminUser(email, password)
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Failed to create admin user:', error.message);
            process.exit(1);
        });
}

module.exports = { createAdminUser };
