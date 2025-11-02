#!/usr/bin/env node

/**
 * Master Firestore Seeding Script
 *
 * This script orchestrates the seeding of all Firestore collections in the correct order:
 * 1. Categories (independent)
 * 2. Products (depends on categories)
 * 3. Blog Posts (depends on admin user, creates if needed)
 *
 * Usage:
 *   npm run seed:firestore
 *   node scripts/seed-firestore.js
 *   node scripts/seed-firestore.js --force (to overwrite existing data)
 *
 * Options:
 *   --force       Delete existing data before seeding
 *   --skip-blog   Skip blog post seeding
 *   --only-blog   Only seed blog posts
 *   --help        Show this help message
 */

const { seedCategories } = require('./seed-categories');
const { seedProducts } = require('./seed-products');
const { seedBlog } = require('./seed-blog');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function printHeader() {
    console.log('\n' + colors.cyan + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.cyan + colors.bright + '           K-POP ANIME SHOP - FIRESTORE SEEDING            ' + colors.reset);
    console.log(colors.cyan + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');
}

function printSection(title) {
    console.log('\n' + colors.blue + colors.bright + '━━━ ' + title + ' ━━━' + colors.reset + '\n');
}

function printSuccess(message) {
    console.log(colors.green + '✓ ' + message + colors.reset);
}

function printError(message) {
    console.log(colors.red + '✗ ' + message + colors.reset);
}

function printWarning(message) {
    console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

function showHelp() {
    console.log(`
${colors.bright}Firestore Seeding Script${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run seed:firestore
  node scripts/seed-firestore.js [options]

${colors.bright}Options:${colors.reset}
  --force       Delete existing data before seeding
  --skip-blog   Skip blog post seeding
  --only-blog   Only seed blog posts (skip categories and products)
  --help        Show this help message

${colors.bright}Examples:${colors.reset}
  # Seed all collections (skip if data exists)
  npm run seed:firestore

  # Force re-seed all collections
  npm run seed:firestore -- --force

  # Seed only blog posts
  npm run seed:firestore -- --only-blog

  # Seed categories and products, skip blog
  npm run seed:firestore -- --skip-blog
`);
}

async function masterSeed() {
    const args = process.argv.slice(2);

    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    printHeader();

    const startTime = Date.now();
    const results = {
        categories: false,
        products: false,
        blog: false
    };

    try {
        // Check flags
        const onlyBlog = args.includes('--only-blog');
        const skipBlog = args.includes('--skip-blog');

        if (onlyBlog && skipBlog) {
            printError('Cannot use --only-blog and --skip-blog together');
            process.exit(1);
        }

        if (onlyBlog) {
            // Only seed blog posts
            printSection('Seeding Blog Posts Only');
            await seedBlog();
            results.blog = true;
            printSuccess('Blog posts seeding completed');
        } else {
            // Seed categories
            printSection('Step 1/3: Seeding Categories');
            const categoryIds = await seedCategories();
            results.categories = true;
            printSuccess('Categories seeding completed');

            // Seed products
            printSection('Step 2/3: Seeding Products');
            await seedProducts(categoryIds);
            results.products = true;
            printSuccess('Products seeding completed');

            // Seed blog posts (unless skipped)
            if (!skipBlog) {
                printSection('Step 3/3: Seeding Blog Posts');
                await seedBlog();
                results.blog = true;
                printSuccess('Blog posts seeding completed');
            } else {
                printWarning('Blog post seeding skipped (--skip-blog flag)');
            }
        }

        // Print summary
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log('\n' + colors.green + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset);
        console.log(colors.green + colors.bright + '                    SEEDING COMPLETE!                       ' + colors.reset);
        console.log(colors.green + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset);

        console.log('\n' + colors.bright + 'Summary:' + colors.reset);
        if (results.categories) printSuccess('Categories: Seeded');
        if (results.products) printSuccess('Products: Seeded');
        if (results.blog) printSuccess('Blog Posts: Seeded');

        console.log('\n' + colors.cyan + `⏱  Total time: ${duration}s` + colors.reset);

        console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
        console.log('1. Create an admin user: ' + colors.yellow + 'node seed-roles.js' + colors.reset);
        console.log('2. Start your server: ' + colors.yellow + 'npm start' + colors.reset);
        console.log('3. Visit your app and verify the data\n');

        process.exit(0);
    } catch (error) {
        console.log('\n' + colors.red + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset);
        console.log(colors.red + colors.bright + '                    SEEDING FAILED!                         ' + colors.reset);
        console.log(colors.red + colors.bright + '═══════════════════════════════════════════════════════════' + colors.reset);

        printError('Error during seeding process:');
        console.error(error);

        console.log('\n' + colors.bright + 'Completed Steps:' + colors.reset);
        if (results.categories) printSuccess('Categories: Seeded');
        else printError('Categories: Failed or not started');

        if (results.products) printSuccess('Products: Seeded');
        else printError('Products: Failed or not started');

        if (results.blog) printSuccess('Blog Posts: Seeded');
        else printError('Blog Posts: Failed or not started');

        console.log('\n' + colors.yellow + 'Tip: You can run individual seed scripts to retry:' + colors.reset);
        console.log('  - node scripts/seed-categories.js');
        console.log('  - node scripts/seed-products.js');
        console.log('  - node scripts/seed-blog.js\n');

        process.exit(1);
    }
}

// Run the master seed function
if (require.main === module) {
    masterSeed();
}

module.exports = { masterSeed };
