/**
 * Fix Product Brands - Convert brand names to ObjectIds
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

async function fixProductBrands() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let fixed = 0;
    let skipped = 0;

    for (const product of products) {
      if (product.brand && typeof product.brand === 'string') {
        console.log(`\n🔧 Fixing product: ${product.name}`);
        console.log(`   Current brand: "${product.brand}" (string)`);

        const manufacturer = await Manufacturer.findOne({
          name: { $regex: new RegExp(`^${product.brand}$`, 'i') }
        });

        if (manufacturer) {
          product.brand = manufacturer._id;
          await product.save();
          console.log(`   ✅ Updated to ObjectId: ${manufacturer._id}`);
          fixed++;
        } else {
          console.log(`   ⚠️  Brand "${product.brand}" not found, setting to null`);
          product.brand = null;
          await product.save();
        }
      } else {
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductBrands();
