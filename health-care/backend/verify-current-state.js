#!/usr/bin/env node
/**
 * Verify Current Database State
 * Check what's actually in the database right now
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function verifyCurrentState() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Get all categories with their IDs
    const categories = await Category.find().sort({ name: 1 });
    
    console.log('📋 Categories in Database:\n');
    const categoryMap = {};
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   Product Count: ${cat.productCount || 0}`);
      console.log('');
      categoryMap[cat._id.toString()] = cat.name;
    });

    // Check the specific products mentioned by user
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔍 Checking Specific Products:\n');

    // Medical Supplies products
    const medicalSuppliesCategory = categories.find(c => c.name === 'Medical Supplies');
    if (medicalSuppliesCategory) {
      const medicalSuppliesProducts = await Product.find({ 
        category: medicalSuppliesCategory._id 
      });
      
      console.log(`📦 Medical Supplies (${medicalSuppliesProducts.length} products):`);
      medicalSuppliesProducts.forEach(p => {
        console.log(`   • ${p.name}`);
      });
      console.log('');
    }

    // Diagnostic Devices products
    const diagnosticDevicesCategory = categories.find(c => c.name === 'Diagnostic Devices');
    if (diagnosticDevicesCategory) {
      const diagnosticDevicesProducts = await Product.find({ 
        category: diagnosticDevicesCategory._id 
      });
      
      console.log(`📦 Diagnostic Devices (${diagnosticDevicesProducts.length} products):`);
      diagnosticDevicesProducts.forEach(p => {
        console.log(`   • ${p.name}`);
        console.log(`     Category ID: ${p.category}`);
      });
      console.log('');
    }

    // Laboratory Equipment products
    const labEquipmentCategory = categories.find(c => c.name === 'Laboratory Equipment');
    if (labEquipmentCategory) {
      const labEquipmentProducts = await Product.find({ 
        category: labEquipmentCategory._id 
      });
      
      console.log(`📦 Laboratory Equipment (${labEquipmentProducts.length} products):`);
      labEquipmentProducts.forEach(p => {
        console.log(`   • ${p.name}`);
      });
      console.log('');
    }

    // Check if categories have proper slug fields
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔍 Checking Category Slugs:\n');
    categories.forEach(cat => {
      console.log(`${cat.name}: slug = "${cat.slug || 'MISSING'}"`);
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');

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
console.log('║            Verify Current Database State                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

verifyCurrentState();
