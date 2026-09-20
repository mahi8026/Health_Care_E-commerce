/**
 * Fix Comfy Stim Images - Download from GoWell BD and Upload to Cloudinary
 * 
 * This script downloads the product images from GoWell BD's website
 * and uploads them to Cloudinary, then updates the product with the new URLs.
 * 
 * Usage: node scripts/fix-comfy-stim-images.js
 */

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Original image URLs from GoWell BD
const imageUrls = [
  {
    url: "https://gowellbd.com/wp-content/uploads/2026/04/311-scaled.jpg",
    isPrimary: true,
    alt: "Comfy Stim 806 Plus Digital TENS Machine front view — pain relief device Bangladesh"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1589-scaled.jpg",
    isPrimary: false,
    alt: "Comfy Stim 806 Plus display screen showing therapy settings and controls"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1586-rotated.jpg",
    isPrimary: false,
    alt: "Comfy Stim TENS machine with electrode pads attached for muscle stimulation"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1583-rotated.jpg",
    isPrimary: false,
    alt: "Comfy Stim controls and interface detailed view Bangladesh"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1578-rotated.jpg",
    isPrimary: false,
    alt: "Comfy Stim complete package with all accessories included"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1572-scaled.jpg",
    isPrimary: false,
    alt: "Comfy Stim device packaging and product shot Bangladesh"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1571-scaled.jpg",
    isPrimary: false,
    alt: "Comfy Stim electro-stimulator side angle view"
  },
  {
    url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1555-scaled.jpg",
    isPrimary: false,
    alt: "Comfy Stim TENS EMS machine professional product photography Bangladesh"
  }
];

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  await pipeline(response.data, fs.createWriteStream(filepath));
}

/**
 * Upload image to Cloudinary
 */
async function uploadToCloudinary(filepath, publicId) {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      folder: 'mediportbd/products/physiotherapy',
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('   ❌ Cloudinary upload error:', error.message);
    throw error;
  }
}

async function fixComfyStimImages() {
  let tempDir = null;
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the product
    console.log('🔍 Finding Comfy Stim product...');
    const product = await Product.findOne({ sku: "COMFY-STIM-806-PLUS" });
    
    if (!product) {
      console.error('❌ Product not found! SKU: COMFY-STIM-806-PLUS');
      console.log('   Make sure you ran the import script first.');
      process.exit(1);
    }
    
    console.log('✅ Found product:', product.name);
    console.log('   Product ID:', product._id);
    console.log('   Current images:', product.images.length);

    // Create temp directory for downloads
    tempDir = path.join(__dirname, '..', 'tmp', 'comfy-stim-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    console.log('\n📁 Created temp directory:', tempDir);

    // Process each image
    console.log('\n📸 Processing images...\n');
    const uploadedImages = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageData = imageUrls[i];
      const imageNum = i + 1;
      
      console.log(`   [${imageNum}/${imageUrls.length}] Processing image...`);
      console.log(`   Source: ${imageData.url}`);
      
      try {
        // Download image
        const filename = `comfy-stim-${imageNum}.jpg`;
        const filepath = path.join(tempDir, filename);
        
        console.log('   ⬇️  Downloading...');
        await downloadImage(imageData.url, filepath);
        console.log('   ✅ Downloaded');
        
        // Upload to Cloudinary
        console.log('   ⬆️  Uploading to Cloudinary...');
        const publicId = `comfy-stim-806-plus-${imageNum}`;
        const cloudinaryResult = await uploadToCloudinary(filepath, publicId);
        console.log('   ✅ Uploaded to Cloudinary');
        console.log('   Cloudinary URL:', cloudinaryResult.url);
        
        // Add to array
        uploadedImages.push({
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          isPrimary: imageData.isPrimary,
          alt: imageData.alt
        });
        
        // Delete temp file
        fs.unlinkSync(filepath);
        console.log('   🗑️  Temp file cleaned\n');
        
      } catch (error) {
        console.error(`   ❌ Error processing image ${imageNum}:`, error.message);
        console.log('   Continuing with next image...\n');
      }
    }

    if (uploadedImages.length === 0) {
      console.error('❌ No images were successfully uploaded!');
      process.exit(1);
    }

    // Update product with new image URLs
    console.log('💾 Updating product with new image URLs...');
    product.images = uploadedImages;
    await product.save();
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ IMAGES UPDATED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 Summary:');
    console.log('   Total images processed:', imageUrls.length);
    console.log('   Successfully uploaded:', uploadedImages.length);
    console.log('   Failed:', imageUrls.length - uploadedImages.length);
    
    console.log('\n🖼️  Updated Images:');
    uploadedImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.isPrimary ? '⭐ PRIMARY' : '  '} - ${img.publicId}`);
      console.log(`      ${img.url.substring(0, 80)}...`);
    });
    
    console.log('\n🌐 View Product:');
    console.log('   Frontend: https://www.mediportbd.com/products/' + product.slug);
    console.log('   Admin: https://www.mediportbd.com/admin/products/' + product._id);
    
    console.log('\n✅ Next Steps:');
    console.log('   1. Refresh the product page - images should now load');
    console.log('   2. Clear browser cache if needed (Ctrl+F5)');
    console.log('   3. Verify all images display correctly');
    console.log('   4. Check image quality and size');
    
    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmdirSync(tempDir, { recursive: true });
        console.log('\n🧹 Cleaned up temp directory');
      } catch (err) {
        console.log('\n⚠️  Could not clean up temp directory:', err.message);
      }
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the fix
fixComfyStimImages();
