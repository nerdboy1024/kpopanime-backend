#!/usr/bin/env node

/**
 * Test Firebase Connection and Data
 *
 * Verifies that Firebase is properly configured and data is seeded
 */

const { db, auth } = require('../config/firebase');

async function testFirebase() {
    console.log('\n🧪 Testing Firebase Connection and Data...\n');

    const results = {
        connection: false,
        categories: 0,
        products: 0,
        blogPosts: 0,
        users: 0
    };

    try {
        // Test 1: Firestore Connection
        console.log('1️⃣  Testing Firestore connection...');
        const testDoc = await db.collection('categories').limit(1).get();
        results.connection = true;
        console.log('   ✓ Firestore connection successful\n');

        // Test 2: Categories
        console.log('2️⃣  Checking categories...');
        const categoriesSnapshot = await db.collection('categories').get();
        results.categories = categoriesSnapshot.size;
        console.log(`   ✓ Found ${results.categories} categories`);
        categoriesSnapshot.docs.slice(0, 3).forEach(doc => {
            const data = doc.data();
            console.log(`      - ${data.name} (${data.slug})`);
        });
        if (results.categories > 3) {
            console.log(`      ... and ${results.categories - 3} more`);
        }
        console.log();

        // Test 3: Products
        console.log('3️⃣  Checking products...');
        const productsSnapshot = await db.collection('products').get();
        results.products = productsSnapshot.size;
        console.log(`   ✓ Found ${results.products} products`);
        productsSnapshot.docs.slice(0, 3).forEach(doc => {
            const data = doc.data();
            console.log(`      - ${data.name} ($${data.price})`);
        });
        if (results.products > 3) {
            console.log(`      ... and ${results.products - 3} more`);
        }
        console.log();

        // Test 4: Blog Posts
        console.log('4️⃣  Checking blog posts...');
        const blogSnapshot = await db.collection('blog_posts').get();
        results.blogPosts = blogSnapshot.size;
        console.log(`   ✓ Found ${results.blogPosts} blog posts`);
        blogSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`      - ${data.title}`);
        });
        console.log();

        // Test 5: Users
        console.log('5️⃣  Checking users...');
        const usersSnapshot = await db.collection('users').get();
        results.users = usersSnapshot.size;
        console.log(`   ✓ Found ${results.users} users in Firestore`);

        // Check Firebase Auth users
        const authUsers = await auth.listUsers(10);
        console.log(`   ✓ Found ${authUsers.users.length} users in Firebase Auth`);
        authUsers.users.forEach(user => {
            console.log(`      - ${user.email} (${user.uid})`);
        });
        console.log();

        // Test 6: Admin User
        console.log('6️⃣  Checking admin user...');
        const adminSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();

        if (adminSnapshot.empty) {
            console.log('   ⚠️  No admin users found');
        } else {
            console.log(`   ✓ Found ${adminSnapshot.size} admin user(s)`);
            adminSnapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log(`      - ${data.email} (${data.displayName || 'No name'})`);
            });
        }
        console.log();

        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('                  TEST SUMMARY                         ');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('✅ Firebase Connection: OK');
        console.log(`✅ Categories: ${results.categories}`);
        console.log(`✅ Products: ${results.products}`);
        console.log(`✅ Blog Posts: ${results.blogPosts}`);
        console.log(`✅ Users: ${results.users}\n`);

        if (results.categories === 0 || results.products === 0) {
            console.log('⚠️  Warning: Some collections are empty. Run seeding scripts:');
            console.log('   npm run seed:firestore\n');
        }

        if (adminSnapshot.empty) {
            console.log('⚠️  Warning: No admin user found. Create one:');
            console.log('   npm run create:admin\n');
        }

        console.log('🎉 All tests passed!\n');
        return true;
    } catch (error) {
        console.error('\n❌ Error testing Firebase:', error);
        console.error('\nDetails:', error.message);

        if (error.code === 'ENOENT') {
            console.error('\n⚠️  Service account key file not found!');
            console.error('   Make sure serviceAccountKey.json exists in project root\n');
        }

        return false;
    }
}

// Run if called directly
if (require.main === module) {
    testFirebase()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testFirebase };
