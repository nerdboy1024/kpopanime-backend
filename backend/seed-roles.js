/**
 * Firebase Role Seeding Script
 *
 * This script adds default roles to existing users and creates an admin user
 * Run this once to set up roles for the RBAC system
 */

const readline = require('readline');

// Use existing Firebase configuration
const { admin, auth, db } = require('./config/firebase');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function seedRoles() {
    console.log('🔮 Chordeva Cave - Firebase Role Seeding Script\n');

    try {
        // List all users
        console.log('Fetching all users...\n');
        const listUsersResult = await auth.listUsers();
        const users = listUsersResult.users;

        if (users.length === 0) {
            console.log('No users found in Firebase Auth.');

            // Ask if they want to create an admin user
            const createAdmin = await question('Would you like to create an admin user? (yes/no): ');

            if (createAdmin.toLowerCase() === 'yes') {
                await createAdminUser();
            }
        } else {
            console.log(`Found ${users.length} users:\n`);

            // Display all users
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email || 'No email'} (UID: ${user.uid})`);
            });

            console.log('\n--- Seeding Roles ---\n');

            // Update each user with default role if they don't have one
            for (const user of users) {
                const userDoc = await db.collection('users').doc(user.uid).get();

                if (!userDoc.exists) {
                    // Create user document with default role
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        displayName: user.displayName || null,
                        photoURL: user.photoURL || null,
                        role: 'customer',
                        emailOptIn: false,
                        smsOptIn: false,
                        tags: [],
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    console.log(`✅ Created user document for ${user.email} with role: customer`);
                } else {
                    const userData = userDoc.data();

                    if (!userData.role) {
                        // Add role to existing user
                        await db.collection('users').doc(user.uid).update({
                            role: 'customer',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });

                        console.log(`✅ Added role 'customer' to ${user.email}`);
                    } else {
                        console.log(`ℹ️  ${user.email} already has role: ${userData.role}`);
                    }
                }

                // Set custom claims for role
                const currentClaims = (await auth.getUser(user.uid)).customClaims || {};
                if (!currentClaims.role) {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    const role = userDoc.data().role || 'customer';

                    await auth.setCustomUserClaims(user.uid, {
                        ...currentClaims,
                        role: role
                    });

                    console.log(`✅ Set custom claim 'role: ${role}' for ${user.email}`);
                }
            }

            console.log('\n--- Promote User to Admin ---\n');

            // Ask if they want to promote a user to admin
            const promoteAdmin = await question('Would you like to promote a user to admin? (yes/no): ');

            if (promoteAdmin.toLowerCase() === 'yes') {
                const userEmail = await question('Enter the email address of the user to promote: ');

                try {
                    const userRecord = await auth.getUserByEmail(userEmail);

                    // Update Firestore
                    await db.collection('users').doc(userRecord.uid).update({
                        role: 'admin',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Update custom claims
                    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

                    console.log(`\n✅ ${userEmail} has been promoted to admin!`);
                    console.log(`⚠️  User needs to sign out and sign back in for changes to take effect.`);
                } catch (error) {
                    console.error(`\n❌ Error promoting user: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 Role seeding complete!\n');

    } catch (error) {
        console.error('Error seeding roles:', error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

async function createAdminUser() {
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 characters): ');
    const displayName = await question('Enter display name: ');

    try {
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName
        });

        console.log(`\n✅ Created user in Firebase Auth: ${email}`);

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: email,
            displayName: displayName,
            role: 'admin',
            emailOptIn: false,
            smsOptIn: false,
            tags: ['role:admin'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Created user document in Firestore with role: admin`);

        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

        console.log(`✅ Set custom claims for admin role`);
        console.log(`\n🎉 Admin user created successfully!`);
        console.log(`📧 Email: ${email}`);
        console.log(`👤 Display Name: ${displayName}`);
        console.log(`⚔️  Role: admin\n`);

    } catch (error) {
        console.error(`\n❌ Error creating admin user: ${error.message}\n`);
    }
}

// Run the script
seedRoles();
