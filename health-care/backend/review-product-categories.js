#!/usr/bin/env node
/**
 * Review and Fix Product Categories
 * Interactive tool to review products and move them to correct categories
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Common miscategorization patterns
const CATEGORY_RULES = {
  'Laboratory Equipment': {
    shouldNotContain: [
      'weight', 'scale', 'weighing', 'body fat', 'body composition', 'BMI',
      'blood pressure', 'BP monitor', 'thermometer', 'oximeter', 'pulse',
      'ECG', 'EKG', 'ultrasound', 'X-ray', 'stethoscope'
    ],
    correctCategories: {
      'weight|scale|body fat|BMI': 'Diagnostic Equipment',
      'blood pressure|BP monitor|sphygmomanometer': 'Diagnostic Equipment',
      'thermometer|temperature': 'Diagnostic Equipment',
      'pulse oximeter|SpO2': 'Diagnostic Equipment',
      'ECG|EKG|electrocardiogram': 'Diagnostic Equipment',
      'ultrasound|sonography': 'Diagnostic Equipment',
      'stethoscope': 'Diagnostic Equipment'
    }
  },
  'Laboratory Reagents': {
    shouldNotContain: [
      'machine', 'analyzer', 'equipment', 'device', 'monitor', 'meter',
      'kit', 'test strips', 'lancet', 'needle', 'syringe'
    ],
    note: 'Should only contain chemical reagents, not equipment or consumables'
  },
  'Surgical Instruments': {
    shouldNotContain: [
      'reagent', 'chemistry', 'blood gas', 'HbA1c', 'CBC', 'test'
    ],
    note: 'Should contain surgical tools, not lab reagents'
  }
};

async function reviewProductCategories() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Get all categories
    const categories = await Category.find().sort({ name: 1 });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat;
    });

    console.log('📋 Available Categories:\n');
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.productCount || 0} products)`);
    });
    console.log('');

    // Check each category for potential issues
    let totalIssues = 0;
    const fixes = [];

    for (const [categoryName, rules] of Object.entries(CATEGORY_RULES)) {
      const category = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
      
      if (!category) {
        console.log(`⚠️  Category "${categoryName}" not found, skipping...\n`);
        continue;
      }

      console.log(`🔍 Checking: ${category.name}\n`);
      
      const products = await Product.find({ category: category._id }).sort({ name: 1 });
      
      if (products.length === 0) {
        console.log(`   ✅ No products in this category\n`);
        continue;
      }

      // Check for misplaced products
      const misplaced = [];
      
      for (const product of products) {
        const productText = `${product.name} ${product.description || ''}`.toLowerCase();
        
        for (const keyword of rules.shouldNotContain) {
          if (productText.includes(keyword.toLowerCase())) {
            misplaced.push({
              product,
              keyword,
              suggestedCategory: getSuggestedCategory(productText, rules.correctCategories, categories)
            });
            break;
          }
        }
      }

      if (misplaced.length > 0) {
        totalIssues += misplaced.length;
        console.log(`   ⚠️  Found ${misplaced.length} potentially misplaced product(s):\n`);
        
        for (const item of misplaced) {
          console.log(`   • ${item.product.name}`);
          console.log(`     Brand: ${item.product.brand || 'N/A'}`);
          console.log(`     Matched keyword: "${item.keyword}"`);
          console.log(`     Current category: ${category.name}`);
          console.log(`     Suggested category: ${item.suggestedCategory ? item.suggestedCategory.name : 'Manual review needed'}`);
          console.log('');
          
          fixes.push({
            product: item.product,
            currentCategory: category,
            suggestedCategory: item.suggestedCategory
          });
        }
      } else {
        console.log(`   ✅ All products look correctly categorized\n`);
      }
    }

    if (totalIssues === 0) {
      console.log('✅ No category issues found! All products appear to be correctly categorized.\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📊 Summary: Found ${totalIssues} product(s) that may need recategorization\n`);
    
    const answer = await question('Do you want to fix these automatically? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled. No changes made.\n');
      console.log('💡 To fix manually, use the admin panel or update products individually.\n');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    // Apply fixes
    console.log('\n🔧 Applying fixes...\n');
    let fixed = 0;
    let skipped = 0;

    for (const fix of fixes) {
      if (!fix.suggestedCategory) {
        console.log(`⏭️  Skipped: ${fix.product.name} (manual review needed)`);
        skipped++;
        continue;
      }

      await Product.findByIdAndUpdate(fix.product._id, {
        category: fix.suggestedCategory._id
      });

      console.log(`✅ Moved: ${fix.product.name}`);
      console.log(`   From: ${fix.currentCategory.name} → To: ${fix.suggestedCategory.name}`);
      fixed++;
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);

    // Update category counts
    console.log('\n🔄 Updating category product counts...\n');
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id, isActive: true });
      await Category.findByIdAndUpdate(category._id, { productCount: count });
      console.log(`   ${category.name}: ${count} products`);
    }

    console.log('\n✅ Category fixes complete!\n');
    console.log('💡 Next steps:');
    console.log('   1. Refresh your admin panel');
    console.log('   2. Review the changes in each category');
    console.log('   3. Manually review skipped products if any\n');

    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

function getSuggestedCategory(productText, correctCategories, allCategories) {
  if (!correctCategories) return null;

  for (const [pattern, categoryName] of Object.entries(correctCategories)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(productText)) {
      return allCategories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
    }
  }

  return null;
}

// Run
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         Review and Fix Product Categories                   ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

reviewProductCategories();
