/**
 * Check manufacturer product counts
 * 
 * Compares the manufacturer page count vs actual product count
 * Run: node src/scripts/checkManufacturerCounts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

async function checkManufacturerCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all active manufacturers
    const manufacturers = await Manufacturer.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    console.log(`📊 Found ${manufacturers.length} active manufacturers\n`);

    // Count products by manufacturer (same as API does)
    const productCounts = await Product.aggregate([
      { $match: { brand: { $in: manufacturers.map(m => m._id) }, isActive: true } },
      { $group: { _id: '$brand', total: { $sum: 1 } } }
    ]);

    const countMap = {};
    productCounts.forEach(({ _id, total }) => {
      countMap[_id.toString()] = total;
    });

    // Total from aggregation
    const totalFromAggregation = productCounts.reduce((sum, item) => sum + item.total, 0);

    // Total active products
    const totalActiveProducts = await Product.countDocuments({ isActive: true });

    // Products with active manufacturers
    const productsWithActiveManufacturers = await Product.countDocuments({
      brand: { $in: manufacturers.map(m => m._id) },
      isActive: true
    });

    console.log('━'.repeat(60));
    console.log('📊 Product Count Analysis:');
    console.log('━'.repeat(60));
    console.log(`Total active products in DB:              ${totalActiveProducts}`);
    console.log(`Products linked to active manufacturers:  ${productsWithActiveManufacturers}`);
    console.log(`Sum from manufacturer aggregation:        ${totalFromAggregation}`);
    console.log(`Difference (missing products):            ${totalActiveProducts - productsWithActiveManufacturers}`);
    console.log('━'.repeat(60));

    // Find products with inactive manufacturers
    const activeManufacturerIds = manufacturers.map(m => m._id);
    const productsWithInactiveManufacturers = await Product.find({
      brand: { $exists: true, $nin: activeManufacturerIds },
      isActive: true
    })
      .populate('brand', 'name isActive')
      .select('name sku brand')
      .limit(10)
      .lean();

    if (productsWithInactiveManufacturers.length > 0) {
      console.log(`\n⚠️  Found ${productsWithInactiveManufacturers.length} products with INACTIVE manufacturers:\n`);
      productsWithInactiveManufacturers.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     Brand: ${product.brand?.name || 'N/A'} (Active: ${product.brand?.isActive})`);
        console.log(`     SKU: ${product.sku}`);
        console.log('');
      });
    }

    // Count inactive manufacturers
    const inactiveManufacturers = await Manufacturer.countDocuments({ isActive: false });
    console.log(`\n📊 Manufacturer Status:`);
    console.log(`   Active manufacturers:   ${manufacturers.length}`);
    console.log(`   Inactive manufacturers: ${inactiveManufacturers}`);

    // Products with inactive manufacturers total
    const totalProductsWithInactiveManufacturers = await Product.countDocuments({
      brand: { $exists: true, $nin: activeManufacturerIds },
      isActive: true
    });

    console.log(`\n💡 Explanation:`);
    console.log(`   The difference of ${totalActiveProducts - productsWithActiveManufacturers} products is because:`);
    console.log(`   - ${totalProductsWithInactiveManufacturers} products are linked to INACTIVE manufacturers`);
    console.log(`   - These products are still active but their manufacturers are hidden`);
    console.log(`\n✅ Solution:`);
    console.log(`   Option 1: Activate the manufacturers (set isActive: true)`);
    console.log(`   Option 2: Reassign products to active manufacturers`);
    console.log(`   Option 3: Mark these products as inactive\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
  }
}

checkManufacturerCounts();
