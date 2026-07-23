/**
 * Script to link existing Cloudinary images to products
 * 
 * This script fetches all assets from Cloudinary media library and matches them
 * to products in the database based on filename patterns (SKU or product name).
 * 
 * Run: node scripts/link-images-from-cloudinary.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport';

// Product model
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

/**
 * Normalize a string for matching (remove special chars, lowercase, trim spaces)
 */
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Fetch all images from Cloudinary folder
 */
async function fetchCloudinaryImages(folder = 'MediportBD/products') {
  console.log(`\n📡 Fetching images from Cloudinary folder: ${folder}`);
  
  const allResources = [];
  let nextCursor = null;
  
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
      next_cursor: nextCursor,
    });
    
    allResources.push(...result.resources);
    nextCursor = result.next_cursor;
    
    console.log(`   Fetched ${result.resources.length} images (total: ${allResources.length})`);
  } while (nextCursor);
  
  console.log(`✅ Found ${allResources.length} images in Cloudinary`);
  return allResources;
}

/**
 * Match Cloudinary image to product based on filename
 */
function matchImageToProduct(image, products) {
  const publicId = image.public_id;
  const filename = publicId.split('/').pop();
  
  // Remove Cloudinary transformations and extensions
  const cleanName = filename
    .replace(/\.original\.(jpeg|jpg|png|webp).*/i, '')
    .replace(/\.(jpeg|jpg|png|webp|gif)$/i, '')
    .replace(/-\d{13,}$/, ''); // Remove timestamp suffixes like -1777825447254
  
  const normalizedFilename = normalize(cleanName);
  
  // Strategy 1: Match by SKU prefix (e.g., "3M-N95-027" matches SKU "3M-N95-027")
  for (const product of products) {
    const sku = product.sku || '';
    const normalizedSku = normalize(sku);
    
    if (normalizedSku && normalizedFilename.startsWith(normalizedSku)) {
      return product;
    }
    
    // Also try if the filename contains the full SKU
    if (normalizedSku.length > 5 && normalizedFilename.includes(normalizedSku)) {
      return product;
    }
  }
  
  // Strategy 2: Match by product name tokens
  for (const product of products) {
    const name = product.name || '';
    const normalizedName = normalize(name);
    
    // Split into meaningful words (>3 chars)
    const nameWords = normalizedName.split(/[^a-z0-9]+/).filter(w => w.length > 3);
    const filenameWords = normalizedFilename.split(/[^a-z0-9]+/).filter(w => w.length > 3);
    
    // Count matching words
    const matchingWords = nameWords.filter(word => 
      filenameWords.some(fw => fw.includes(word) || word.includes(fw))
    );
    
    // If 70%+ of name words match, consider it a match
    if (matchingWords.length >= Math.ceil(nameWords.length * 0.7) && matchingWords.length >= 2) {
      return product;
    }
  }
  
  // Strategy 3: Fuzzy brand + model matching (for cases like "Accu-Chek_Active")
  for (const product of products) {
    const brand = typeof product.brand === 'object' ? product.brand?.name : product.brand;
    const brandNorm = normalize(brand || '');
    
    // Check if both brand and part of product name are in filename
    if (brandNorm && brandNorm.length > 3 && normalizedFilename.includes(brandNorm)) {
      const nameWords = normalize(product.name || '').split(/[^a-z0-9]+/).filter(w => w.length > 3);
      const matchingNameWords = nameWords.filter(w => normalizedFilename.includes(w));
      
      if (matchingNameWords.length >= 1) {
        return product;
      }
    }
  }
  
  return null;
}

/**
 * Main execution
 */
async function linkImages() {
  try {
    console.log('🚀 Starting image linking process...\n');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Fetch all products
    console.log('📋 Fetching products from database...');
    const products = await Product.find({}).lean();
    console.log(`✅ Found ${products.length} products\n`);
    
    // Fetch all Cloudinary images
    const images = await fetchCloudinaryImages('MediportBD/products');
    
    // Match and link images
    console.log('\n🔗 Matching images to products...\n');
    
    let matchedCount = 0;
    let updatedCount = 0;
    const unmatched = [];
    
    for (const image of images) {
      const product = matchImageToProduct(image, products);
      
      if (product) {
        matchedCount++;
        
        // Check if product already has this image
        const imageUrl = image.secure_url;
        const hasImage = product.images?.some(img => 
          (typeof img === 'string' ? img : img.url) === imageUrl
        );
        
        if (!hasImage) {
          // Add image to product
          const imageObj = {
            url: imageUrl,
            publicId: image.public_id,
            isPrimary: !product.images || product.images.length === 0,
            alt: product.name || 'Product image',
          };
          
          await Product.updateOne(
            { _id: product._id },
            { 
              $push: { images: imageObj },
            }
          );
          
          updatedCount++;
          console.log(`✅ Linked image to: ${product.name} (${product.sku})`);
        }
      } else {
        unmatched.push(image.public_id);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    console.log(`Total Cloudinary images: ${images.length}`);
    console.log(`Matched to products: ${matchedCount}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Unmatched images: ${unmatched.length}`);
    
    if (unmatched.length > 0 && unmatched.length < 50) {
      console.log('\n❌ Unmatched images:');
      unmatched.forEach(id => console.log(`   - ${id}`));
    }
    
    console.log('\n✅ Image linking complete!');
    
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
linkImages();
