#!/usr/bin/env node
/**
 * ALTERNATIVE METHOD: Upload GPL Images and Add to Products
 * 
 * This script:
 * 1. Takes image URLs (from chat or local files)
 * 2. Uploads them to Cloudinary
 * 3. Adds them to all GPL products
 * 
 * Usage:
 *   node upload-and-add-gpl-images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('./src/models/Product');
const Manufacturer = require('./src/models/Manufacturer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ═══════════════════════════════════════════════════════════
// STEP 1: Save these 3 images to a folder first, then provide paths
// ═══════════════════════════════════════════════════════════

// Option A: If you saved images locally
const LOCAL_IMAGE_PATHS = [
  'C:/Users/mahim/Downloads/gpl-1.jpg',
  'C:/Users/mahim/Downloads/gpl-2.jpg',
  'C:/Users/mahim/Downloads/gpl-3.jpg'
];

// Option B: If images are hosted somewhere (URL)
const IMAGE_URLS = [
  // 'https://example.com/gpl-image-1.jpg',
  // 'https://example.com/gpl-image-2.jpg',
  // 'https://example.com/gpl-image-3.jpg'
];

// Option C: Use placeholder URLs that point to your existing Cloudinary images
// These will work if you already uploaded images anywhere in your Cloudinary
const EXISTING_CLOUDINARY_URLS = [
  // Leave empty if you haven't uploaded yet
];

/**
 * Upload a single image to Cloudinary
 */
async function uploadToCloudinary(imagePath, index) {
  try {
    console.log(`📤 Uploading image ${index + 1}...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'Mediport/products/gpl',
      public_id: `gpl-brand-image-${index + 1}`,
      overwrite: true,
      resource_type: 'auto',
      timeout: 60000
    });

    console.log(`   ✅ Uploaded: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: false,
      alt: 'GPL Laboratory Reagents - Reactivos GPL - Barcelona, Spain - MediportBD'
    };
  } catch (error) {
    console.error(`   ❌ Upload failed: ${error.message}`);
    return null;
  }
}

/**
 * Add images to a GPL product
 */
