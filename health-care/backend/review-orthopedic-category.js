#!/usr/bin/env node
/**
 * Review Orthopedic Supports Category
 * Check if 102 products are correctly categorized
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function reviewOrthopedicCategory() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Find Orthopedic Supports category
    const orthoCategory = await Category.findOne({ 
      name: { $regex: /orthopedic/i } 
    });

    if (!orthoCategory) {
      console.log('❌ Orthopedic Supports category not found');
      process.exit(1);
    }

    console.log(`📦 Category: ${orthoCategory.name}`);
    console.log(`   Total products: ${orthoCategory.productCount || 0}\n`);

    // Get all products in this category
    const products = await Product.find({ 
      category: orthoCategory._id 
    }).sort({ name: 1 });

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📋 All Products in Orthopedic Supports:\n');

    // Categorize by keywords to identify potential misplacements
    const categories = {
      orthopedic: [],
      needles: [],
      ivTherapy: [],
      scales: [],
      glucoseMonitoring: [],
      laboratory: [],
      surgical: [],
      other: []
    };

    for (const product of products) {
      const text = `${product.name} ${product.description || ''}`.toLowerCase();
      
      if (text.includes('needle') || text.includes('spinal')) {
        categories.needles.push(product);
      } else if (text.includes('iv ') || text.includes('infusion') || text.includes('cannula')) {
        categories.ivTherapy.push(product);
      } else if (text.includes('scale') || text.includes('weighing') || text.includes('weight')) {
        categories.scales.push(product);
      } else if (text.includes('glucose') || text.includes('sugar') || text.includes('diabetes') || text.includes('lancet')) {
        categories.glucoseMonitoring.push(product);
      } else if (text.includes('reagent') || text.includes('test kit') || text.includes('chemistry')) {
        categories.laboratory.push(product);
      } else if (text.includes('surgical') || text.includes('scalpel') || text.includes('forceps')) {
        categories.surgical.push(product);
      } else if (text.includes('support') || text.includes('brace') || text.includes('belt') || 
                 text.includes('splint') || text.includes('collar') || text.includes('orthosis') ||
                 text.includes('knee') || text.includes('ankle') || text.includes('wrist') ||
                 text.includes('elbow') || text.includes('shoulder') || text.includes('back')) {
        categories.orthopedic.push(product);
      } else {
        categories.other.push(product);
      }
    }

    // Report findings
    console.log('🔍 Analysis by Product Type:\n');
    
    console.log(`✅ Correctly Placed (Orthopedic Supports): ${categories.orthopedic.length} products`);
    if (categories.orthopedic.length > 0 && categories.orthopedic.length <= 20) {
      categories.orthopedic.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.needles.length > 0) {
      console.log(`⚠️  Needles/Spinal Items: ${categories.needles.length} products (should be in Surgical Instruments or Consumables)`);
      categories.needles.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.ivTherapy.length > 0) {
      console.log(`⚠️  IV/Infusion Items: ${categories.ivTherapy.length} products (should be in IV & Infusion Therapy)`);
      categories.ivTherapy.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.scales.length > 0) {
      console.log(`⚠️  Weighing Scales: ${categories.scales.length} products (should be in Diagnostic Equipment)`);
      categories.scales.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.glucoseMonitoring.length > 0) {
      console.log(`⚠️  Glucose/Diabetes Items: ${categories.glucoseMonitoring.length} products (should be in Diabetes Care)`);
      categories.glucoseMonitoring.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.laboratory.length > 0) {
      console.log(`⚠️  Laboratory Items: ${categories.laboratory.length} products (should be in Laboratory Reagents or Equipment)`);
      categories.laboratory.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.surgical.length > 0) {
      console.log(`⚠️  Surgical Items: ${categories.surgical.length} products (should be in Surgical Instruments)`);
      categories.surgical.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    if (categories.other.length > 0) {
      console.log(`❓ Needs Manual Review: ${categories.other.length} products`);
      categories.other.forEach(p => console.log(`   • ${p.name}`));
      console.log('');
    }

    const totalMisplaced = categories.needles.length + categories.ivTherapy.length + 
                          categories.scales.length + categories.glucoseMonitoring.length +
                          categories.laboratory.length + categories.surgical.length;

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   ✅ Correctly placed: ${categories.orthopedic.length}`);
    console.log(`   ⚠️  Potentially misplaced: ${totalMisplaced}`);
    console.log(`   ❓ Needs review: ${categories.other.length}\n`);

    if (totalMisplaced > 0) {
      console.log('💡 To fix these issues:');
      console.log('   1. Run: node fix-orthopedic-category.js (automatic fix)');
      console.log('   2. Or update manually in admin panel\n');
    } else {
      console.log('✅ All products appear to be correctly categorized!\n');
    }

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
console.log('║         Review Orthopedic Supports Category                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

reviewOrthopedicCategory();
