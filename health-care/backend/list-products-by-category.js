#!/usr/bin/env node
/**
 * List All Products By Category
 * Simple tool to review what products are in each category
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function listProductsByCategory() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Get all categories
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    console.log(`📋 Found ${categories.length} active categories\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const category of categories) {
      const products = await Product.find({ 
        category: category._id,
        isActive: true 
      }).sort({ name: 1 });

      console.log(`📦 ${category.name.toUpperCase()} (${products.length} products)`);
      console.log('─'.repeat(60));

      if (products.length === 0) {
        console.log('   (No products in this category)');
      } else {
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          if (product.brand) {
            console.log(`      Brand: ${product.brand}`);
          }
          if (product.price) {
            console.log(`      Price: ৳${product.price.toLocaleString()}`);
          }
        });
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Review complete!\n');
    console.log('💡 If you find products in wrong categories:');
    console.log('   1. Run: node review-product-categories.js (automatic fix)');
    console.log('   2. Or update manually in admin panel\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║            List All Products By Category                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

listProductsByCategory();
