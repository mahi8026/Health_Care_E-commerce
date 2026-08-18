#!/usr/bin/env node

/**
 * Fix Human Product Images - Replace Price List Images with Proper Product Images
 * 
 * This script removes the price list images from Human products and replaces them
 * with proper placeholder images or actual product images.
 * 
 * Usage:
 *   node src/scripts/fixHumanProductImages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

/**
 * Professional reagent kit images from Unsplash (free to use)
 * These are generic laboratory reagent bottle/kit images
 */
const REAGENT_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=800&fit=crop',
    alt: 'Laboratory reagent bottles and test kits',
  },
  {
    url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=800&fit=crop',
    alt: 'Medical laboratory reagent testing equipment',
  },
  {
    url: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800&h=800&fit=crop',
    alt: 'Laboratory chemical reagent bottles',
  },
  {
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=800&fit=crop',
    alt: 'Medical diagnostic test kit',
  },
  {
    url: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=800&h=800&fit=crop',
    alt: 'Laboratory test tubes and reagents',
  },
];

/**
 * Update products to use placeholder images
 */
async function fixProductImages() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Fix Human Product Images - Remove Price List Photos');
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
    console.log('→ Finding Human products with price list images...\n');
    const humanProducts = await Product.find({ brand: human._id });
    
    console.log(`Found ${humanProducts.length} Human products\n`);
    console.log('─'.repeat(60));
    
    let updatedCount = 0;
    
    for (const product of humanProducts) {
      // Check if product has price list images (the ones with 'sample' in publicId)
      const hasPriceListImage = product.images.some(img => 
        img.publicId && img.publicId.includes('human-reagent-sample')
      );
      
      if (hasPriceListImage) {
        // Update product with a random professional reagent image
        const productName = product.name || 'Human Reagent Kit';
        const randomImage = REAGENT_IMAGES[updatedCount % REAGENT_IMAGES.length];
        
        product.images = [{
          url: randomImage.url,
          publicId: `human-reagent-${product._id}`,
          isPrimary: true,
          alt: `${productName} - Human Diagnostics Germany - MediportBD Bangladesh`,
        }];
        
        await product.save();
        
        console.log(`✓ Updated: ${product.name}`);
        console.log(`   Old: Price list image`);
        console.log(`   New: Professional reagent image (${updatedCount % REAGENT_IMAGES.length + 1})\n`);
        
        updatedCount++;
      }
    }
    
    console.log('─'.repeat(60));
    console.log(`\n✅ Fixed ${updatedCount} products with professional reagent images\n`);
    
    console.log('📝 Images Used:');
    console.log('   • High-quality laboratory reagent photos from Unsplash');
    console.log('   • Professional medical equipment images');
    console.log('   • Properly sized for web (800x800px)\n');
    
    console.log('💡 To use actual Human product images:');
    console.log('   1. Contact Human Diagnostics for official product photos');
    console.log('   2. Or manually download images from their catalogs');
    console.log('   3. Upload to Cloudinary and update products individually\n');
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

fixProductImages();
