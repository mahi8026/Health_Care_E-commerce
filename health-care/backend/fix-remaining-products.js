#!/usr/bin/env node
/**
 * Fix Remaining Product Categories
 * Specifically handles products that are in wrong categories or "Unknown Category"
 * 
 * Usage: node fix-remaining-products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

// Specific product fixes based on analysis
const MANUAL_FIXES = [
  // Laboratory Reagents (Finecare tests currently in Unknown Category)
  { productName: 'Finecare FT3 Rapid Quantitative Test', targetCategory: 'Laboratory Reagents' },
  { productName: 'Finecare T3 Rapid Quantitative Test', targetCategory: 'Laboratory Reagents' },
  { productName: 'Finecare T4 Rapid Quantitative Test', targetCategory: 'Laboratory Reagents' },
  { productName: 'Finecare Vitamin B12 Rapid Quantitative Test', targetCategory: 'Laboratory Reagents' },
  
  // Surgical & Wound Care (Duoderm dressings currently in wrong category)
  { productPattern: /duoderm/i, targetCategory: 'Surgical & Wound Care' },
  { productPattern: /stomahesive/i, targetCategory: 'Surgical & Wound Care' },
  { productPattern: /convatec.*wafer/i, targetCategory: 'Surgical & Wound Care' },
  { productPattern: /convatec.*pouch/i, targetCategory: 'Surgical & Wound Care' },
  
  // Consumables (Romsons products)
  { productPattern: /ryles tube/i, targetCategory: 'Consumables' },
  { productPattern: /urine (bag|collection)/i, targetCategory: 'Consumables' },
  { productPattern: /adult diaper/i, targetCategory: 'Consumables' },
  { productPattern: /airway/i, targetCategory: 'Consumables' },
  { productPattern: /mucus extractor/i, targetCategory: 'Consumables' },
  
  // IV & Infusion Therapy
  { productPattern: /extension (set|line)/i, targetCategory: 'IV & Infusion Therapy' },
  { productPattern: /central venous catheter/i, targetCategory: 'IV & Infusion Therapy' },
  
  // Blood Bank Supplies
  { productPattern: /blood (bag|collection|transfusion)/i, targetCategory: 'Blood Bank Supplies' },
  { productPattern: /cpda.*blood/i, targetCategory: 'Blood Bank Supplies' },
  { productPattern: /triple blood bag/i, targetCategory: 'Blood Bank Supplies' },
  
  // Compression Garments
  { productPattern: /dvt stocking/i, targetCategory: 'Compression Garments' },
  { productPattern: /compression/i, targetCategory: 'Compression Garments' },
  
  // Medical Supplies (general catch-all)
  { productPattern: /abdominal support/i, targetCategory: 'Orthopedic Supports' },
  { productPattern: /cervical/i, targetCategory: 'Orthopedic Supports' },
  { productPattern: /lumbo/i, targetCategory: 'Orthopedic Supports' },
];

async function fixProducts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all categories
    const categories = await Category.find({ isActive: true });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Fetch all products
    const products = await Product.find({});
    
    console.log('🔄 Fixing product categories...\n');
    
    let fixed = 0;
    let alreadyCorrect = 0;
    let notFound = 0;

    for (const fix of MANUAL_FIXES) {
      let matchedProducts = [];
      
      if (fix.productName) {
        // Exact name match
        matchedProducts = products.filter(p => p.name === fix.productName);
      } else if (fix.productPattern) {
        // Pattern match
        matchedProducts = products.filter(p => 
          fix.productPattern.test(p.name) || 
          (p.description && fix.productPattern.test(p.description))
        );
      }
      
      if (matchedProducts.length === 0) {
        continue;
      }
      
      const targetCategoryId = categoryMap[fix.targetCategory];
      
      if (!targetCategoryId) {
        console.log(`  ⚠️  Category not found: "${fix.targetCategory}"`);
        notFound++;
        continue;
      }
      
      for (const product of matchedProducts) {
        const currentCategory = product.category ? 
          categories.find(c => c._id.toString() === product.category.toString())?.name : 
          'None';
        
        if (currentCategory === fix.targetCategory) {
          alreadyCorrect++;
          console.log(`  ✓ Already correct: "${product.name}" → ${fix.targetCategory}`);
          continue;
        }
        
        // Update product category
        product.category = targetCategoryId;
        await product.save({ validateBeforeSave: false });
        
        fixed++;
        console.log(`  ✅ Fixed: "${product.name}" → ${fix.targetCategory} (was: ${currentCategory})`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Fixed: ${fixed}`);
    console.log(`  ✓ Already correct: ${alreadyCorrect}`);
    console.log(`  ⚠️  Categories not found: ${notFound}`);

    console.log('\n✅ Product category fixes complete!');
    console.log('\n💡 Next Steps:');
    console.log('  1. Run: node check-product-organization.js');
    console.log('  2. Refresh admin panel (Ctrl + Shift + R)');
    console.log('  3. Verify products are in correct categories');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the fixes
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          Fix Remaining Product Categories                    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

fixProducts();
