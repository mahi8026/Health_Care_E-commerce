#!/usr/bin/env node

/**
 * Export Missing Products to JSON
 * Compares product counts and exports products that might be missing
 * 
 * Usage: node src/scripts/exportMissingProducts.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

async function exportMissingProducts() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         EXPORT PRODUCTS FOR PRODUCTION                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to localhost MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore-bd');
    console.log('✅ Connected\n');

    // Get all products
    console.log('📊 Fetching all products...\n');
    const products = await Product.find({}).lean();
    
    console.log(`   Found: ${products.length} products\n`);

    // Export to JSON
    const outputPath = path.join(__dirname, '../../exports/all-products.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    
    console.log(`✅ Exported to: ${outputPath}\n`);
    console.log('📝 Next steps:');
    console.log('   1. Use mongoimport to import to production:');
    console.log('');
    console.log('   mongoimport --uri="mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd" \\');
    console.log('     --collection=products \\');
    console.log('     --file=exports/all-products.json \\');
    console.log('     --jsonArray \\');
    console.log('     --mode=upsert \\');
    console.log('     --upsertFields=sku');
    console.log('');
    console.log('   This will add missing products without creating duplicates.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected\n');
  }
}

exportMissingProducts();
