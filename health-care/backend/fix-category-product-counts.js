#!/usr/bin/env node
/**
 * Fix Category Product Counts
 * Recalculates and updates productCount field for all categories
 * 
 * Usage: node fix-category-product-counts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function fixProductCounts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔄 Recalculating product counts for all categories...\n');

    // Get all categories
    const categories = await Category.find({});
    
    let updated = 0;
    let unchanged = 0;

    for (const category of categories) {
      // Count products in this category
      const actualCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      // Get current productCount from database (not virtual)
      const catDoc = await Category.findById(category._id).select('productCount').lean();
      const oldCount = catDoc.productCount || 0;
      
      if (oldCount !== actualCount) {
        // Update category with correct count using updateOne
        await Category.updateOne(
          { _id: category._id },
          { $set: { productCount: actualCount } }
        );
        
        updated++;
        console.log(`  ✅ Updated: ${category.name}`);
        console.log(`     Old count: ${oldCount}`);
        console.log(`     New count: ${actualCount}\n`);
      } else {
        unchanged++;
        console.log(`  ✓ Correct: ${category.name} (${actualCount} products)`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Total categories: ${categories.length}`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ✓ Already correct: ${unchanged}`);

    // Show final distribution
    console.log('\n📦 Final Category Distribution:\n');
    const updatedCategories = await Category.find({ isActive: true })
      .select('name productCount')
      .sort({ productCount: -1 });
    
    let totalProducts = 0;
    updatedCategories.forEach(cat => {
      totalProducts += cat.productCount || 0;
      const bar = '█'.repeat(Math.floor((cat.productCount || 0) / 5));
      console.log(`  ${cat.name.padEnd(35)} ${(cat.productCount || 0).toString().padStart(3)} ${bar}`);
    });
    
    console.log(`\n  Total products across all categories: ${totalProducts}`);

    console.log('\n✅ Product count fix complete!');
    console.log('\n💡 Next Steps:');
    console.log('  1. Hard refresh admin panel: Ctrl + Shift + R');
    console.log('  2. Categories page should now show correct counts');
    console.log('  3. Backend will serve fresh data (no cache)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          Fix Category Product Counts                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

fixProductCounts();
