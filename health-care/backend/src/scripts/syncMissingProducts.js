#!/usr/bin/env node

/**
 * Sync Missing Products from Localhost to Production
 * Compares localhost and production databases and syncs missing products
 * 
 * Usage: node src/scripts/syncMissingProducts.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Production MongoDB URI
const PRODUCTION_URI = 'mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0';

async function syncMissingProducts() {
  let localConn, prodConn;

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         SYNC MISSING PRODUCTS TO PRODUCTION                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Connect to localhost
    console.log('🔌 Connecting to localhost MongoDB...');
    const localhostUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore-bd';
    console.log(`   URI: ${localhostUri.includes('localhost') ? 'localhost' : 'remote'}`);
    localConn = await mongoose.createConnection(localhostUri).asPromise();
    console.log('✅ Connected to localhost\n');

    // Connect to production
    console.log('🔌 Connecting to production MongoDB...');
    prodConn = await mongoose.createConnection(PRODUCTION_URI).asPromise();
    console.log('✅ Connected to production\n');

    // Get models
    const LocalProduct = localConn.model('Product', Product.schema);
    const ProdProduct = prodConn.model('Product', Product.schema);

    // Get all products from both databases
    console.log('📊 Fetching products from both databases...\n');
    
    const [localProducts, prodProducts] = await Promise.all([
      LocalProduct.find({}).select('sku name brand category').lean(),
      ProdProduct.find({}).select('sku').lean()
    ]);

    console.log(`   Localhost: ${localProducts.length} products`);
    console.log(`   Production: ${prodProducts.length} products`);
    console.log(`   Difference: ${localProducts.length - prodProducts.length} products\n`);

    // Create a Set of production SKUs for fast lookup
    const prodSKUs = new Set(prodProducts.map(p => p.sku));

    // Find missing products
    const missingProducts = localProducts.filter(p => !prodSKUs.has(p.sku));

    if (missingProducts.length === 0) {
      console.log('✅ No missing products found. Databases are in sync!\n');
      return;
    }

    console.log(`📋 Found ${missingProducts.length} missing products:\n`);
    
    // Group by brand
    const byBrand = {};
    for (const product of missingProducts) {
      const brandId = product.brand?.toString() || 'Unknown';
      if (!byBrand[brandId]) byBrand[brandId] = [];
      byBrand[brandId].push(product);
    }

    // Display missing products by brand
    for (const [brandId, products] of Object.entries(byBrand)) {
      console.log(`   Brand ${brandId}:`);
      products.forEach(p => {
        console.log(`      • ${p.sku} - ${p.name}`);
      });
      console.log('');
    }

    // Ask for confirmation
    console.log('⚠️  Do you want to copy these products to production?');
    console.log('   This will create new product records in production database.\n');

    // For automated execution, set AUTO_CONFIRM=true
    if (process.env.AUTO_CONFIRM !== 'true') {
      console.log('   Set AUTO_CONFIRM=true environment variable to skip this prompt.\n');
      console.log('   Exiting without changes. Run with AUTO_CONFIRM=true to proceed.\n');
      return;
    }

    console.log('🚀 Copying missing products to production...\n');

    let copiedCount = 0;
    let failedCount = 0;

    for (const missingProduct of missingProducts) {
      try {
        // Get full product data from localhost
        const fullProduct = await LocalProduct.findOne({ sku: missingProduct.sku }).lean();
        
        if (!fullProduct) {
          console.log(`   ⏭️  Skipped: ${missingProduct.sku} (not found in localhost)`);
          continue;
        }

        // Remove _id to let MongoDB generate a new one
        delete fullProduct._id;

        // Create in production
        await ProdProduct.create(fullProduct);
        
        console.log(`   ✅ Copied: ${fullProduct.sku} - ${fullProduct.name}`);
        copiedCount++;

      } catch (error) {
        console.error(`   ❌ Failed: ${missingProduct.sku} - ${error.message}`);
        failedCount++;
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SYNC SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Copied: ${copiedCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📊 Total Missing: ${missingProducts.length}\n`);

    if (copiedCount > 0) {
      console.log('🎉 Products synced successfully!\n');
      console.log('📝 Next steps:');
      console.log('   1. Restart backend on Render.com (to clear cache)');
      console.log('   2. Visit: https://health-care-e-commerce-murex.vercel.app');
      console.log('   3. Verify product count matches localhost\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (prodConn) await prodConn.close();
    console.log('👋 Disconnected from databases\n');
  }
}

// Run the script
syncMissingProducts();
