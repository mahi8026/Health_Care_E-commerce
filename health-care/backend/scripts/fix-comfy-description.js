/**
 * Fix Comfy Stim Description and Tags
 * 
 * Remove "Go Well" mentions from description and tags
 * 
 * Usage: node scripts/fix-comfy-description.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');

async function fixDescription() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding Comfy Stim product...');
    const product = await Product.findOne({ sku: "COMFY-STIM-806-PLUS" });
    
    if (!product) {
      console.error('❌ Product not found!');
      process.exit(1);
    }
    
    console.log('✅ Found product:', product.name);
    console.log('\n📝 Current description preview:');
    console.log('   ' + product.description.substring(0, 150) + '...');

    // Update description - remove "by Go Well" mention
    product.description = product.description.replace(/by Go Well/gi, 'by Comfy');
    
    // Update tags - remove "Go Well" tag
    product.tags = product.tags.filter(tag => tag !== 'Go Well');
    
    // Add Comfy tag if not exists
    if (!product.tags.includes('Comfy')) {
      product.tags.push('Comfy');
    }
    
    await product.save();
    
    console.log('\n✅ Description and tags updated!');
    console.log('\n📝 New description preview:');
    console.log('   ' + product.description.substring(0, 150) + '...');
    console.log('\n🏷️  Updated tags:', product.tags.join(', '));
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ PRODUCT UPDATED SUCCESSFULLY');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

fixDescription();
