#!/usr/bin/env node

/**
 * Import Products to Production
 * Reads exported JSON and imports to production with upsert
 * 
 * Usage: node src/scripts/importProductsToProduction.js
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URI = 'mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0';

async function importProducts() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         IMPORT PRODUCTS TO PRODUCTION                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../../exports/all-products.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ Error: exports/all-products.json not found');
      console.error('   Run: node src/scripts/exportMissingProducts.js first\n');
      process.exit(1);
    }

    console.log('📖 Reading products from JSON...');
    const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   Found: ${products.length} products\n`);

    // Connect to production
    console.log('🔌 Connecting to production MongoDB...');
    await mongoose.connect(PRODUCTION_URI);
    console.log('✅ Connected\n');

    console.log('🚀 Importing products (upsert by SKU)...\n');

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const result = await Product.updateOne(
          { sku: product.sku },
          { $set: product },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          created++;
          console.log(`   ✅ Created: ${product.sku} - ${product.name}`);
        } else if (result.modifiedCount > 0) {
          updated++;
          console.log(`   🔄 Updated: ${product.sku} - ${product.name}`);
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
        console.error(`   ❌ Failed: ${product.sku} - ${error.message}`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    IMPORT SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped} (already up-to-date)`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${products.length}\n`);

    // Get final count
    const finalCount = await Product.countDocuments();
    console.log(`📊 Total products in production: ${finalCount}\n`);

    if (created > 0 || updated > 0) {
      console.log('🎉 Import completed successfully!\n');
      console.log('📝 Next steps:');
      console.log('   1. Restart backend on Render.com (to clear cache)');
      console.log('   2. Visit: https://health-care-e-commerce-murex.vercel.app');
      console.log(`   3. Verify product count: ${finalCount} products\n`);
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected\n');
  }
}

importProducts();
