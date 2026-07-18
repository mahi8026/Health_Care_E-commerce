#!/usr/bin/env node

/**
 * Non-interactive Tynor Sample Products Import
 * Imports the 10 sample Tynor products without prompts
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { importProduct } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');
require('dotenv').config();

async function importSampleProducts() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│    Import Tynor Sample Products (Non-Interactive)          │
└────────────────────────────────────────────────────────────┘
  `);

  try {
    // Read products from file
    const productsFile = path.join(__dirname, 'products.json');
    
    if (!fs.existsSync(productsFile)) {
      console.log('❌ products.json not found!');
      console.log('   Expected location:', productsFile);
      console.log('\n💡 Run this command first:');
      console.log('   copy scripts\\tynor-products-sample.json scripts\\products.json\n');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    const products = data.products || data;

    if (!Array.isArray(products) || products.length === 0) {
      console.log('❌ No products found in products.json');
      process.exit(1);
    }

    console.log(`📦 Found ${products.length} products to import\n`);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚙️  Configuration:');
    console.log('   Upload images: NO (sample has no real images)');
    console.log('   Skip duplicates: YES');
    console.log('   Brand: Tynor');
    console.log('   Category: Orthopedic Supports\n');

    console.log('🚀 Starting import...\n');

    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      skipped: 0,
      products: [],
      errors: [],
    };

    // Import each product
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      
      try {
        console.log(`[${i + 1}/${products.length}] Processing: ${productData.name}...`);

        const importResult = await importProduct(productData, {
          brandName: productData.brand || 'Tynor',
          categoryName: productData.category || 'Orthopedic Supports',
          uploadImages: false, // Skip image upload for sample data
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
          console.log(`  ✅ Imported: ৳${productData.price?.toLocaleString()}`);
        } else if (importResult.reason === 'already_exists') {
          results.skipped++;
          console.log(`  ⏭️  Skipped (already exists)`);
        } else {
          results.failed++;
          results.errors.push({
            product: productData.name,
            error: importResult.reason,
          });
          console.log(`  ❌ Failed: ${importResult.reason}`);
        }

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          product: productData.name,
          error: error.message,
        });
      }
    }

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    IMPORT RESULTS                          │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total Products:  ${results.total}`);
    console.log(`  ✅ Imported:     ${results.success}`);
    console.log(`  ⏭️  Skipped:      ${results.skipped} (already exist)`);
    console.log(`  ❌ Failed:       ${results.failed}`);
    console.log('');

    if (results.success > 0) {
      console.log('Successfully imported products:');
      results.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`);
      });
      console.log('');
    }

    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.product}: ${error.error}`);
      });
      console.log('');
    }

    console.log('✅ Import complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Start backend: cd backend && npm run dev');
    console.log('   2. Start frontend: cd health-care && npm run dev');
    console.log('   3. Open admin: http://localhost:3000/admin');
    console.log('   4. Go to Products → Search for "Tynor"\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    logger.error('Sample import failed', error);
    process.exit(1);
  } finally {
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
importSampleProducts();
