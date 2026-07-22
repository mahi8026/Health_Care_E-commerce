#!/usr/bin/env node
/**
 * Fix Weight Machine Categories
 * Move body weight/fat analyzers from Laboratory Equipment to correct category
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function fixWeightMachineCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find the Laboratory Equipment category
    const labEquipmentCat = await Category.findOne({ 
      name: { $regex: /laboratory equipment/i }
    });

    if (!labEquipmentCat) {
      console.log('❌ Laboratory Equipment category not found');
      process.exit(1);
    }

    // Find Diagnostic Equipment or Medical Devices category for moving products
    const diagnosticCat = await Category.findOne({
      name: { $regex: /diagnostic equipment/i }
    });

    const medicalDevicesCat = await Category.findOne({
      name: { $regex: /medical devices/i }
    });

    const targetCategory = diagnosticCat || medicalDevicesCat;

    if (!targetCategory) {
      console.log('❌ Target category (Diagnostic Equipment or Medical Devices) not found');
      process.exit(1);
    }

    console.log(`📦 Laboratory Equipment Category: ${labEquipmentCat.name} (${labEquipmentCat._id})`);
    console.log(`🎯 Target Category: ${targetCategory.name} (${targetCategory._id})\n`);

    // Find all products in Laboratory Equipment that are weight/body analyzers
    const weightKeywords = [
      'weight',
      'scale',
      'weighing',
      'body fat',
      'body composition',
      'BMI',
      'fat analyzer',
      'tanita',
      'body analyzer'
    ];

    const regexPattern = new RegExp(weightKeywords.join('|'), 'i');

    const weightProducts = await Product.find({
      category: labEquipmentCat._id,
      $or: [
        { name: regexPattern },
        { description: regexPattern }
      ]
    });

    if (weightProducts.length === 0) {
      console.log('✅ No weight machines found in Laboratory Equipment\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`🔍 Found ${weightProducts.length} weight/body analyzer product(s) in Laboratory Equipment:\n`);

    weightProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Brand: ${product.brand || 'N/A'}`);
      console.log(`      Current Category: ${labEquipmentCat.name}`);
      console.log(`      → Will move to: ${targetCategory.name}`);
      console.log('');
    });

    // Update products
    const result = await Product.updateMany(
      { _id: { $in: weightProducts.map(p => p._id) } },
      { $set: { category: targetCategory._id } }
    );

    console.log(`✅ Updated ${result.modifiedCount} product(s)\n`);

    // Update category product counts
    const labEquipmentCount = await Product.countDocuments({ category: labEquipmentCat._id, isActive: true });
    const targetCategoryCount = await Product.countDocuments({ category: targetCategory._id, isActive: true });

    await Category.findByIdAndUpdate(labEquipmentCat._id, { productCount: labEquipmentCount });
    await Category.findByIdAndUpdate(targetCategory._id, { productCount: targetCategoryCount });

    console.log('📊 Updated category counts:');
    console.log(`   ${labEquipmentCat.name}: ${labEquipmentCount} products`);
    console.log(`   ${targetCategory.name}: ${targetCategoryCount} products\n`);

    console.log('✅ Category fix complete!\n');
    console.log('💡 Recommendations:');
    console.log('   1. Refresh the product page to see the changes');
    console.log('   2. Weight machines should now appear in correct category');
    console.log('   3. Laboratory Equipment should only contain lab instruments\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║        Fix Weight Machine Categories                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

fixWeightMachineCategories();
