#!/usr/bin/env node

/**
 * Add Temporary Stock Images to ALPK2 Products
 * 
 * Uses high-quality free stock photos as placeholders
 * Replace with actual ALPK2 product images when available
 * 
 * Usage:
 *   node src/scripts/addTempALPK2Images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

/**
 * Free stock photos from Unsplash (free for commercial use)
 * These are high-quality medical equipment images
 * REPLACE with actual ALPK2 product images when available
 */
const TEMP_IMAGES = {
  'ALPK2 Aneroid Sphygmomanometer': [
    'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80', // Professional blood pressure monitor
  ],
  
  'ALPK2 Blood Pressure Monitor with Stethoscope': [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80', // BP monitor and stethoscope
  ],
  
  'Original Japan ALPK2 Aneroid Sphygmomanometer': [
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80', // Premium blood pressure device
  ],
  
  'Original Japan ALPK2 Sphygmomanometer with Stethoscope': [
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80', // Medical diagnostic kit
  ],
  
  'Original Japan ALPK2 Stethoscope': [
    'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&q=80', // Professional stethoscope
  ],
};

async function addTempImages() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Add Temporary Stock Images to ALPK2 Products');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('⚠️  NOTE: These are temporary stock photos from Unsplash');
  console.log('   Replace with actual ALPK2 product images ASAP\n');

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
      const imageUrls = TEMP_IMAGES[product.name];

      if (!imageUrls || imageUrls.length === 0) {
        console.log('   ⊘ No image URLs configured\n');
        stats.skipped++;
        continue;
      }

      // Format images for database
      const formattedImages = imageUrls.map((url, index) => ({
        url: url,
        publicId: '',
        isPrimary: index === 0,
        alt: `${product.name} - ALPK2 Medical Equipment Bangladesh - MediportBD`,
      }));

      // Update product
      try {
        product.images = formattedImages;
        await product.save();
        console.log(`   ✓ Updated with ${formattedImages.length} temp image(s)\n`);
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

    if (stats.updated > 0) {
      console.log('\n✅ Temporary images added successfully!');
      console.log('\n⚠️  IMPORTANT: Replace these stock photos with actual');
      console.log('   ALPK2 product images as soon as possible.\n');
      console.log('📌 Next Steps:');
      console.log('   1. Contact your ALPK2 supplier for product images');
      console.log('   2. Or manually download from GoWell and upload via Admin');
      console.log('   3. Update images in Admin Dashboard\n');
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
  addTempImages().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { addTempImages };
