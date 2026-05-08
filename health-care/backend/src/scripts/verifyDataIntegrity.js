#!/usr/bin/env node

/**
 * Verify Data Integrity Script
 * Checks for data consistency issues across the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env.production') });
const mongoose = require('mongoose');
const { verifyDataIntegrity } = require('../services/dataSync');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           DATA INTEGRITY VERIFICATION REPORT               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get statistics
    const [
      totalProducts,
      activeProducts,
      totalManufacturers,
      activeManufacturers,
      totalCategories,
      activeCategories
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Manufacturer.countDocuments(),
      Manufacturer.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true })
    ]);

    console.log('📊 Database Statistics:');
    console.log(`   Products: ${activeProducts}/${totalProducts} active`);
    console.log(`   Manufacturers: ${activeManufacturers}/${totalManufacturers} active`);
    console.log(`   Categories: ${activeCategories}/${totalCategories} active\n`);

    // Run integrity check
    console.log('🔍 Running integrity checks...\n');
    const report = await verifyDataIntegrity();

    if (report.healthy) {
      console.log('✅ DATA INTEGRITY: HEALTHY');
      console.log('   No issues found\n');
    } else if (report.error) {
      console.log('❌ DATA INTEGRITY: ERROR');
      console.log(`   ${report.error}\n`);
      process.exit(1);
    } else {
      console.log('⚠️  DATA INTEGRITY: ISSUES FOUND\n');
      
      report.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.type.toUpperCase()}`);
        console.log(`      ${issue.message}`);
        if (issue.manufacturer) {
          console.log(`      Manufacturer: ${issue.manufacturer}`);
        }
        console.log('');
      });

      console.log('💡 Recommendation: Run data sync to fix these issues:');
      console.log('   node src/scripts/syncAllData.js\n');
    }

    // List all manufacturers
    console.log('📋 Manufacturers in Database:');
    const manufacturers = await Manufacturer.find({}).sort('name').lean();
    manufacturers.forEach(mfr => {
      const status = mfr.isActive ? '✅' : '❌';
      console.log(`   ${status} ${mfr.name} (${mfr.country || 'N/A'})`);
    });
    console.log('');

    // List products by brand
    console.log('📦 Products by Brand:');
    for (const mfr of manufacturers) {
      const count = await Product.countDocuments({ brand: mfr._id });
      if (count > 0) {
        console.log(`   ${mfr.name}: ${count} products`);
      }
    }
    console.log('');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              VERIFICATION COMPLETED                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

// Run the script
main();
