#!/usr/bin/env node
/**
 * QUICK GPL IMAGES UPDATE SCRIPT
 * 
 * This script adds the 3 GPL brand images to all GPL products.
 * 
 * PREREQUISITE:
 * Upload the 3 GPL images to Cloudinary first and update the URLs below.
 * 
 * USAGE:
 *   node quick-add-gpl-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Manufacturer = require('./src/models/Manufacturer');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION: UPDATE THESE URLS AFTER UPLOADING TO CLOUDINARY
// ═══════════════════════════════════════════════════════════

const GPL_IMAGE_URLS = [
  // GPL brand images from your Cloudinary (Mediport/products/gpl/)
  // Based on your uploaded images - update the filenames if different
  'https://res.cloudinary.com/dmibeqwlz/image/upload/Mediport/products/gpl/gpl-image-1',
  'https://res.cloudinary.com/dmibeqwlz/image/upload/Mediport/products/gpl/gpl-image-2',
  'https://res.cloudinary.com/dmibeqwlz/image/upload/Mediport/products/gpl/gpl-image-3'
];

// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       ADD GPL BRAND IMAGES TO ALL GPL PRODUCTS            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Validate URLs are configured
  if (GPL_IMAGE_URLS[0] === 'CLOUDINARY_URL_1_HERE') {
    console.log('❌ CONFIGURATION REQUIRED\n');
    console.log('Please follow these steps:\n');
    console.log('1️⃣  Upload the 3 GPL brand images to Cloudinary');
    console.log('   Recommended folder: Mediport/brands/gpl/');
    console.log('   Suggested names:');
    console.log('   - gpl-reagent-boxes-1.jpg');
    console.log('   - gpl-reagent-boxes-2.jpg');
    console.log('   - gpl-reagent-boxes-3.jpg\n');
    console.log('2️⃣  Copy the Cloudinary URLs for each image\n');
    console.log('3️⃣  Update the GPL_IMAGE_URLS array in this script:\n');
    console.log('   const GPL_IMAGE_URLS = [');
    console.log('     "https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../image-1.jpg",');
    console.log('     "https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../image-2.jpg",');
    console.log('     "https://res.cloudinary.com/YOUR_CLOUD/image/upload/.../image-3.jpg"');
    console.log('   ];\n');
    console.log('4️⃣  Run this script again: node quick-add-gpl-images.js\n');
    process.exit(0);
  }

  const stats = { total: 0, success: 0, skipped: 0, failed: 0, errors: [] };

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find GPL manufacturer
    console.log('🔍 Finding GPL manufacturer...');
    const gplManufacturer = await Manufacturer.findOne({ 
      $or: [
        { name: 'GPL' },
        { name: /^GPL/i },
        { slug: 'gpl' }
      ]
    });

    if (!gplManufacturer) {
      console.log('❌ GPL manufacturer not found');
      console.log('💡 Creating GPL manufacturer...\n');
      
      const newManufacturer = new Manufacturer({
        name: 'GPL',
        description: 'GPL - Laboratory reagents and diagnostic solutions from Barcelona, Spain',
        country: 'Spain',
        isActive: true
      });
      await newManufacturer.save();
      console.log('✅ GPL manufacturer created\n');
    }

    const manufacturer = gplManufacturer || await Manufacturer.findOne({ name: 'GPL' });
    console.log(`✅ GPL Manufacturer: ${manufacturer.name} (${manufacturer._id})\n`);

    // Find all GPL products
    console.log('🔍 Finding GPL products...');
    const gplProducts = await Product.find({ 
      brand: manufacturer._id,
      isActive: true 
    }).select('name sku images brand');

    stats.total = gplProducts.length;

    if (stats.total === 0) {
      console.log('⚠️  No GPL products found');
      console.log('💡 Run GPL import script first: node src/scripts/importGplProducts.js\n');
      process.exit(0);
    }

    console.log(`✅ Found ${stats.total} GPL products\n`);

    // Prepare image objects
    const gplImages = GPL_IMAGE_URLS.map((url, index) => {
      // Extract publicId from URL (path after /upload/)
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
      const publicId = match ? match[1] : `gpl-brand-${index + 1}`;

      return {
        url: url,
        publicId: publicId,
        isPrimary: false,
        alt: 'GPL Laboratory Reagents - Barcelona, Spain - MediportBD'
      };
    });

    console.log('📸 Images to add:');
    gplImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.url.substring(0, 70)}...`);
    });
    console.log('');

    console.log('─'.repeat(64));
    console.log('🚀 Starting update process...\n');

    // Process each product
    for (let i = 0; i < gplProducts.length; i++) {
      const product = gplProducts[i];
      const progress = `[${i + 1}/${stats.total}]`;
      
      process.stdout.write(`${progress} ${product.name.substring(0, 40)}... `);

      try {
        // Check if product already has these images
        const existingUrls = product.images.map(img => img.url);
        const newImages = gplImages.filter(img => !existingUrls.includes(img.url));

        if (newImages.length === 0) {
          console.log('⏭️  SKIP (already has images)');
          stats.skipped++;
          continue;
        }

        // Add new images
        product.images.push(...newImages);
        await product.save();

        console.log(`✅ OK (+${newImages.length} images)`);
        stats.success++;

      } catch (error) {
        console.log(`❌ FAIL`);
        stats.failed++;
        stats.errors.push({
          product: product.name,
          sku: product.sku,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n─'.repeat(64));
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                        SUMMARY                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`📊 Total GPL products:      ${stats.total}`);
    console.log(`✅ Successfully updated:     ${stats.success}`);
    console.log(`⏭️  Skipped (has images):    ${stats.skipped}`);
    console.log(`❌ Failed:                   ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS:\n');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.product} (${err.sku})`);
        console.log(`   ❌ ${err.error}\n`);
      });
    }

    if (stats.success > 0) {
      console.log('\n✨ Success! GPL brand images have been added to all GPL products.\n');
      console.log('📝 Next steps:');
      console.log('   1. Clear product cache: node clear-cache.js');
      console.log('   2. Verify on frontend: Navigate to any GPL product page');
      console.log('   3. Check image display and alt text\n');
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
  }
}

// Execute
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { main };
