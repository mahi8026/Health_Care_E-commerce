#!/usr/bin/env node

/**
 * Update All Human Products with Official Brand Image
 * 
 * This script:
 * 1. Uploads the official Human Diagnostics reagent boxes image to Cloudinary
 * 2. Updates all Human brand products to use this single branded image
 * 
 * Usage:
 *   node src/scripts/updateHumanProductImage.js <image_path>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 */
async function uploadImage(imagePath) {
  console.log('\n→ Uploading image to Cloudinary...');
  
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'Mediport/products/human',
      public_id: 'human-reagent-boxes-official',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });
    
    console.log(`✓ Image uploaded successfully`);
    console.log(`  URL: ${result.secure_url}`);
    console.log(`  Public ID: ${result.public_id}\n`);
    
    return result.secure_url;
  } catch (error) {
    console.error('✗ Failed to upload image:', error.message);
    throw error;
  }
}

/**
 * Update all Human products with new image
 */
async function updateAllHumanProducts(imageUrl) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Update All Human Products with Official Brand Image');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find Human manufacturer
    console.log('→ Finding Human manufacturer...');
    const human = await Manufacturer.findOne({ slug: 'human' });
    
    if (!human) {
      console.log('✗ Human manufacturer not found!');
      process.exit(1);
    }
    
    console.log(`✓ Found Human manufacturer (ID: ${human._id})\n`);
    
    // Find all Human products
    console.log('→ Finding all Human products...\n');
    const humanProducts = await Product.find({ brand: human._id });
    
    console.log(`Found ${humanProducts.length} Human products\n`);
    console.log('─'.repeat(80));
    
    let updatedCount = 0;
    
    for (const product of humanProducts) {
      try {
        // Update product image
        product.images = [{
          url: imageUrl,
          publicId: 'human-reagent-boxes-official',
          isPrimary: true,
          alt: `${product.name} - Human Diagnostics Germany - Official Reagent Kit - MediportBD Bangladesh`,
        }];
        
        await product.save();
        
        console.log(`✓ ${product.sku} - ${product.name.substring(0, 60)}...`);
        updatedCount++;
        
      } catch (error) {
        console.log(`✗ ${product.sku} - ${product.name.substring(0, 60)}... (${error.message})`);
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ Updated ${updatedCount} of ${humanProducts.length} products\n`);
    
    console.log('📝 Summary:');
    console.log(`   • All Human products now use official brand image`);
    console.log(`   • Image: Human Diagnostics reagent boxes`);
    console.log(`   • Cloudinary URL: ${imageUrl}`);
    console.log(`   • Professional brand presentation`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Visit production site to verify updated images');
    console.log('   2. Check https://health-care-e-commerce-murex.vercel.app/products?brand=Human');
    console.log('   3. Verify all products show the same brand image');
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

/**
 * Main execution
 */
async function main() {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.error('\n❌ Error: Image path required');
    console.error('\nUsage: node updateHumanProductImage.js <image_path>');
    console.error('Example: node updateHumanProductImage.js "C:\\Users\\mahim\\Downloads\\human-boxes.jpg"\n');
    process.exit(1);
  }
  
  try {
    // Upload image to Cloudinary
    const imageUrl = await uploadImage(imagePath);
    
    // Update all products
    await updateAllHumanProducts(imageUrl);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

main();
