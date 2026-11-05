#!/usr/bin/env node
/**
 * GET CLOUDINARY URLS FOR GPL IMAGES
 * 
 * This script helps you get the correct Cloudinary URLs for your GPL images.
 * Run this to see what URLs to use in quick-add-gpl-images.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function getGPLImages() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         GET CLOUDINARY URLS FOR GPL IMAGES                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('🔍 Searching for GPL images in Cloudinary...\n');
    console.log(`   Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

    // Search for images in the gpl folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'Mediport/products/gpl',
      max_results: 50
    });

    if (result.resources.length === 0) {
      console.log('❌ No images found in Mediport/products/gpl/\n');
      console.log('💡 Try searching in other folders:\n');
      
      // Try Mediport/brands/gpl
      const result2 = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'Mediport/brands/gpl',
        max_results: 50
      });

      if (result2.resources.length > 0) {
        console.log('✅ Found images in Mediport/brands/gpl/:\n');
        result2.resources.forEach((img, idx) => {
          console.log(`${idx + 1}. ${img.public_id}`);
          console.log(`   URL: ${img.secure_url}\n`);
        });
        
        console.log('\n📋 Copy these URLs to quick-add-gpl-images.js:\n');
        console.log('const GPL_IMAGE_URLS = [');
        result2.resources.slice(0, 3).forEach((img, idx) => {
          console.log(`  '${img.secure_url}'${idx < 2 ? ',' : ''}`);
        });
        console.log('];\n');
        return;
      }

      // Try just Mediport/products
      const result3 = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'Mediport/products',
        max_results: 100
      });

      console.log(`\n📁 Found ${result3.resources.length} images in Mediport/products/\n`);
      console.log('Folders found:');
      const folders = [...new Set(result3.resources.map(r => r.public_id.split('/').slice(0, -1).join('/')))];
      folders.forEach(folder => console.log(`   - ${folder}`));
      
      console.log('\n💡 Upload your 3 GPL images to one of these folders:');
      console.log('   - Mediport/products/gpl/  (recommended)');
      console.log('   - Mediport/brands/gpl/    (alternative)\n');
      
      return;
    }

    console.log(`✅ Found ${result.resources.length} images in Mediport/products/gpl/\n`);
    console.log('─'.repeat(64));

    result.resources.forEach((img, idx) => {
      console.log(`\n${idx + 1}. ${img.public_id.split('/').pop()}`);
      console.log(`   Public ID: ${img.public_id}`);
      console.log(`   URL: ${img.secure_url}`);
      console.log(`   Format: ${img.format}`);
      console.log(`   Size: ${(img.bytes / 1024).toFixed(2)} KB`);
      console.log(`   Dimensions: ${img.width}x${img.height}`);
    });

    console.log('\n─'.repeat(64));
    console.log('\n📋 COPY THIS TO quick-add-gpl-images.js:\n');
    console.log('const GPL_IMAGE_URLS = [');
    result.resources.slice(0, 3).forEach((img, idx) => {
      console.log(`  '${img.secure_url}'${idx < Math.min(2, result.resources.length - 1) ? ',' : ''}`);
    });
    console.log('];\n');

    if (result.resources.length > 3) {
      console.log(`⚠️  You have ${result.resources.length} images but only need 3.`);
      console.log('   The script will use the first 3 URLs above.\n');
    } else if (result.resources.length < 3) {
      console.log(`⚠️  You only have ${result.resources.length} images but need 3.`);
      console.log('   Upload more images to Mediport/products/gpl/ folder.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('Invalid cloud_name')) {
      console.log('\n💡 Check your .env file:');
      console.log('   CLOUDINARY_CLOUD_NAME should be set');
    } else if (error.message.includes('Must supply api_key')) {
      console.log('\n💡 Check your .env file:');
      console.log('   CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET should be set');
    }
  }
}

// Run
if (require.main === module) {
  getGPLImages()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Unhandled error:', err);
      process.exit(1);
    });
}

module.exports = { getGPLImages };
