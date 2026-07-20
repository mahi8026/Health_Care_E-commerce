/**
 * Script to show Cloudinary image naming patterns
 * 
 * Run: node scripts/show-cloudinary-names.js
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function showImageNames() {
  try {
    console.log('📡 Fetching images from Cloudinary...\n');
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'medcorebd/products',
      max_results: 50, // Get 50 samples
    });
    
    console.log('🖼️  Sample Image Names (first 50):\n');
    console.log('=' .repeat(80));
    
    result.resources.forEach((img, idx) => {
      const publicId = img.public_id;
      const filename = publicId.split('/').pop();
      const folder = publicId.split('/').slice(0, -1).join('/');
      
      console.log(`${idx + 1}. ${filename}`);
      console.log(`   Full path: ${publicId}`);
      console.log(`   Folder: ${folder || '(root)'}`);
      console.log(`   URL: ${img.secure_url.substring(0, 80)}...`);
      console.log();
    });
    
    console.log('=' .repeat(80));
    console.log(`\nShowing ${result.resources.length} of ${result.resources.length} total images`);
    console.log('\n💡 Look at the "filename" to see the naming pattern!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showImageNames();
