#!/usr/bin/env node

/**
 * Product Scraper CLI Tool
 * Usage: node scripts/scrape-products.js [options]
 */

const mongoose = require('mongoose');
const { scrapeAndImport } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);

function parseArgs() {
  const options = {
    url: null,
    brand: null,
    category: 'Medical Equipment',
    isListing: false,
    maxProducts: 50,
    uploadImages: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--url':
      case '-u':
        options.url = nextArg;
        i++;
        break;
      case '--brand':
      case '-b':
        options.brand = nextArg;
        i++;
        break;
      case '--category':
      case '-c':
        options.category = nextArg;
        i++;
        break;
      case '--listing':
      case '-l':
        options.isListing = true;
        break;
      case '--max':
      case '-m':
        options.maxProducts = parseInt(nextArg, 10);
        i++;
        break;
      case '--no-images':
        options.uploadImages = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│         MedCore BD - Product Scraper CLI Tool             │
└────────────────────────────────────────────────────────────┘

USAGE:
  node scripts/scrape-products.js [options]

OPTIONS:
  -u, --url <url>           Product page or listing page URL (required)
  -b, --brand <name>        Filter products by brand name
  -c, --category <name>     Category to assign products (default: Medical Equipment)
  -l, --listing             Treat URL as listing page (scrape multiple products)
  -m, --max <number>        Maximum products to scrape from listing (default: 50)
  --no-images               Skip image upload to Cloudinary (faster but no images)
  -h, --help                Show this help message

EXAMPLES:

  1. Scrape a single product page:
     node scripts/scrape-products.js --url "https://example.com/product/ecg-machine"

  2. Scrape a listing page and filter by brand:
     node scripts/scrape-products.js --url "https://example.com/products" --listing --brand "Siemens"

  3. Scrape specific category with max 20 products:
     node scripts/scrape-products.js --url "https://example.com/diagnostic-equipment" --listing --category "Diagnostic Equipment" --max 20

  4. Fast scrape without uploading images:
     node scripts/scrape-products.js --url "https://example.com/products" --listing --no-images

NOTES:
  - Ensure MongoDB is running and MONGODB_URI is set in .env
  - Cloudinary credentials required for image uploads
  - The scraper adds 2-second delays between products to avoid rate limiting
  - Duplicate products (by name) are automatically skipped

  `);
}

async function main() {
  const options = parseArgs();

  if (!options.url) {
    console.error('❌ Error: URL is required\n');
    printHelp();
    process.exit(1);
  }

  console.log(`
┌────────────────────────────────────────────────────────────┐
│         MedCore BD - Product Scraper                       │
└────────────────────────────────────────────────────────────┘
  `);

  console.log('Configuration:');
  console.log(`  URL:           ${options.url}`);
  console.log(`  Brand Filter:  ${options.brand || 'None (all brands)'}`);
  console.log(`  Category:      ${options.category}`);
  console.log(`  Type:          ${options.isListing ? 'Listing Page' : 'Single Product'}`);
  console.log(`  Max Products:  ${options.maxProducts}`);
  console.log(`  Upload Images: ${options.uploadImages ? 'Yes' : 'No'}`);
  console.log('');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Start scraping
    console.log('🕷️  Starting product scraping...\n');

    const results = await scrapeAndImport(options.url, {
      brandFilter: options.brand,
      categoryName: options.category,
      isListingPage: options.isListing,
      maxProducts: options.maxProducts,
      uploadImages: options.uploadImages,
    });

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    SCRAPING RESULTS                        │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total URLs:      ${results.total}`);
    console.log(`  ✅ Imported:     ${results.success}`);
    console.log(`  ⏭️  Skipped:      ${results.skipped} (already exist)`);
    console.log(`  ❌ Failed:       ${results.failed}`);
    console.log('');

    if (results.success > 0) {
      console.log('Successfully imported products:');
      results.products.forEach((product, index) => {
        console.log(
          `  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`
        );
      });
      console.log('');
    }

    if (results.errors.length > 0) {
      console.log('Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.url}`);
        console.log(`     ${error.error}`);
      });
      console.log('');
    }

    console.log('✅ Scraping complete!\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    logger.error('Scraper failed', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', async (error) => {
  console.error('\n❌ Unhandled rejection:', error);
  await mongoose.connection.close();
  process.exit(1);
});

// Run
main();
