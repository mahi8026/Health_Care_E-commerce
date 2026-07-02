/**
 * Find products without brands
 * 
 * This script identifies products that don't have a manufacturer/brand assigned.
 * Run: node src/scripts/findProductsWithoutBrands.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function findProductsWithoutBrands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Count products without brands
    const withoutBrand = await Product.countDocuments({
      $or: [
        { brand: { $exists: false } },
        { brand: null }
      ],
      isActive: true
    });

    // Count total active products
    const totalActive = await Product.countDocuments({ isActive: true });

    // Count products with brands
    const withBrand = await Product.countDocuments({
      brand: { $exists: true, $ne: null },
      isActive: true
    });

    console.log('\n📊 Product Statistics:');
    console.log('━'.repeat(50));
    console.log(`Total active products:           ${totalActive}`);
    console.log(`Products WITH brand assigned:    ${withBrand}`);
    console.log(`Products WITHOUT brand assigned: ${withoutBrand}`);
    console.log('━'.repeat(50));

    if (withoutBrand > 0) {
      console.log('\n⚠️  Products without brands:');
      const productsWithoutBrand = await Product.find({
        $or: [
          { brand: { $exists: false } },
          { brand: null }
        ],
        isActive: true
      })
        .select('_id name sku category')
        .populate('category', 'name')
        .limit(20)
        .lean();

      productsWithoutBrand.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     SKU: ${product.sku || 'N/A'}`);
        console.log(`     Category: ${product.category?.name || 'N/A'}`);
        console.log(`     ID: ${product._id}`);
        console.log('');
      });

      if (withoutBrand > 20) {
        console.log(`  ... and ${withoutBrand - 20} more\n`);
      }
    }

    console.log('\n💡 To fix this:');
    console.log('   1. Go to Admin → Products');
    console.log('   2. Edit each product without a brand');
    console.log('   3. Assign a manufacturer/brand');
    console.log('   4. Or mark them as inactive if they are test data\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
  }
}

findProductsWithoutBrands();
