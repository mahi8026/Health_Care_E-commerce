#!/usr/bin/env node

/**
 * Upload Product Images to Cloudinary
 * Uploads all product images that are currently external URLs to Cloudinary
 * 
 * Usage:
 *   node scripts/upload-images-to-cloudinary.js
 *   node scripts/upload-images-to-cloudinary.js --brand=Tynor
 *   node scripts/upload-images-to-cloudinary.js --dry-run
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
require('dotenv').config();

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.error('❌ Cloudinary credentials not found in .env file');
  process.exit(1);
}

async function uploadImageToCloudinary(imageUrl, productName) {
  try {
    // Skip if already on Cloudinary
    const imgUrl = typeof imageUrl === 'string' ? imageUrl : imageUrl.url || imageUrl;
    
    if (imgUrl.includes('cloudinary.com')) {
      return { url: imgUrl, uploaded: false, reason: 'already_on_cloudinary' };
    }

    console.log(`  📤 Uploading: ${imgUrl.substring(0, 60)}...`);
    
    const result = await cloudinary.uploader.upload(imgUrl, {
      folder: 'MediportBD/products',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
      timeout: 60000,
    });

    return {
      url: result.secure_url,
      uploaded: true,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`  ❌ Upload failed: ${error.message}`);
    return {
      url: typeof imageUrl === 'string' ? imageUrl : imageUrl.url || imageUrl,
      uploaded: false,
      error: error.message,
    };
  }
}

async function uploadProductImages(options = {}) {
  const { brand, dryRun = false } = options;

  console.log(`
┌────────────────────────────────────────────────────────────┐
│    Upload Product Images to Cloudinary                     │
└────────────────────────────────────────────────────────────┘
  `);

  console.log('⚙️  Configuration:');
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   Brand filter: ${brand || 'All brands'}`);
  console.log(`   Dry run: ${dryRun ? 'YES (no changes)' : 'NO (will upload)'}`);
  console.log('');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Build query
    const query = {};
    if (brand) {
      // Find brand ID
      const Manufacturer = require('../src/models/Manufacturer');
      const brandDoc = await Manufacturer.findOne({ name: new RegExp(brand, 'i') });
      if (!brandDoc) {
        console.log(`❌ Brand "${brand}" not found`);
        process.exit(1);
      }
      query.brand = brandDoc._id;
    }

    // Find products with external images
    console.log('🔍 Finding products with external images...');
    const products = await Product.find(query).populate('brand');
    
    const productsNeedingUpload = products.filter(p => {
      return p.images && p.images.some(img => {
        const imgUrl = typeof img === 'string' ? img : (img.url || '');
        return imgUrl && !imgUrl.includes('cloudinary.com') && imgUrl.startsWith('http');
      });
    });

    console.log(`✅ Found ${productsNeedingUpload.length} products needing upload\n`);

    if (productsNeedingUpload.length === 0) {
      console.log('✨ All products already have Cloudinary images!\n');
      process.exit(0);
    }

    if (dryRun) {
      console.log('🔍 DRY RUN - Products that would be processed:\n');
      productsNeedingUpload.forEach((product, index) => {
        const externalImages = product.images.filter(img => {
          const imgUrl = typeof img === 'string' ? img : (img.url || '');
          return imgUrl && !imgUrl.includes('cloudinary.com') && imgUrl.startsWith('http');
        });
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Brand: ${product.brand?.name || 'Unknown'}`);
        console.log(`   External images: ${externalImages.length}`);
        console.log('');
      });
      console.log('Run without --dry-run to upload\n');
      process.exit(0);
    }

    const results = {
      total: productsNeedingUpload.length,
      success: 0,
      failed: 0,
      skipped: 0,
      totalImages: 0,
      uploadedImages: 0,
    };

    for (let i = 0; i < productsNeedingUpload.length; i++) {
      const product = productsNeedingUpload[i];
      
      console.log(`[${i + 1}/${productsNeedingUpload.length}] ${product.name}`);
      console.log(`  Brand: ${product.brand?.name || 'Unknown'}`);

      const newImages = [];
      let uploadedCount = 0;

      for (const imageObj of product.images) {
        const imageUrl = typeof imageObj === 'string' ? imageObj : (imageObj.url || '');
        
        if (!imageUrl) {
          console.log(`  ⏭️  Skipping empty image`);
          continue;
        }
        
        if (imageUrl.includes('cloudinary.com')) {
          newImages.push(imageObj);
          continue;
        }

        if (!imageUrl.startsWith('http')) {
          console.log(`  ⏭️  Skipping invalid URL: ${imageUrl}`);
          newImages.push(imageObj);
          continue;
        }

        const uploadResult = await uploadImageToCloudinary(imageUrl, product.name);
        
        if (uploadResult.uploaded) {
          newImages.push({
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            isPrimary: newImages.length === 0,
            alt: product.name,
          });
          uploadedCount++;
          console.log(`  ✅ Uploaded successfully`);
        } else if (uploadResult.reason === 'already_on_cloudinary') {
          newImages.push(imageObj);
        } else {
          // Keep original if upload failed
          newImages.push(imageObj);
          console.log(`  ⚠️  Kept original URL (upload failed)`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update product with new image URLs
      if (uploadedCount > 0) {
        product.images = newImages;
        await product.save();
        results.success++;
        results.uploadedImages += uploadedCount;
        console.log(`  ✅ Updated product (${uploadedCount} images uploaded)\n`);
      } else {
        results.skipped++;
        console.log(`  ⏭️  No images uploaded\n`);
      }

      results.totalImages += product.images.length;
    }

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    UPLOAD RESULTS                          │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total Products:     ${results.total}`);
    console.log(`  ✅ Updated:         ${results.success}`);
    console.log(`  ⏭️  Skipped:         ${results.skipped}`);
    console.log(`  ❌ Failed:          ${results.failed}`);
    console.log(`  📸 Total Images:    ${results.totalImages}`);
    console.log(`  ☁️  Uploaded:        ${results.uploadedImages}`);
    console.log('');

    console.log('✅ Upload complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--brand=')) {
    options.brand = arg.split('=')[1];
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
});

// Run
uploadProductImages(options);
