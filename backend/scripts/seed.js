const bcrypt = require('bcryptjs');
const { query } = require('../database/db');
require('dotenv').config();

const seed = async () => {
    try {
        console.log('🌱 Seeding database...\n');

        // Create admin user
        console.log('Creating admin user...');
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@kpopanimeshop.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        const adminResult = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role)
             VALUES ($1, $2, 'Admin', 'User', 'admin')
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash
             RETURNING id`,
            [adminEmail, passwordHash]
        );
        const adminId = adminResult.rows[0].id;
        console.log(`✓ Admin user created: ${adminEmail}`);

        // Get category IDs
        const categoriesResult = await query('SELECT id, slug FROM categories');
        const categories = {};
        categoriesResult.rows.forEach(cat => {
            categories[cat.slug] = cat.id;
        });

        // Sample products
        console.log('\nCreating sample products...');
        const products = [
            {
                name: 'Amethyst Crystal Cluster',
                slug: 'amethyst-crystal-cluster',
                description: 'Beautiful natural amethyst cluster perfect for meditation and spiritual clarity. Each piece is unique and hand-selected.',
                price: 34.99,
                compareAtPrice: 49.99,
                stockQuantity: 15,
                categoryId: categories.crystals,
                imageUrl: 'https://images.unsplash.com/photo-1518282439457-76e4a7bb84e4?w=500',
                isFeatured: true
            },
            {
                name: 'Black Tourmaline Protection Stone',
                slug: 'black-tourmaline-protection',
                description: 'Powerful protection crystal known for grounding energy and shielding against negative vibrations.',
                price: 19.99,
                stockQuantity: 30,
                categoryId: categories.crystals,
                imageUrl: 'https://images.unsplash.com/photo-1603217039863-aa23d49c9c79?w=500',
                isFeatured: false
            },
            {
                name: 'Clear Quartz Master Healer',
                slug: 'clear-quartz-master-healer',
                description: 'The master healing crystal, known for amplifying energy and intentions. Perfect for any crystal collection.',
                price: 24.99,
                stockQuantity: 25,
                categoryId: categories.crystals,
                imageUrl: 'https://images.unsplash.com/photo-1570193990295-64d5c6e5f488?w=500',
                isFeatured: true
            },
            {
                name: 'Gothic Tarot Deck - Dark Edition',
                slug: 'gothic-tarot-deck-dark',
                description: '78-card tarot deck with stunning gothic artwork. Includes guidebook with interpretations and spreads.',
                price: 44.99,
                compareAtPrice: 59.99,
                stockQuantity: 12,
                categoryId: categories.tarot,
                imageUrl: 'https://images.unsplash.com/photo-1559117889-99f5dae99d3c?w=500',
                isFeatured: true
            },
            {
                name: 'Moon Phase Tarot Cloth',
                slug: 'moon-phase-tarot-cloth',
                description: 'Luxurious velvet tarot cloth featuring moon phases. Perfect for readings and protecting your cards.',
                price: 29.99,
                stockQuantity: 20,
                categoryId: categories.tarot,
                imageUrl: 'https://images.unsplash.com/photo-1512552435849-91ebce775b27?w=500',
                isFeatured: false
            },
            {
                name: 'Crystal Ball with Stand',
                slug: 'crystal-ball-with-stand',
                description: 'Clear crystal ball for scrying and divination. Comes with elegant wooden stand.',
                price: 79.99,
                compareAtPrice: 99.99,
                stockQuantity: 8,
                categoryId: categories.tools,
                imageUrl: 'https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?w=500',
                isFeatured: false
            },
            {
                name: 'Ritual Candle Set - 7 Colors',
                slug: 'ritual-candle-set-7-colors',
                description: 'Hand-poured ritual candles in 7 chakra colors. Perfect for meditation, spell work, and intention setting.',
                price: 34.99,
                stockQuantity: 18,
                categoryId: categories.tools,
                imageUrl: 'https://images.unsplash.com/photo-1602874801006-95ad816c7021?w=500',
                isFeatured: true
            },
            {
                name: 'Moon Phase Necklace - Sterling Silver',
                slug: 'moon-phase-necklace-sterling',
                description: 'Delicate sterling silver necklace featuring all moon phases. A beautiful reminder of celestial cycles.',
                price: 59.99,
                stockQuantity: 15,
                categoryId: categories.jewelry,
                imageUrl: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500',
                isFeatured: true
            },
            {
                name: 'Pentacle Protection Pendant',
                slug: 'pentacle-protection-pendant',
                description: 'Sacred pentacle pendant in sterling silver. Worn for protection and spiritual connection.',
                price: 49.99,
                compareAtPrice: 69.99,
                stockQuantity: 10,
                categoryId: categories.jewelry,
                imageUrl: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=500',
                isFeatured: false
            },
            {
                name: 'Rose Quartz Heart Stone',
                slug: 'rose-quartz-heart',
                description: 'Polished rose quartz heart stone. The crystal of unconditional love and emotional healing.',
                price: 16.99,
                stockQuantity: 35,
                categoryId: categories.crystals,
                imageUrl: 'https://images.unsplash.com/photo-1603217039863-aa23d49c9c79?w=500',
                isFeatured: false
            }
        ];

        for (const product of products) {
            await query(
                `INSERT INTO products
                 (name, slug, description, price, compare_at_price, stock_quantity,
                  category_id, image_url, is_featured)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (slug) DO UPDATE
                 SET name = EXCLUDED.name, price = EXCLUDED.price`,
                [product.name, product.slug, product.description, product.price,
                 product.compareAtPrice || null, product.stockQuantity,
                 product.categoryId, product.imageUrl, product.isFeatured]
            );
            console.log(`  ✓ ${product.name}`);
        }

        // Sample blog posts
        console.log('\nCreating sample blog posts...');
        const blogPosts = [
            {
                title: 'How to Cleanse Your Crystals Under the Full Moon',
                slug: 'how-to-cleanse-crystals-full-moon',
                excerpt: 'Discover the ancient art of crystal cleansing and learn how to harness lunar energy to reset your sacred stones.',
                content: `# Crystal Cleansing with Lunar Energy

The full moon is one of the most powerful times to cleanse and recharge your crystals. Here's how to do it:

## What You'll Need
- Your crystals
- A safe outdoor space or windowsill
- Optional: cleansing herbs like sage or palo santo

## Steps
1. First, cleanse your space with sage or palo santo
2. Arrange your crystals where they'll receive direct moonlight
3. Set your intentions for each crystal
4. Leave them overnight (at least 4 hours)
5. Retrieve them in the morning

## Which Crystals to Avoid
Some crystals like selenite, celestite, and desert rose can be damaged by moisture. Keep these indoors.

The full moon's energy is perfect for recharging your spiritual tools and setting new intentions for the lunar cycle ahead.`,
                category: 'Crystals',
                readTime: 5,
                isPublished: true,
                publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                tags: JSON.stringify(['crystals', 'moon magic', 'cleansing', 'ritual'])
            },
            {
                title: 'Tarot for Beginners: Understanding the Major Arcana',
                slug: 'tarot-beginners-major-arcana',
                excerpt: 'Journey through the 22 cards of the Major Arcana and unlock the secrets of the Fool\'s journey.',
                content: `# The Major Arcana: Your Guide to the Soul's Journey

The Major Arcana consists of 22 cards that represent life's karmic and spiritual lessons. Let's explore them together.

## The Fool's Journey
The Major Arcana tells the story of the Fool's journey through life, from innocence to wisdom.

## Key Cards to Know
- **The Fool (0)**: New beginnings, innocence, spontaneity
- **The Magician (I)**: Manifestation, resourcefulness, power
- **The High Priestess (II)**: Intuition, sacred knowledge, divine feminine
- **The Empress (III)**: Abundance, nurturing, nature
- **The Emperor (IV)**: Authority, structure, control

And so the journey continues through all 22 cards, each teaching us valuable lessons about life, death, and transformation.

## How to Read the Major Arcana
When these cards appear in a reading, pay extra attention. They indicate important life themes and spiritual lessons currently at play.`,
                category: 'Tarot',
                readTime: 8,
                isPublished: true,
                publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                tags: JSON.stringify(['tarot', 'major arcana', 'divination', 'beginners'])
            },
            {
                title: 'Simple Protection Spells for Everyday Life',
                slug: 'simple-protection-spells',
                excerpt: 'Create a protective shield around yourself and your space with these easy yet powerful spell techniques.',
                content: `# Daily Protection Magic

Protection magic doesn't have to be complicated. Here are simple techniques you can use every day.

## Morning Protection Ritual
Start your day by visualizing a protective white light surrounding your entire body.

## Black Tourmaline Spell
Carry a piece of black tourmaline in your pocket or bag. This stone naturally absorbs negative energy.

## Salt Protection for Your Home
Place small bowls of salt in the corners of your home to absorb negative energy. Replace monthly, preferably on the new moon.

## Protection Chant
"I am protected, I am safe
Negative energy has no place
Only light and love remain
In my space, in my name"

Repeat this three times while visualizing a protective barrier around you.

Remember, the most powerful protection comes from within - your intention and belief.`,
                category: 'Spellwork',
                readTime: 6,
                isPublished: true,
                publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
                tags: JSON.stringify(['spells', 'protection', 'magic', 'daily practice'])
            }
        ];

        for (const post of blogPosts) {
            await query(
                `INSERT INTO blog_posts
                 (title, slug, excerpt, content, category, author_id, read_time,
                  is_published, published_at, tags)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (slug) DO UPDATE
                 SET title = EXCLUDED.title, content = EXCLUDED.content`,
                [post.title, post.slug, post.excerpt, post.content, post.category,
                 adminId, post.readTime, post.isPublished, post.publishedAt,
                 post.tags]
            );
            console.log(`  ✓ ${post.title}`);
        }

        console.log('\n✅ Database seeding completed successfully!\n');
        console.log('Summary:');
        console.log(`  - Admin user: ${adminEmail}`);
        console.log(`  - Products: ${products.length}`);
        console.log(`  - Blog posts: ${blogPosts.length}`);
        console.log('\n🎉 Ready to go! Start the server with: npm run dev\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