async function addImagesToProduct(product, images) {
  try {
    const existingUrls = product.images.map(img => img.url);
    const newImages = images.filter(img => !existingUrls.includes(img.url));

    if (newImages.length === 0) {
      return { status: 'skipped', reason: 'already_has_images' };
    }

    product.images.push(...newImages);
    await product.save();

    return { status: 'success', imagesAdded: newImages.length };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   UPLOAD & ADD GPL IMAGES (ALTERNATIVE METHOD)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats = { total: 0, success: 0, skipped: 0, failed: 0, errors: [] };

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Determine which image source to use
    let imagesToUpload = [];
    let uploadNeeded = true;

    if (EXISTING_CLOUDINARY_URLS.length > 0 && EXISTING_CLOUDINARY_URLS[0]) {
      console.log('📸 Using existing Cloudinary URLs...\n');
      imagesToUpload = EXISTING_CLOUDINARY_URLS;
      uploadNeeded = false;
    } else if (LOCAL_IMAGE_PATHS.length > 0 && LOCAL_IMAGE_PATHS[0]) {
      console.log('📁 Using local image files...\n');
      imagesToUpload = LOCAL_IMAGE_PATHS;
    } else if (IMAGE_URLS.length > 0 && IMAGE_URLS[0]) {
      console.log('🌐 Using remote image URLs...\n');
      imagesToUpload = IMAGE_URLS;
    } else {
      console.log('❌ No images configured!\n');
      console.log('Please choose ONE of these methods:\n');
      console.log('METHOD 1: Save images locally and provide paths');
      console.log('─'.repeat(60));
      console.log('1. Save the 3 GPL images from the chat to a folder');
      console.log('2. Edit this script and update LOCAL_IMAGE_PATHS:');
      console.log('   const LOCAL_IMAGE_PATHS = [');
      console.log('     "C:/Users/YourName/Downloads/gpl-1.jpg",');
      console.log('     "C:/Users/YourName/Downloads/gpl-2.jpg",');
      console.log('     "C:/Users/YourName/Downloads/gpl-3.jpg"');
      console.log('   ];');
      console.log('3. Run this script again\n');
      
      console.log('METHOD 2: Upload to Cloudinary first');
      console.log('─'.repeat(60));
      console.log('1. Go to https://cloudinary.com/console');
      console.log('2. Upload the 3 images to any folder');
      console.log('3. Copy the 3 URLs');
      console.log('4. Edit this script and update EXISTING_CLOUDINARY_URLS');
      console.log('5. Run this script again\n');
      
      process.exit(0);
    }

    // Step 1: Upload images to Cloudinary (if needed)
    let uploadedImages = [];
    
    if (uploadNeeded) {
      console.log('─'.repeat(64));
      console.log('STEP 1: Uploading images to Cloudinary');
      console.log('─'.repeat(64));
      console.log(`Target folder: Mediport/products/gpl/\n`);

      for (let i = 0; i < Math.min(3, imagesToUpload.length); i++) {
        const image = await uploadToCloudinary(imagesToUpload[i], i);
        if (image) {
          uploadedImages.push(image);
        }
      }

      if (uploadedImages.length === 0) {
        console.log('\n❌ Failed to upload any images');
        console.log('Check that image paths/URLs are correct\n');
        process.exit(1);
      }

      console.log(`\n✅ Successfully uploaded ${uploadedImages.length} images\n`);
    } else {
      // Use existing URLs
      uploadedImages = EXISTING_CLOUDINARY_URLS.slice(0, 3).map((url, i) => ({
        url: url,
        publicId: url.match(/\/([^/]+?)(?:\.[^.]+)?$/)?.[1] || `gpl-${i + 1}`,
        isPrimary: false,
        alt: 'GPL Laboratory Reagents - Reactivos GPL - Barcelona, Spain - MediportBD'
      }));
    }

    // Step 2: Find GPL manufacturer
    console.log('─'.repeat(64));
    console.log('STEP 2: Finding GPL products');
    console.log('─'.repeat(64) + '\n');

    const gplManufacturer = await Manufacturer.findOne({ 
      $or: [
        { name: 'GPL' },
        { name: /^GPL/i },
        { slug: 'gpl' }
      ]
    });

    if (!gplManufacturer) {
      console.log('⚠️  GPL manufacturer not found, creating...');
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
    console.log(`✅ GPL Manufacturer: ${manufacturer.name}\n`);

    // Find all GPL products
    const gplProducts = await Product.find({ 
      brand: manufacturer._id,
      isActive: true 
    }).select('name sku images');

    stats.total = gplProducts.length;

    if (stats.total === 0) {
      console.log('❌ No GPL products found');
      console.log('💡 Run GPL import script first: node src/scripts/importGplProducts.js\n');
      process.exit(0);
    }

    console.log(`✅ Found ${stats.total} GPL products\n`);

    // Step 3: Add images to all products
    console.log('─'.repeat(64));
    console.log('STEP 3: Adding images to products');
    console.log('─'.repeat(64) + '\n');

    for (let i = 0; i < gplProducts.length; i++) {
      const product = gplProducts[i];
      const progress = `[${i + 1}/${stats.total}]`;
      
      process.stdout.write(`${progress} ${product.name.substring(0, 45)}... `);

      const result = await addImagesToProduct(product, uploadedImages);

      if (result.status === 'success') {
        console.log(`✅ OK (+${result.imagesAdded})`);
        stats.success++;
      } else if (result.status === 'skipped') {
        console.log('⏭️  SKIP');
        stats.skipped++;
      } else {
        console.log('❌ FAIL');
        stats.failed++;
        stats.errors.push({
          product: product.name,
          sku: product.sku,
          error: result.error
        });
      }
    }

    // Summary
    console.log('\n' + '─'.repeat(64));
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
      console.log('\n✨ Success! GPL images added to products.\n');
      console.log('📝 Next steps:');
      console.log('   1. Clear cache: node clear-cache.js');
      console.log('   2. Verify: node check-gpl-products.js');
      console.log('   3. Test on frontend\n');
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

// Run
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { main };
