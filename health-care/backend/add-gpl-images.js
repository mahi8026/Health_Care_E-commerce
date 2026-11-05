#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('./src/models/Product');
const Manufacturer = require('./src/models/Manufacturer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// GPL Brand Images URLs (replace these with actual Cloudinary URLs after upload)
const GPL_BRAND_IMAGES = [
  'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/Mediport/brands/gpl/gpl-reagent-boxes-1.jpg',
  'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/Mediport/brands/gpl/gpl-reagent-boxes-2.jpg',
  'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1/Mediport/brands/gpl/gpl-reagent-boxes-3.jpg'
];

/**
 * Upload an image to Cloudinary from local path or URL
 */
async function uploadImageToCloudinary(imagePath, productName, index) {
  try {
    console.log(`   Uploading image ${index + 1}...`);
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'Mediport/products/gpl',
      use_filename: true,
      resource_type: 'auto',
      timeout: 60000
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: false, // Brand images are not primary
      alt: `${productName} - GPL Reagent - MediportBD`
    };
  } catch (error) {
    console.error(`   ✗ Failed to upload image ${index + 1}:`, error.message);
    return null;
  }
}

/**
 * Add GPL brand images to a product
 */
async function addGPLImagesToProduct(product, gplImages) {
  try {
    // Check if product already has these images
    const existingUrls = product.images.map(img => img.url);
    const newImages = gplImages.filter(img => !existingUrls.includes(img.url));

    if (newImages.length === 0) {
      console.log(`   ℹ Product already has GPL brand images`);
      return { status: 'skipped', reason: 'already_has_images' };
    }

    // Add new images to the product
    product.images.push(...newImages);

    // Save the product
    await product.save();

    console.log(`   ✓ Added ${newImages.length} GPL brand image(s)`);
    return { status: 'success', imagesAdded: newImages.length };
  } catch (error) {
    console.error(`   ✗ Failed to update product:`, error.message);
    return { status: 'failed', error: error.message };
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ADD GPL BRAND IMAGES TO ALL GPL PRODUCTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find GPL manufacturer
    const gplManufacturer = await Manufacturer.findOne({ 
      $or: [
        { name: 'GPL' },
        { name: /^GPL/i },
        { slug: 'gpl' }
      ]
    });

    if (!gplManufacturer) {
      console.error('✗ GPL manufacturer not found in database');
      console.log('   Creating GPL manufacturer...\n');
      
      const newManufacturer = new Manufacturer({
        name: 'GPL',
        description: 'GPL - Laboratory reagents and diagnostic solutions from Barcelona, Spain',
        country: 'Spain',
        isActive: true
      });
      await newManufacturer.save();
      console.log('✓ GPL manufacturer created\n');
      gplManufacturer = newManufacturer;
    }

    console.log(`✓ Found GPL manufacturer: ${gplManufacturer.name} (ID: ${gplManufacturer._id})\n`);

    // Find all GPL products
    const gplProducts = await Product.find({ 
      brand: gplManufacturer._id,
      isActive: true 
    }).populate('brand', 'name');

    stats.total = gplProducts.length;

    if (stats.total === 0) {
      console.log('⚠ No GPL products found in database');
      console.log('   Run the GPL product import script first:\n');
      console.log('   node src/scripts/importGplProducts.js\n');
      process.exit(0);
    }

    console.log(`Found ${stats.total} GPL products\n`);
    console.log('─'.repeat(60));

    // Prepare GPL brand images
    console.log('\nStep 1: Preparing GPL brand images...\n');
    console.log('NOTE: You need to provide the 3 GPL brand images.');
    console.log('Options:');
    console.log('  1. Upload the images to Cloudinary manually and update GPL_BRAND_IMAGES');
    console.log('  2. Provide local file paths to auto-upload\n');

    // For manual upload option, use pre-configured URLs
    // For auto-upload option, uncomment and provide local paths:
    /*
    const localImagePaths = [
      'path/to/gpl-image-1.jpg',
      'path/to/gpl-image-2.jpg',
      'path/to/gpl-image-3.jpg'
    ];
    
    const uploadedImages = [];
    for (let i = 0; i < localImagePaths.length; i++) {
      const image = await uploadImageToCloudinary(localImagePaths[i], 'GPL Brand', i);
      if (image) {
        uploadedImages.push(image);
      }
    }
    
    if (uploadedImages.length === 0) {
      console.error('✗ Failed to upload any images');
      process.exit(1);
    }
    
    console.log(`✓ Uploaded ${uploadedImages.length} GPL brand images\n`);
    */

    // For now, check if GPL_BRAND_IMAGES are configured
    if (GPL_BRAND_IMAGES[0].includes('YOUR_CLOUD_NAME')) {
      console.log('\n⚠ CONFIGURATION REQUIRED:\n');
      console.log('Please upload the 3 GPL brand images to Cloudinary and update the');
      console.log('GPL_BRAND_IMAGES array in this script with the actual URLs.\n');
      console.log('Folder structure: Mediport/brands/gpl/\n');
      console.log('After uploading, run this script again.\n');
      process.exit(0);
    }

    // Prepare image objects
    const gplImageObjects = GPL_BRAND_IMAGES.map((url, index) => ({
      url,
      publicId: url.match(/\/([^\/]+)\.(jpg|jpeg|png|webp)$/)?.[1] || `gpl-brand-${index + 1}`,
      isPrimary: false,
      alt: 'GPL Laboratory Reagents - Barcelona, Spain - MediportBD'
    }));

    console.log(`✓ Prepared ${gplImageObjects.length} GPL brand images\n`);
    console.log('─'.repeat(60));
    console.log('\nStep 2: Adding images to GPL products...\n');

    // Process each GPL product
    for (let i = 0; i < gplProducts.length; i++) {
      const product = gplProducts[i];
      console.log(`\n[${i + 1}/${stats.total}] Processing: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Current images: ${product.images.length}`);

      const result = await addGPLImagesToProduct(product, gplImageObjects);

      if (result.status === 'success') {
        stats.success++;
      } else if (result.status === 'skipped') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({
          product: product.name,
          sku: product.sku,
          error: result.error
        });
      }
    }

    // Print summary
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total GPL products:   ${stats.total}`);
    console.log(`✓ Successfully updated: ${stats.success}`);
    console.log(`ℹ Skipped (already has images): ${stats.skipped}`);
    console.log(`✗ Failed: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠ Errors:');
      stats.errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err.product} (${err.sku})`);
        console.log(`   Error: ${err.error}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { main };
