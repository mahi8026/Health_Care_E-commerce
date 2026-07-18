#!/usr/bin/env node
/**
 * Verify Category Product Counts
 * Double-check that counts are correct in database
 * 
 * Usage: node verify-category-counts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function verifyProductCounts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Verifying Category Product Counts:\n');
    console.log('='.repeat(80));
    console.log(` ${'Category Name'.padEnd(35)} | ${'Saved Count'.padStart(11)} | ${'Actual Count'.padStart(12)} | Status`);
    console.log('='.repeat(80));

    // Get all active categories
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    let totalSaved = 0;
    let totalActual = 0;
    let mismatches = 0;

    for (const category of categories) {
      // Count products in this category
      const actualCount = await Product.countDocuments({
        category: category._id,
        isActive: true
      });
      
      const savedCount = category.productCount || 0;
      totalSaved += savedCount;
      totalActual += actualCount;
      
      const status = savedCount === actualCount ? '✓ OK' : '✗ MISMATCH';
      if (savedCount !== actualCount) {
        mismatches++;
      }
      
      console.log(` ${category.name.padEnd(35)} | ${savedCount.toString().padStart(11)} | ${actualCount.toString().padStart(12)} | ${status}`);
    }

    console.log('='.repeat(80));
    console.log(` ${'TOTAL'.padEnd(35)} | ${totalSaved.toString().padStart(11)} | ${totalActual.toString().padStart(12)} |`);
    console.log('='.repeat(80));

    console.log(`\n📊 Summary:`);
    console.log(`  Total categories checked: ${categories.length}`);
    console.log(`  Mismatches found: ${mismatches}`);
    console.log(`  Total saved count: ${totalSaved}`);
    console.log(`  Total actual count: ${totalActual}`);

    if (mismatches === 0) {
      console.log('\n✅ All category counts are correct!');
    } else {
      console.log(`\n⚠️  Found ${mismatches} categories with incorrect counts`);
      console.log('   Run: node fix-category-product-counts.js');
    }

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
console.log('║          Verify Category Product Counts                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

verifyProductCounts();
