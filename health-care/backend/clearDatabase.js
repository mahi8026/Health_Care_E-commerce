require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Manufacturer = require('./src/models/Manufacturer');

/**
 * Clear All Test Data from Database
 * WARNING: This will delete ALL products, categories, and manufacturers
 * Usage: node clearDatabase.js
 */

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  WARNING: This will delete ALL data from:');
    console.log('   - Products');
    console.log('   - Categories');
    console.log('   - Manufacturers\n');

    // Count current data
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const manufacturerCount = await Manufacturer.countDocuments();

    console.log('📊 Current Database:');
    console.log(`   Products: ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Manufacturers: ${manufacturerCount}\n`);

    if (productCount === 0 && categoryCount === 0 && manufacturerCount === 0) {
      console.log('✅ Database is already empty!');
      await mongoose.disconnect();
      return;
    }

    console.log('🗑️  Deleting all data...\n');

    // Delete all products
    const deletedProducts = await Product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.deletedCount} products`);

    // Delete all categories
    const deletedCategories = await Category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.deletedCount} categories`);

    // Delete all manufacturers
    const deletedManufacturers = await Manufacturer.deleteMany({});
    console.log(`✅ Deleted ${deletedManufacturers.deletedCount} manufacturers`);

    console.log('\n✅ Database cleared successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Add your real product data');
    console.log('   2. Use importProducts.js to import from CSV');
    console.log('   3. Or use seedProducts.js to add products manually\n');

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
clearDatabase();
