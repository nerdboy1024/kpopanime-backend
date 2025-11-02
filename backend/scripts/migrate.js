const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../database/db');

const migrate = async () => {
    try {
        console.log('🔄 Running database migration...\n');

        // Read schema file
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database migration completed successfully!\n');
        console.log('Tables created:');
        console.log('  - users');
        console.log('  - categories');
        console.log('  - products');
        console.log('  - blog_posts');
        console.log('  - orders');
        console.log('  - order_items');
        console.log('\nDefault categories added:');
        console.log('  - Crystals');
        console.log('  - Tarot');
        console.log('  - Occult Tools');
        console.log('  - Jewelry');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
