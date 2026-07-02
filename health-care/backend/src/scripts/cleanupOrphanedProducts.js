/**
 * Cleanup orphaned products
 * 
 * Deletes active products that are linked to inactive manufacturers
 * Run: node src/scripts/cleanupOrphanedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

async function cleanupOrphanedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all active manufacturers
    const activeManufacturers = await Manufacturer.find({ isActive: true })
      .select('_id')
      .lean();

    const activeManufacturerIds = activeManufacturers.map(m => m._id);

    // Find orphaned products (active products with inactive manufacturers)
    const orphanedProducts = await Product.find({
      brand: { $exists: true, $nin: activeManufacturerIds },
      isActive: true
    })
      .populate('brand', 'name isActive')
      .select('name sku brand')
      .lean();

    console.log('━'.repeat(60));
    console.log('🧹 Orphaned Products Cleanup');
    console.log('━'.repeat(60));
    console.log(`Found ${orphanedProducts.length} orphaned products\n`);

    if (orphanedProducts.length === 0) {
      console.log('✅ No orphaned products found. Database is clean!\n');
      return;
    }

    console.log('Products to be deleted:\n');
    orphanedProducts.slice(0, 20).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     Brand: ${product.brand?.name || 'N/A'} (Active: ${product.brand?.isActive || false})`);
      console.log(`     SKU: ${product.sku || 'N/A'}`);
      console.log('');
    });

    if (orphanedProducts.length > 20) {
      console.log(`  ... and ${orphanedProducts.length - 20} more\n`);
    }

    // Ask for confirmation (in production, you'd want to add a CLI prompt)
    console.log('⚠️  WARNING: This will PERMANENTLY DELETE these products!\n');
    
    // Delete orphaned products
    const deleteResult = await Product.deleteMany({
      brand: { $exists: true, $nin: activeManufacturerIds },
      isActive: true
    });

    console.log('━'.repeat(60));
    console.log('✅ Cleanup Complete');
    console.log('━'.repeat(60));
    console.log(`Deleted ${deleteResult.deletedCount} orphaned products\n`);

    // Verify counts
    const remainingActive = await Product.countDocuments({ isActive: true });
    const productsWithActiveManufacturers = await Product.countDocuments({
      brand: { $in: activeManufacturerIds },
      isActive: true
    });

    console.log('📊 Updated Statistics:');
    console.log(`   Total active products:            ${remainingActive}`);
    console.log(`   Products with active manufacturers: ${productsWithActiveManufacturers}`);
    console.log(`   Difference:                        ${remainingActive - productsWithActiveManufacturers}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
  }
}

cleanupOrphanedProducts();
