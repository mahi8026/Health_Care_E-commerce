/**
 * Fix Primary Images
 * Set the first image as primary for all products
 * Run: node fix-primary-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore-bd';

async function fixPrimaryImages() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         FIX PRIMARY IMAGES IN DATABASE                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const Product = require('./src/models/Product');

    // Get all products with images
    const products = await Product.find({ 'images.0': { $exists: true } });

    console.log(`📊 Found ${products.length} products with images\n`);

    let fixed = 0;

    for (const product of products) {
      let needsUpdate = false;
      
      // Check if any image is marked as primary
      const hasPrimary = product.images.some(img => img.isPrimary === true);
      
      if (!hasPrimary && product.images.length > 0) {
        // Set first image as primary
        product.images[0].isPrimary = true;
        // Ensure all others are not primary
        for (let i = 1; i < product.images.length; i++) {
          product.images[i].isPrimary = false;
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await product.save();
        fixed++;
        console.log(`✅ Fixed: ${product.name} (${product.sku})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Already correct: ${products.length - fixed}\n`);

    await mongoose.disconnect();
    console.log('👋 Disconnected\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixPrimaryImages();
