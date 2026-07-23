#!/usr/bin/env node
/**
 * Final Category Audit
 * Comprehensive check for any remaining miscategorized products
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

// Define what should be in each category
const CATEGORY_RULES = {
  'Diagnostic Equipment': {
    shouldContain: ['scale', 'weight', 'ECG', 'EKG', 'ultrasound', 'blood pressure', 'BP monitor', 
                   'thermometer', 'oximeter', 'stethoscope', 'glucometer', 'analyzer'],
    shouldNotContain: ['reagent', 'kit only', 'test kit', 'chemistry', 'support', 'brace']
  },
  'Laboratory Equipment': {
    shouldContain: ['analyzer', 'centrifuge', 'microscope', 'incubator', 'autoclave', 
                   'spectrophotometer', 'hematology', 'chemistry analyzer'],
    shouldNotContain: ['weight scale', 'bathroom scale', 'body fat', 'BP monitor', 
                      'blood pressure', 'thermometer', 'stethoscope', 'reagent']
  },
  'Laboratory Reagents': {
    shouldContain: ['reagent', 'chemistry', 'HbA1c', 'CBC', 'blood gas', 'calibrator', 'control'],
    shouldNotContain: ['analyzer', 'machine', 'equipment', 'device', 'monitor', 'meter']
  },
  'Surgical Instruments': {
    shouldContain: ['scalpel', 'forceps', 'scissors', 'retractor', 'surgical blade'],
    shouldNotContain: ['reagent', 'test kit', 'blood gas']
  },
  'Orthopedic Supports': {
    shouldContain: ['support', 'brace', 'belt', 'splint', 'collar', 'orthosis', 
                   'knee', 'ankle', 'wrist', 'elbow', 'shoulder', 'back support'],
    shouldNotContain: ['needle', 'infusion', 'catheter', 'scale', 'weight', 'glucose', 
                      'drain', 'suction', 'IV']
  },
  'Diabetes Care': {
    shouldContain: ['glucose', 'diabetes', 'insulin', 'lancet', 'test strip', 'glucometer'],
    shouldNotContain: ['support', 'brace', 'orthopedic']
  },
  'IV & Infusion Therapy': {
    shouldContain: ['infusion', 'IV set', 'cannula', 'IV catheter', 'drip'],
    shouldNotContain: ['support', 'brace', 'scale', 'weight']
  },
  'Consumables': {
    shouldContain: ['needle', 'syringe', 'catheter', 'urobag', 'drain', 'filter', 
                   'stop cock', 'manometer'],
    shouldNotContain: ['support', 'brace', 'analyzer', 'machine']
  },
  'Hospital Machines': {
    shouldContain: ['suction unit', 'ventilator', 'monitor', 'pump', 'machine'],
    shouldNotContain: ['support', 'brace', 'test kit', 'reagent']
  },
  'Surgical & Wound Care': {
    shouldContain: ['wound', 'dressing', 'bandage', 'drain kit', 'surgical pad', 'gauze'],
    shouldNotContain: ['support', 'brace', 'reagent']
  }
};

async function finalCategoryAudit() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    const categories = await Category.find().sort({ name: 1 });
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔍 FINAL CATEGORY AUDIT\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    let totalIssues = 0;
    const issuesByCategory = [];

    for (const category of categories) {
      const products = await Product.find({ category: category._id, isActive: true });
      
      if (products.length === 0) continue;

      const issues = [];
      
      // Check for misplaced items
      for (const product of products) {
        const text = `${product.name} ${product.description || ''}`.toLowerCase();
        
        // Check against category rules
        for (const [ruleCategoryName, rules] of Object.entries(CATEGORY_RULES)) {
          if (category.name === ruleCategoryName && rules.shouldNotContain) {
            for (const keyword of rules.shouldNotContain) {
              if (text.includes(keyword.toLowerCase())) {
                issues.push({
                  product,
                  reason: `Contains "${keyword}" which should not be in ${category.name}`,
                  keyword
                });
                break;
              }
            }
          }
        }
      }

      if (issues.length > 0) {
        totalIssues += issues.length;
        issuesByCategory.push({ category, issues });
      }
    }

    // Report findings
    if (totalIssues === 0) {
      console.log('✅ EXCELLENT! All products are correctly categorized!\n');
      console.log('📊 Category Summary:\n');
      
      for (const category of categories) {
        const count = await Product.countDocuments({ category: category._id, isActive: true });
        if (count > 0) {
          console.log(`   ${category.name}: ${count} products`);
        }
      }
      
      console.log('\n═══════════════════════════════════════════════════════════\n');
    } else {
      console.log(`⚠️  Found ${totalIssues} potential issue(s):\n`);
      
      for (const { category, issues } of issuesByCategory) {
        console.log(`\n📦 ${category.name} (${issues.length} issue(s)):`);
        console.log('─'.repeat(60));
        
        for (const issue of issues) {
          console.log(`\n   • ${issue.product.name}`);
          console.log(`     Reason: ${issue.reason}`);
          console.log(`     Brand: ${issue.product.brand || 'N/A'}`);
        }
      }
      
      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('💡 These items may need manual review or additional categorization rules.\n');
    }

    // Show final statistics
    console.log('📊 Final Statistics:\n');
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCategories = categories.filter(c => c.productCount > 0).length;
    
    console.log(`   Total Active Products: ${totalProducts}`);
    console.log(`   Total Categories with Products: ${totalCategories}`);
    console.log(`   Average Products per Category: ${Math.round(totalProducts / totalCategories)}`);
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
console.log('║              Final Category Audit                            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

finalCategoryAudit();
