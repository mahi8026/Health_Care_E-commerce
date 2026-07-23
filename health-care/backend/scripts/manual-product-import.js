#!/usr/bin/env node

/**
 * Manual Product Import Tool
 * For when you have product data from browser DevTools or manual collection
 * 
 * Usage:
 * 1. Visit the website and copy product data
 * 2. Paste into products.json file
 * 3. Run: node scripts/manual-product-import.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { importProduct } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function manualImport() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│         Manual Product Import Tool                         │
└────────────────────────────────────────────────────────────┘
  `);

  try {
    // Check if products.json exists
    const productsFile = path.join(__dirname, 'products.json');
    
    if (!fs.existsSync(productsFile)) {
      console.log('📋 No products.json file found. Let me help you create one.\n');
      console.log('I will guide you through entering product data manually.\n');
      
      const products = [];
      let addMore = true;

      while (addMore) {
        console.log('\n─────────────────────────────────────');
        console.log('Enter Product Information:');
        console.log('─────────────────────────────────────\n');

        const product = {
          name: await question('Product Name: '),
          price: parseFloat(await question('Price (BDT): ')),
          compareAtPrice: parseFloat(await question('Original Price/MRP (BDT) [optional]: ') || '0') || null,
          description: await question('Description [optional]: '),
          brand: await question('Brand Name: '),
          category: await question('Category: '),
          stock: parseInt(await question('Stock Quantity [default: 100]: ') || '100'),
          sku: await question('SKU/Product Code [optional]: '),
          images: [],
        };

        // Get images
        console.log('\nImage URLs (press Enter without URL to finish):');
        let imageIndex = 1;
        while (true) {
          const imageUrl = await question(`  Image ${imageIndex} URL: `);
          if (!imageUrl.trim()) break;
          product.images.push(imageUrl.trim());
          imageIndex++;
        }

        products.push(product);

        const continueAnswer = await question('\nAdd another product? (yes/no): ');
        addMore = continueAnswer.toLowerCase().startsWith('y');
      }

      // Save to products.json
      fs.writeFileSync(
        productsFile,
        JSON.stringify({ products }, null, 2)
      );
      console.log(`\n✅ Saved ${products.length} products to products.json`);
    }

    // Read products from file
    const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    const products = data.products || data;

    if (!Array.isArray(products) || products.length === 0) {
      console.log('❌ No products found in products.json');
      console.log('   Expected format: { "products": [ {...}, {...} ] }');
      rl.close();
      return;
    }

    console.log(`\n📦 Found ${products.length} products to import\n`);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const uploadImages = await question('Upload images to Cloudinary? (yes/no) [yes]: ');
    const shouldUploadImages = !uploadImages.toLowerCase().startsWith('n');

    console.log('\n🚀 Starting import...\n');

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
          brandName: productData.brand,
          categoryName: productData.category || 'Medical Equipment',
          uploadImages: shouldUploadImages,
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
          console.log(`  ✅ Imported successfully (৳${productData.price})`);
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
        await new Promise((resolve) => setTimeout(resolve, 500));

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
      results.products.slice(0, 10).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`);
      });
      if (results.products.length > 10) {
        console.log(`  ... and ${results.products.length - 10} more`);
      }
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

    // Ask if they want to delete the products.json file
    const deleteFile = await question('Delete products.json file? (yes/no): ');
    if (deleteFile.toLowerCase().startsWith('y')) {
      fs.unlinkSync(productsFile);
      console.log('🗑️  Deleted products.json\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    logger.error('Manual import failed', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user. Cleaning up...');
  rl.close();
  await mongoose.connection.close();
  process.exit(0);
});

// Run
manualImport();
