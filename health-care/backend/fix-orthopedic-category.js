#!/usr/bin/env node
/**
 * Fix Orthopedic Supports Category
 * Move misplaced products to correct categories
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function fixOrthopedicCategory() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find all categories
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat;
    });

    // Find Orthopedic Supports category
    const orthoCategory = await Category.findOne({ 
      name: { $regex: /orthopedic/i } 
    });

    if (!orthoCategory) {
      console.log('❌ Orthopedic Supports category not found');
      process.exit(1);
    }

    // Get all products in this category
    const products = await Product.find({ 
      category: orthoCategory._id 
    });

    console.log(`📦 Processing ${products.length} products from Orthopedic Supports\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const fixes = [];
    let fixed = 0;

    for (const product of products) {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      let targetCategory = null;
      let reason = '';

      // Determine correct category
      if (text.includes('needle') || text.includes('spinal')) {
        targetCategory = categoryMap['Consumables'] || categoryMap['Surgical Instruments'];
        reason = 'Spinal needle/medical needle';
      } else if (text.includes('iv ') || text.includes('infusion') || text.includes('cannula')) {
        targetCategory = categoryMap['IV & Infusion Therapy'];
        reason = 'IV/Infusion equipment';
      } else if (text.includes('scale') || text.includes('weighing') || text.includes('weight') || text.includes('bathroom')) {
        targetCategory = categoryMap['Diagnostic Equipment'];
        reason = 'Weighing scale';
      } else if (text.includes('glucose') || text.includes('sugar') || text.includes('diabetes') || text.includes('lancet')) {
        targetCategory = categoryMap['Diabetes Care'];
        reason = 'Diabetes care product';
      } else if (text.includes('drain') || text.includes('drainage') || text.includes('wound')) {
        targetCategory = categoryMap['Surgical & Wound Care'];
        reason = 'Wound drainage/surgical care';
      } else if (text.includes('catheter') || text.includes('urobag') || text.includes('urometer') || text.includes('colo bag')) {
        targetCategory = categoryMap['Consumables'];
        reason = 'Medical consumable';
      } else if (text.includes('suction unit')) {
        targetCategory = categoryMap['Hospital Machines'];
        reason = 'Hospital equipment';
      } else if (text.includes('stop cock') || text.includes('manometer') || text.includes('filter')) {
        targetCategory = categoryMap['Consumables'];
        reason = 'Medical accessory';
      }

      if (targetCategory && targetCategory._id.toString() !== orthoCategory._id.toString()) {
        fixes.push({
          product,
          targetCategory,
          reason
        });
      }
    }

    if (fixes.length === 0) {
      console.log('✅ No fixes needed. All products are correctly categorized!\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`🔧 Found ${fixes.length} product(s) to move:\n`);

    for (const fix of fixes) {
      console.log(`📦 ${fix.product.name}`);
      console.log(`   From: Orthopedic Supports`);
      console.log(`   To: ${fix.targetCategory.name}`);
      console.log(`   Reason: ${fix.reason}`);
      
      await Product.findByIdAndUpdate(fix.product._id, {
        category: fix.targetCategory._id
      });
      
      console.log(`   ✅ Moved!\n`);
      fixed++;
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📊 Results: ${fixed} products moved\n`);

    // Update category counts
    console.log('🔄 Updating category product counts...\n');
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id, isActive: true });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
      if (count > 0 || category.name === 'Orthopedic Supports') {
        console.log(`   ${category.name}: ${count} products`);
      }
    }

    console.log('\n✅ Category fixes complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Refresh your admin panel');
    console.log('   2. Review the changes in each category\n');

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
console.log('║         Fix Orthopedic Supports Category                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

fixOrthopedicCategory();
