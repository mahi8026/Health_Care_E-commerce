/**
 * Clear Sample/Seed Data from Database
 * Run this to remove all sample products and start fresh
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Manufacturer = require('./src/models/Manufacturer');
const Review = require('./src/models/Review');
const Order = require('./src/models/Order');

async function clearSampleData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count before deletion
    const counts = {
      products: await Product.countDocuments(),
      categories: await Category.countDocuments(),
      manufacturers: await Manufacturer.countDocuments(),
      reviews: await Review.countDocuments(),
      orders: await Order.countDocuments()
    };

    console.log('📊 Current Data:');
    console.log(`   Products: ${counts.products}`);
    console.log(`   Categories: ${counts.categories}`);
    console.log(`   Manufacturers: ${counts.manufacturers}`);
    console.log(`   Reviews: ${counts.reviews}`);
    console.log(`   Orders: ${counts.orders}\n`);

    console.log('⚠️  WARNING: This will DELETE ALL DATA!');
    console.log('   Are you sure you want to continue? (yes/no)');
    
    // Wait for user confirmation (run with: node clear-sample-data.js)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Type "yes" to confirm: ', async (answer) => {
      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Cancelled. No data was deleted.');
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
      }

      console.log('\n🗑️  Deleting data...');

      // Delete all collections
      await Product.deleteMany({});
      console.log('✅ Deleted all products');

      await Review.deleteMany({});
      console.log('✅ Deleted all reviews');

      await Order.deleteMany({});
      console.log('✅ Deleted all orders');

      // Keep categories and manufacturers (they're needed for import)
      console.log('ℹ️  Keeping categories and manufacturers for future imports');

      console.log('\n✅ Sample data cleared successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Import your real products using:');
      console.log('      cd scripts && npm run import:auto');
      console.log('   2. Or run: .\\scripts\\quick-import-all.ps1\n');

      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

clearSampleData();
