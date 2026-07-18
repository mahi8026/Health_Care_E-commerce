#!/usr/bin/env node

/**
 * Auto Import Products (Non-Interactive)
 * Imports products from products.json with Cloudinary upload
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { importProduct } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');
require('dotenv').config();

async function autoImport() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│    Auto Import Products with Images                        │
└────────────────────────────────────────────────────────────┘
  `);

  try {
    const productsFile = path.join(__dirname, 'products.json');
    
    if (!fs.existsSync(productsFile)) {
      console.log('❌ products.json not found!');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    const products = data.products || data;

    console.log(`📦 Found ${products.length} products to import\n`);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚙️  Configuration:');
    console.log('   Upload images: NO (use direct URLs)');
    console.log('   Skip duplicates: YES');
    console.log(`   Brand: Auto-detect from product data\n`);

    console.log('🚀 Starting import...\n');

    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      skipped: 0,
      products: [],
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      
      try {
        console.log(`[${i + 1}/${products.length}] ${productData.name}...`);

        const importResult = await importProduct(productData, {
          brandName: productData.brand || 'Tynor',
          categoryName: productData.category || 'Orthopedic Supports',
          uploadImages: false, // Skip Cloudinary - use direct URLs
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
          console.log(`  ✅ Imported with images (৳${productData.price?.toLocaleString()})`);
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

        // Delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.failed++;
      }
    }

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    IMPORT RESULTS                          │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total Products:  ${results.total}`);
    console.log(`  ✅ Imported:     ${results.success}`);
    console.log(`  ⏭️  Skipped:      ${results.skipped}`);
    console.log(`  ❌ Failed:       ${results.failed}\n`);

    if (results.success > 0) {
      console.log('Successfully imported (first 10):');
      results.products.slice(0, 10).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`);
      });
      if (results.products.length > 10) {
        console.log(`  ... and ${results.products.length - 10} more`);
      }
      console.log('');
    }

    console.log('✅ Import complete!\n');
    console.log('📋 View products at: http://localhost:3000/admin\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

autoImport();
