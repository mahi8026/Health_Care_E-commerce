#!/usr/bin/env node
/**
 * Fix Remaining Category Issues
 * Move specific misplaced products
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function fixRemainingIssues() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find categories
    const hospitalMachines = await Category.findOne({ name: /hospital machines/i });
    
    if (!hospitalMachines) {
      console.log('❌ Hospital Machines category not found');
      process.exit(1);
    }

    // Find and fix Rossmax V3 Suction Unit
    const suctionUnit = await Product.findOne({ name: /Rossmax V3 Suction Unit/i });
    
    if (suctionUnit) {
      console.log('📦 Found: Rossmax V3 Suction Unit');
      console.log(`   Current category: ${suctionUnit.category}`);
      console.log(`   Moving to: Hospital Machines\n`);
      
      await Product.findByIdAndUpdate(suctionUnit._id, {
        category: hospitalMachines._id
      });
      
      console.log('✅ Fixed: Rossmax V3 Suction Unit moved to Hospital Machines\n');
    } else {
      console.log('⚠️  Rossmax V3 Suction Unit not found\n');
    }

    // Update category counts
    console.log('🔄 Updating category product counts...\n');
    const categories = await Category.find();
    
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id, isActive: true });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
      if (count > 0) {
        console.log(`   ${category.name}: ${count} products`);
      }
    }

    console.log('\n✅ All fixes complete!\n');

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
console.log('║           Fix Remaining Category Issues                     ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

fixRemainingIssues();
