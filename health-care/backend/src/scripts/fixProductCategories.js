/**
 * Fix Product Categories - Convert category names to ObjectIds
 * 
 * This script fixes products that have category names stored as strings
 * instead of ObjectId references.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function fixProductCategories() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      try {
        // Check if category is a string (name) instead of ObjectId
        if (product.category && typeof product.category === 'string') {
          console.log(`\n🔧 Fixing product: ${product.name}`);
          console.log(`   Current category: "${product.category}" (string)`);

          // Find the category by name
          const category = await Category.findOne({
            name: { $regex: new RegExp(`^${product.category}$`, 'i') }
          });

          if (category) {
            // Update product with ObjectId
            product.category = category._id;
            await product.save();
            console.log(`   ✅ Updated to ObjectId: ${category._id}`);
            fixed++;
          } else {
            console.log(`   ⚠️  Category "${product.category}" not found in database`);
            // Set to null so product doesn't crash queries
            product.category = null;
            await product.save();
            errors++;
          }
        } else if (mongoose.isValidObjectId(product.category)) {
          // Already an ObjectId, skip
          skipped++;
        } else if (!product.category) {
          // No category set
          skipped++;
        }
      } catch (err) {
        console.error(`   ❌ Error fixing product ${product.name}:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped (already correct): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
fixProductCategories();
