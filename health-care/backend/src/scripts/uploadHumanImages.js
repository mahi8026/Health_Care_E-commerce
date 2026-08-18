#!/usr/bin/env node

/**
 * Helper script to upload Human brand product images to Cloudinary
 * 
 * This script uploads the three provided images:
 * - IMG_20260818_141842.jpg
 * - IMG_20260818_141732.jpg
 * - IMG_20260818_141745.jpg
 * 
 * Usage:
 *   node src/scripts/uploadHumanImages.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_FILES = [
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141842.jpg',
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141732.jpg',
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141745.jpg',
];

async function uploadImage(filePath, index) {
  try {
    console.log(`\nUploading image ${index + 1}/${IMAGE_FILES.length}:`);
    console.log(`  File: ${path.basename(filePath)}`);

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'Mediport/products/human',
      public_id: `human-reagent-${index + 1}`,
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });

    console.log(`  ✓ Uploaded successfully`);
    console.log(`  URL: ${result.secure_url}`);
    console.log(`  Public ID: ${result.public_id}`);

    return {
      filename: path.basename(filePath),
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`  ✗ Failed to upload: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Human Brand Image Upload to Cloudinary');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];

  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const result = await uploadImage(IMAGE_FILES[i], i);
    if (result) {
      results.push(result);
    }
    // Rate limiting
    if (i < IMAGE_FILES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Upload Summary:');
  console.log('─'.repeat(60));
  console.log(`   Total images:         ${IMAGE_FILES.length}`);
  console.log(`   ✓ Successfully uploaded: ${results.length}`);
  console.log(`   ✗ Failed:             ${IMAGE_FILES.length - results.length}`);

  if (results.length > 0) {
    console.log('\n📸 Uploaded Image URLs:\n');
    results.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.filename}`);
      console.log(`      ${result.url}\n`);
    });

    console.log('\n💡 Copy these URLs and use them in your product data:\n');
    console.log('const images = [');
    results.forEach((result, i) => {
      console.log(`  '${result.url}'${i < results.length - 1 ? ',' : ''}`);
    });
    console.log('];\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
