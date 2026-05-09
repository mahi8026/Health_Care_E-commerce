/**
 * Check Product Images in Database
 * Run: node check-product-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore-bd';

async function checkImages() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         CHECK PRODUCT IMAGES IN DATABASE                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const Product = require('./src/models/Product');

    // Get products with images
    const products = await Product.find({ 'images.0': { $exists: true } })
      .select('name sku images')
      .limit(10);

    console.log(`📊 Found ${products.length} products with images\n`);

    products.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.name} (${product.sku})`);
      console.log(`   Images: ${product.images.length}`);
      product.images.forEach((img, imgIdx) => {
        console.log(`   ${imgIdx + 1}. URL: ${img.url}`);
        console.log(`      Primary: ${img.isPrimary ? 'Yes' : 'No'}`);
        console.log(`      PublicId: ${img.publicId || 'N/A'}`);
      });
      console.log('');
    });

    // Check for broken image URLs
    const brokenImages = await Product.find({
      $or: [
        { 'images.url': { $regex: /^http:\/\/localhost/ } },
        { 'images.url': { $regex: /^\/uploads\// } },
        { 'images.url': '' },
        { 'images.url': null },
      ]
    }).select('name sku images');

    if (brokenImages.length > 0) {
      console.log('⚠️  Found products with potentially broken image URLs:\n');
      brokenImages.forEach((product) => {
        console.log(`   - ${product.name} (${product.sku})`);
        product.images.forEach((img) => {
          if (!img.url || img.url.startsWith('http://localhost') || img.url.startsWith('/uploads/')) {
            console.log(`     ❌ Broken URL: ${img.url || 'EMPTY'}`);
          }
        });
      });
      console.log('');
    }

    // Check Cloudinary URLs
    const cloudinaryImages = await Product.find({
      'images.url': { $regex: /cloudinary\.com/ }
    }).select('name sku images').limit(5);

    if (cloudinaryImages.length > 0) {
      console.log('✅ Products with Cloudinary URLs:\n');
      cloudinaryImages.forEach((product) => {
        console.log(`   - ${product.name}`);
        console.log(`     URL: ${product.images[0]?.url}`);
      });
      console.log('');
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkImages();
