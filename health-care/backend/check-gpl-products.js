#!/usr/bin/env node
/**
 * CHECK GPL PRODUCTS SCRIPT
 * 
 * This script checks the current status of GPL products and their images.
 * Useful for verifying product data before and after adding images.
 * 
 * USAGE:
 *   node check-gpl-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Manufacturer = require('./src/models/Manufacturer');

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              GPL PRODUCTS STATUS CHECK                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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
      console.log('❌ GPL manufacturer not found in database\n');
      console.log('💡 To create GPL manufacturer and import products:');
      console.log('   node src/scripts/importGplProducts.js\n');
      process.exit(0);
    }

    console.log(`✅ GPL Manufacturer found:`);
    console.log(`   Name: ${gplManufacturer.name}`);
    console.log(`   ID: ${gplManufacturer._id}`);
    console.log(`   Slug: ${gplManufacturer.slug}`);
    console.log(`   Country: ${gplManufacturer.country || 'N/A'}`);
    console.log(`   Active: ${gplManufacturer.isActive}\n`);

    // Find all GPL products
    console.log('🔍 Finding GPL products...');
    const gplProducts = await Product.find({ 
      brand: gplManufacturer._id
    })
    .select('name sku images isActive stock price')
    .sort({ sku: 1 });

    const activeProducts = gplProducts.filter(p => p.isActive);
    const inactiveProducts = gplProducts.filter(p => !p.isActive);

    console.log(`✅ Found ${gplProducts.length} GPL products total`);
    console.log(`   Active: ${activeProducts.length}`);
    console.log(`   Inactive: ${inactiveProducts.length}\n`);

    if (gplProducts.length === 0) {
      console.log('⚠️  No GPL products found\n');
      console.log('💡 To import GPL products:');
      console.log('   node src/scripts/importGplProducts.js\n');
      process.exit(0);
    }

    // Analyze images
    console.log('─'.repeat(64));
    console.log('📸 IMAGE ANALYSIS\n');

    const productsWithNoImages = activeProducts.filter(p => p.images.length === 0);
    const productsWithImages = activeProducts.filter(p => p.images.length > 0);
    const productsWithOnlyOneImage = activeProducts.filter(p => p.images.length === 1);
    const productsWithMultipleImages = activeProducts.filter(p => p.images.length > 1);

    console.log(`Products with no images:        ${productsWithNoImages.length}`);
    console.log(`Products with images:           ${productsWithImages.length}`);
    console.log(`  - With 1 image:               ${productsWithOnlyOneImage.length}`);
    console.log(`  - With multiple images (2+):  ${productsWithMultipleImages.length}\n`);

    if (productsWithMultipleImages.length > 0) {
      console.log('📊 Image count distribution:');
      const imageCounts = {};
      productsWithImages.forEach(p => {
        const count = p.images.length;
        imageCounts[count] = (imageCounts[count] || 0) + 1;
      });
      Object.keys(imageCounts).sort((a, b) => a - b).forEach(count => {
        console.log(`   ${count} images: ${imageCounts[count]} products`);
      });
      console.log('');
    }

    // Show sample products
    console.log('─'.repeat(64));
    console.log('📦 SAMPLE PRODUCTS (first 10)\n');

    const sampleProducts = activeProducts.slice(0, 10);
    
    sampleProducts.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: ৳${product.price?.toLocaleString() || 'N/A'}`);
      console.log(`   Stock: ${product.stock || 0}`);
      console.log(`   Images: ${product.images.length}`);
      
      if (product.images.length > 0) {
        product.images.forEach((img, imgIdx) => {
          const shortUrl = img.url.substring(0, 60) + '...';
          const primary = img.isPrimary ? '(PRIMARY)' : '';
          console.log(`      ${imgIdx + 1}. ${shortUrl} ${primary}`);
        });
      }
      console.log('');
    });

    // Show products needing images
    if (productsWithNoImages.length > 0) {
      console.log('─'.repeat(64));
      console.log(`⚠️  PRODUCTS WITHOUT IMAGES (${productsWithNoImages.length})\n`);
      
      const showCount = Math.min(10, productsWithNoImages.length);
      productsWithNoImages.slice(0, showCount).forEach((product, idx) => {
        console.log(`${idx + 1}. ${product.name} (${product.sku})`);
      });
      
      if (productsWithNoImages.length > showCount) {
        console.log(`   ... and ${productsWithNoImages.length - showCount} more\n`);
      }
      
      console.log('\n💡 To add GPL brand images to all products:');
      console.log('   node quick-add-gpl-images.js\n');
    }

    // Summary
    console.log('─'.repeat(64));
    console.log('📊 SUMMARY\n');
    console.log(`Total GPL Products:     ${gplProducts.length}`);
    console.log(`Active Products:        ${activeProducts.length}`);
    console.log(`Need Images:            ${productsWithNoImages.length}`);
    console.log(`Have Images:            ${productsWithImages.length}`);
    console.log(`Ready for Display:      ${productsWithImages.length}\n`);

    if (productsWithNoImages.length > 0) {
      const percentage = ((productsWithNoImages.length / activeProducts.length) * 100).toFixed(1);
      console.log(`⚠️  ${percentage}% of active GPL products need images\n`);
    } else {
      console.log('✅ All active GPL products have images!\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
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
