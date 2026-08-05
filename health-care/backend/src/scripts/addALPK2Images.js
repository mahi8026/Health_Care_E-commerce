#!/usr/bin/env node

/**
 * Add Images to ALPK2 Products
 * 
 * Updates existing ALPK2 products with actual image URLs
 * 
 * Usage:
 *   1. Replace the image URLs below with actual Cloudinary URLs
 *   2. Run: node src/scripts/addALPK2Images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

/**
 * ALPK2 Product Images
 * 
 * IMPORTANT: Replace these placeholder URLs with actual image URLs
 * 
 * Option 1: Upload images to Cloudinary first, then paste URLs here
 * Option 2: Use direct image URLs if images are already hosted
 */
const PRODUCT_IMAGES = {
  'ALPK2 Aneroid Sphygmomanometer': [
    'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1234567890/Mediport/products/alpk2-aneroid-sphygmomanometer.jpg',
    // Add more image URLs for this product
  ],
  
  'ALPK2 Blood Pressure Monitor with Stethoscope': [
    'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1234567890/Mediport/products/alpk2-bp-monitor-stethoscope.jpg',
  ],
  
  'Original Japan ALPK2 Aneroid Sphygmomanometer': [
    'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1234567890/Mediport/products/alpk2-japan-aneroid.jpg',
  ],
  
  'Original Japan ALPK2 Sphygmomanometer with Stethoscope': [
    'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1234567890/Mediport/products/alpk2-japan-sphygmo-stethoscope.jpg',
  ],
  
  'Original Japan ALPK2 Stethoscope': [
    'https://res.cloudinary.com/dm8eqxwlz/image/upload/v1234567890/Mediport/products/alpk2-japan-stethoscope.jpg',
  ],
};

async function addImages() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Add Images to ALPK2 Products');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find ALPK2 brand
    const alpk2 = await Manufacturer.findOne({ name: /ALPK2/i });
    if (!alpk2) {
      console.log('❌ ALPK2 brand not found!');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Found ALPK2 brand\n');

    // Find all ALPK2 products
    const products = await Product.find({ brand: alpk2._id });
    console.log(`→ Found ${products.length} ALPK2 product(s)\n`);

    const stats = {
      total: products.length,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    // Update each product
    for (const product of products) {
      console.log(`→ Processing: ${product.name}`);

      // Get image URLs for this product
      const imageUrls = PRODUCT_IMAGES[product.name];

      if (!imageUrls || imageUrls.length === 0) {
        console.log('   ⊘ No image URLs configured for this product\n');
        stats.skipped++;
        continue;
      }

      // Check if URLs are still placeholders
      const hasPlaceholder = imageUrls.some(url => 
        url.includes('example.com') || url.includes('1234567890')
      );

      if (hasPlaceholder) {
        console.log('   ⚠️  WARNING: Image URLs contain placeholders!');
        console.log('   Please replace with actual Cloudinary URLs\n');
        stats.skipped++;
        continue;
      }

      // Format images for database
      const formattedImages = imageUrls.map((url, index) => ({
        url: url,
        publicId: '', // Cloudinary public ID (optional)
        isPrimary: index === 0,
        alt: `${product.name} - ALPK2 Medical Equipment Bangladesh - MediportBD`,
      }));

      // Update product
      try {
        product.images = formattedImages;
        await product.save();
        console.log(`   ✓ Updated with ${formattedImages.length} image(s)\n`);
        stats.updated++;
      } catch (error) {
        console.log(`   ✗ Failed: ${error.message}\n`);
        stats.failed++;
      }
    }

    // Print summary
    console.log('─'.repeat(60));
    console.log('\n📊 Update Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total products:      ${stats.total}`);
    console.log(`   ✓ Updated:           ${stats.updated}`);
    console.log(`   ⊘ Skipped:           ${stats.skipped}`);
    console.log(`   ✗ Failed:            ${stats.failed}`);
    console.log('─'.repeat(60));

    if (stats.skipped > 0) {
      console.log('\n⚠️  Some products were skipped:');
      console.log('   - Image URLs not configured');
      console.log('   - Image URLs contain placeholders');
      console.log('\n💡 Action Required:');
      console.log('   1. Upload product images to Cloudinary');
      console.log('   2. Update PRODUCT_IMAGES object in this script');
      console.log('   3. Run script again\n');
    }

    if (stats.updated > 0) {
      console.log('\n✅ Success! Product images updated.');
      console.log('   Refresh your website to see the images.\n');
    }

    await mongoose.connection.close();
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run script
if (require.main === module) {
  addImages().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { addImages };
