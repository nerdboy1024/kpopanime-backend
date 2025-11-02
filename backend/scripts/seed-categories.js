const { db } = require('../config/firebase');

const categories = [
    {
        name: 'K-pop Albums',
        slug: 'kpop-albums',
        description: 'Official K-pop albums from your favorite artists including BTS, BLACKPINK, Stray Kids, and more',
        icon: '💿',
        displayOrder: 1
    },
    {
        name: 'Anime Figures',
        slug: 'anime-figures',
        description: 'High-quality anime figures and collectibles from popular series',
        icon: '🎎',
        displayOrder: 2
    },
    {
        name: 'Posters & Prints',
        slug: 'posters-prints',
        description: 'Official posters and art prints featuring K-pop idols and anime characters',
        icon: '🖼️',
        displayOrder: 3
    },
    {
        name: 'Photobooks',
        slug: 'photobooks',
        description: 'Exclusive photobooks and photo cards from K-pop groups and solo artists',
        icon: '📸',
        displayOrder: 4
    },
    {
        name: 'Apparel & Accessories',
        slug: 'apparel-accessories',
        description: 'Official merchandise including t-shirts, hoodies, bags, and accessories',
        icon: '👕',
        displayOrder: 5
    },
    {
        name: 'Lightsticks & Merch',
        slug: 'lightsticks-merch',
        description: 'Official lightsticks, banners, keychains, and other fan merchandise',
        icon: '💡',
        displayOrder: 6
    }
];

async function seedCategories() {
    console.log('🌱 Starting category seeding...');

    try {
        // Check if categories already exist
        const existingCategories = await db.collection('categories').get();

        if (!existingCategories.empty) {
            console.log(`⚠️  Found ${existingCategories.size} existing categories.`);
            console.log('   Delete them first if you want to re-seed, or skip seeding.');

            // Optional: Delete existing categories
            const shouldDelete = process.argv.includes('--force');
            if (shouldDelete) {
                console.log('   --force flag detected. Deleting existing categories...');
                const batch = db.batch();
                existingCategories.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log('   ✅ Existing categories deleted.');
            } else {
                console.log('   Skipping category seeding. Use --force to overwrite.');
                return;
            }
        }

        // Create categories
        const batch = db.batch();
        const categoryIds = {};

        for (const category of categories) {
            const docRef = db.collection('categories').doc();
            categoryIds[category.slug] = docRef.id;

            batch.set(docRef, {
                ...category,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log(`   ✓ Prepared category: ${category.name}`);
        }

        await batch.commit();

        console.log('\n✅ Successfully seeded categories!');
        console.log(`   Total categories created: ${categories.length}`);
        console.log('\n📋 Category IDs (save these for product seeding):');
        console.log(JSON.stringify(categoryIds, null, 2));

        return categoryIds;
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedCategories()
        .then(() => {
            console.log('\n✨ Category seeding complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Category seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedCategories };
