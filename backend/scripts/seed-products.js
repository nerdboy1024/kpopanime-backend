const { db } = require('../config/firebase');

// This will be populated by category seeding or fetched from Firestore
let categoryMap = {};

const products = [
    // K-pop Albums
    {
        name: 'BTS - Map of the Soul: 7',
        slug: 'bts-map-of-the-soul-7',
        categorySlug: 'kpop-albums',
        description: 'Fourth Korean studio album by BTS. Includes photobook, photocard, poster, and CD.',
        price: 24.99,
        compareAtPrice: 29.99,
        stockQuantity: 150,
        imageUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=500',
        images: [
            'https://images.unsplash.com/photo-1619983081563-430f63602796?w=500',
            'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500'
        ],
        isFeatured: true,
        isActive: true,
        tags: ['BTS', 'K-pop', 'Album', 'New Release'],
        metadata: {
            artist: 'BTS',
            releaseYear: 2020,
            tracks: 20,
            format: 'CD'
        }
    },
    {
        name: 'BLACKPINK - THE ALBUM',
        slug: 'blackpink-the-album',
        categorySlug: 'kpop-albums',
        description: 'First full-length studio album by BLACKPINK. Special edition with exclusive photobook.',
        price: 22.99,
        compareAtPrice: 26.99,
        stockQuantity: 120,
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
        images: [
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
        ],
        isFeatured: true,
        isActive: true,
        tags: ['BLACKPINK', 'K-pop', 'Album', 'Girl Group'],
        metadata: {
            artist: 'BLACKPINK',
            releaseYear: 2020,
            tracks: 8,
            format: 'CD'
        }
    },
    {
        name: 'Stray Kids - 5-STAR',
        slug: 'stray-kids-5-star',
        categorySlug: 'kpop-albums',
        description: 'Third studio album by Stray Kids. Includes random photocard and exclusive poster.',
        price: 23.99,
        stockQuantity: 100,
        imageUrl: 'https://images.unsplash.com/photo-1619983081593-e2ba5b543168?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['Stray Kids', 'K-pop', 'Album'],
        metadata: {
            artist: 'Stray Kids',
            releaseYear: 2023,
            tracks: 12,
            format: 'CD'
        }
    },
    {
        name: 'NewJeans - Get Up',
        slug: 'newjeans-get-up',
        categorySlug: 'kpop-albums',
        description: 'Second EP by NewJeans. Fresh and trendy concept with photobook and photocards.',
        price: 19.99,
        stockQuantity: 200,
        imageUrl: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=500',
        images: [],
        isFeatured: true,
        isActive: true,
        tags: ['NewJeans', 'K-pop', 'Album', 'New Release'],
        metadata: {
            artist: 'NewJeans',
            releaseYear: 2023,
            tracks: 6,
            format: 'CD'
        }
    },
    // Anime Figures
    {
        name: 'Naruto Uzumaki Figure - Sage Mode',
        slug: 'naruto-uzumaki-sage-mode-figure',
        categorySlug: 'anime-figures',
        description: 'High-quality PVC figure of Naruto in Sage Mode. Approximately 10 inches tall with detailed sculpting.',
        price: 89.99,
        compareAtPrice: 99.99,
        stockQuantity: 50,
        imageUrl: 'https://images.unsplash.com/photo-1601814933824-fd0b574dd592?w=500',
        images: [
            'https://images.unsplash.com/photo-1601814933824-fd0b574dd592?w=500'
        ],
        isFeatured: true,
        isActive: true,
        tags: ['Naruto', 'Anime', 'Figure', 'Collectible'],
        metadata: {
            series: 'Naruto Shippuden',
            manufacturer: 'Bandai',
            height: '10 inches',
            material: 'PVC'
        }
    },
    {
        name: 'One Piece - Luffy Gear 5 Figure',
        slug: 'luffy-gear-5-figure',
        categorySlug: 'anime-figures',
        description: 'Limited edition Luffy Gear 5 transformation figure. Highly detailed with interchangeable parts.',
        price: 129.99,
        stockQuantity: 30,
        imageUrl: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=500',
        images: [],
        isFeatured: true,
        isActive: true,
        tags: ['One Piece', 'Luffy', 'Anime', 'Figure', 'Limited Edition'],
        metadata: {
            series: 'One Piece',
            manufacturer: 'Banpresto',
            height: '12 inches',
            material: 'PVC/ABS'
        }
    },
    {
        name: 'Attack on Titan - Eren Yeager Nendoroid',
        slug: 'eren-yeager-nendoroid',
        categorySlug: 'anime-figures',
        description: 'Cute Nendoroid figure of Eren Yeager with multiple face plates and accessories.',
        price: 54.99,
        stockQuantity: 80,
        imageUrl: 'https://images.unsplash.com/photo-1606041011872-596597976b25?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['Attack on Titan', 'Eren', 'Nendoroid', 'Figure'],
        metadata: {
            series: 'Attack on Titan',
            manufacturer: 'Good Smile Company',
            height: '4 inches',
            material: 'PVC/ABS'
        }
    },
    // Posters & Prints
    {
        name: 'BTS Group Poster - Official',
        slug: 'bts-group-poster-official',
        categorySlug: 'posters-prints',
        description: 'Official BTS group poster featuring all members. High-quality print on premium paper.',
        price: 14.99,
        stockQuantity: 300,
        imageUrl: 'https://images.unsplash.com/photo-1618004652321-13a63e576b80?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['BTS', 'Poster', 'K-pop', 'Official'],
        metadata: {
            size: '24x36 inches',
            material: 'Premium poster paper',
            finish: 'Glossy'
        }
    },
    {
        name: 'My Hero Academia - Class 1-A Poster',
        slug: 'mha-class-1a-poster',
        categorySlug: 'posters-prints',
        description: 'Vibrant poster featuring all students from Class 1-A. Perfect for any MHA fan.',
        price: 12.99,
        stockQuantity: 250,
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['My Hero Academia', 'Poster', 'Anime'],
        metadata: {
            size: '24x36 inches',
            material: 'Premium poster paper',
            finish: 'Matte'
        }
    },
    // Photobooks
    {
        name: 'TWICE - Between 1&2 Photobook',
        slug: 'twice-between-1-2-photobook',
        categorySlug: 'photobooks',
        description: 'Exclusive TWICE photobook with unreleased photos and member interviews.',
        price: 34.99,
        stockQuantity: 100,
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['TWICE', 'Photobook', 'K-pop'],
        metadata: {
            artist: 'TWICE',
            pages: 120,
            size: '8x10 inches'
        }
    },
    // Apparel
    {
        name: 'Demon Slayer - Tanjiro T-Shirt',
        slug: 'demon-slayer-tanjiro-tshirt',
        categorySlug: 'apparel-accessories',
        description: 'Official Demon Slayer t-shirt featuring Tanjiro Kamado. Available in multiple sizes.',
        price: 29.99,
        stockQuantity: 200,
        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['Demon Slayer', 'T-Shirt', 'Apparel', 'Anime'],
        metadata: {
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            material: '100% Cotton',
            color: 'Black'
        },
        variants: [
            { size: 'S', sku: 'DS-TAN-S' },
            { size: 'M', sku: 'DS-TAN-M' },
            { size: 'L', sku: 'DS-TAN-L' },
            { size: 'XL', sku: 'DS-TAN-XL' },
            { size: 'XXL', sku: 'DS-TAN-XXL' }
        ]
    },
    // Lightsticks
    {
        name: 'BTS Official Lightstick Ver. 4',
        slug: 'bts-official-lightstick-v4',
        categorySlug: 'lightsticks-merch',
        description: 'Official BTS Army Bomb lightstick version 4 with Bluetooth connectivity and app control.',
        price: 64.99,
        compareAtPrice: 74.99,
        stockQuantity: 75,
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
        images: [],
        isFeatured: true,
        isActive: true,
        tags: ['BTS', 'Lightstick', 'Official', 'Concert'],
        metadata: {
            artist: 'BTS',
            version: 4,
            features: ['Bluetooth', 'App Control', 'Multi-Color LED']
        }
    },
    {
        name: 'BLACKPINK Official Lightstick',
        slug: 'blackpink-official-lightstick',
        categorySlug: 'lightsticks-merch',
        description: 'Official BLACKPINK lightstick with hammer design. Perfect for concerts and fan events.',
        price: 59.99,
        stockQuantity: 60,
        imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500',
        images: [],
        isFeatured: false,
        isActive: true,
        tags: ['BLACKPINK', 'Lightstick', 'Official', 'Concert'],
        metadata: {
            artist: 'BLACKPINK',
            features: ['LED', 'Hammer Design']
        }
    }
];

async function seedProducts(categoryIds = null) {
    console.log('🌱 Starting product seeding...');

    try {
        // Fetch category IDs if not provided
        if (!categoryIds) {
            console.log('   Fetching category IDs from Firestore...');
            const categoriesSnapshot = await db.collection('categories').get();

            if (categoriesSnapshot.empty) {
                throw new Error('No categories found. Please run seed-categories.js first.');
            }

            categoriesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                categoryMap[data.slug] = doc.id;
            });

            console.log(`   ✓ Found ${Object.keys(categoryMap).length} categories`);
        } else {
            categoryMap = categoryIds;
        }

        // Check if products already exist
        const existingProducts = await db.collection('products').get();

        if (!existingProducts.empty) {
            console.log(`⚠️  Found ${existingProducts.size} existing products.`);

            const shouldDelete = process.argv.includes('--force');
            if (shouldDelete) {
                console.log('   --force flag detected. Deleting existing products...');
                const batch = db.batch();
                existingProducts.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log('   ✅ Existing products deleted.');
            } else {
                console.log('   Skipping product seeding. Use --force to overwrite.');
                return;
            }
        }

        // Create products
        const batch = db.batch();
        let successCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            const categoryId = categoryMap[product.categorySlug];

            if (!categoryId) {
                console.log(`   ⚠️  Skipping "${product.name}" - category "${product.categorySlug}" not found`);
                skippedCount++;
                continue;
            }

            const docRef = db.collection('products').doc();

            const productData = {
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: product.price,
                compareAtPrice: product.compareAtPrice || null,
                stockQuantity: product.stockQuantity,
                categoryId: categoryId,
                imageUrl: product.imageUrl,
                images: product.images || [],
                isFeatured: product.isFeatured,
                isActive: product.isActive,
                tags: product.tags || [],
                metadata: product.metadata || {},
                variants: product.variants || [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            batch.set(docRef, productData);
            successCount++;
            console.log(`   ✓ Prepared product: ${product.name}`);
        }

        await batch.commit();

        console.log('\n✅ Successfully seeded products!');
        console.log(`   Products created: ${successCount}`);
        if (skippedCount > 0) {
            console.log(`   Products skipped: ${skippedCount}`);
        }
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedProducts()
        .then(() => {
            console.log('\n✨ Product seeding complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Product seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedProducts };
