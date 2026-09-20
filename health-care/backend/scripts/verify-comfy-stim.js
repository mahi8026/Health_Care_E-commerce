/**
 * Verify Comfy Stim Product Data
 * 
 * This script checks the current state of the product in the database
 * 
 * Usage: node scripts/verify-comfy-stim.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');

async function verifyProduct() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding Comfy Stim product...');
    const product = await Product.findOne({ sku: "COMFY-STIM-806-PLUS" })
      .populate('brand')
      .populate('category');
    
    if (!product) {
      console.error('❌ Product not found!');
      process.exit(1);
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('📦 PRODUCT DATA');
    console.log('═'.repeat(70));
    console.log('\nBasic Info:');
    console.log('  ID:', product._id);
    console.log('  SKU:', product.sku);
    console.log('  Name:', product.name);
    console.log('  Slug:', product.slug);
    console.log('  Price: ৳' + product.price);
    console.log('  Stock:', product.stock);
    
    console.log('\nBrand Info:');
    console.log('  Brand ID:', product.brand._id);
    console.log('  Brand Name:', product.brand.name);
    console.log('  Brand Slug:', product.brand.slug);
    
    console.log('\nCategory Info:');
    console.log('  Category ID:', product.category._id);
    console.log('  Category Name:', product.category.name);
    console.log('  Category Slug:', product.category.slug);
    
    console.log('\nImages (' + product.images.length + ' total):');
    product.images.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.isPrimary ? '⭐ PRIMARY' : '  '}`);
      console.log(`     URL: ${img.url}`);
      console.log(`     Public ID: ${img.publicId || '(none)'}`);
      console.log(`     Alt: ${img.alt}`);
    });
    
    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

verifyProduct();
