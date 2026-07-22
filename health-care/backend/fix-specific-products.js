#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function fixSpecificProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const categories = await Category.find();
    const getCategory = (name) => categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()));

    const diabetesCare      = getCategory('Diabetes Care');
    const labReagents       = getCategory('Laboratory Reagents');
    const diagnosticEquip   = getCategory('Diagnostic Equipment');
    const labEquipment      = getCategory('Laboratory Equipment');
    const diagnosticDevices = getCategory('Diagnostic Devices');

    // ── Fixes ────────────────────────────────────────────────────────────────

    const fixes = [
      // Issue 1: Accu-Chek Instant S Blood Glucose Test Meter
      // Currently: Diagnostic Devices → Should be: Diabetes Care
      {
        query: { name: /Accu-Chek Instant S Blood Glucose.*Meter/i },
        target: diabetesCare,
        reason: 'Blood glucose meter belongs in Diabetes Care'
      },

      // Issue 2: Finecare TSH Rapid Quantitative Test
      // Currently: Laboratory Equipment → Should be: Laboratory Reagents
      {
        query: { name: /Finecare TSH Rapid Quantitative Test/i },
        target: labReagents,
        reason: 'Rapid quantitative test belongs in Laboratory Reagents'
      },

      // Also move other Finecare tests that are in Lab Equipment
      {
        query: { name: /Finecare.*Rapid.*Test/i, category: labEquipment._id },
        target: labReagents,
        reason: 'Finecare rapid tests belong in Laboratory Reagents'
      },

      // CalPro Rossmax Mobile Calibration System - check if in correct place
      // It's a calibration tool → Laboratory Equipment is actually fine
    ];

    let fixed = 0;

    for (const fix of fixes) {
      if (!fix.target) {
        console.log(`⚠️  Target category not found for: ${JSON.stringify(fix.query)}`);
        continue;
      }

      const products = await Product.find(fix.query);

      for (const product of products) {
        const currentCat = categories.find(c => c._id.toString() === product.category.toString());
        
        if (product.category.toString() === fix.target._id.toString()) {
          console.log(`⏭️  Already correct: ${product.name} → ${fix.target.name}`);
          continue;
        }

        await Product.findByIdAndUpdate(product._id, { category: fix.target._id });
        console.log(`✅ Fixed: ${product.name}`);
        console.log(`   From: ${currentCat ? currentCat.name : product.category}`);
        console.log(`   To:   ${fix.target.name}`);
        console.log(`   Why:  ${fix.reason}\n`);
        fixed++;
      }
    }

    // ── Update all category product counts ──────────────────────────────────
    console.log('🔄 Updating category counts...\n');
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat._id, isActive: true });
      await Category.findByIdAndUpdate(cat._id, { productCount: count });
      if (count > 0) console.log(`   ${cat.name}: ${count}`);
    }

    console.log(`\n✅ Done — ${fixed} product(s) fixed`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixSpecificProducts();
