#!/usr/bin/env node
/**
 * Organize Existing Products by Category
 * Automatically assigns products to correct categories based on product names
 * 
 * Usage: node organize-products-by-category.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

// Product name patterns and their target categories
const CATEGORY_MAPPING = {
  'Diagnostic Equipment': [
    'stethoscope',
    'blood pressure',
    'bp monitor',
    'sphygmomanometer',
    'pulse oximeter',
    'oximeter',
    'thermometer',
    'fetal doppler',
    'doppler',
    'weight scale',
    'weighing scale',
    'body scale',
    'patient scale'
  ],
  'Laboratory Equipment': [
    'esr machine',
    'esr analyzer',
    'calibration system',
    'calibrator',
    'halogen bulb',
    'halogen lamp',
    'analyzer',
    'laboratory machine'
  ],
  'Laboratory Reagents': [
    'rf latex',
    'ra latex',
    'reagent',
    'tsh test',
    'ige test',
    'ft4 test',
    't4 test',
    'ft3 test',
    'dengue test',
    'rapid test',
    'test kit',
    'diagnostic kit'
  ],
  'IV & Infusion Therapy': [
    'iv cannula',
    'cannula',
    'spinal needle',
    'epidural needle',
    'burette set',
    'infusion set',
    'iv set',
    'scalp vein',
    'scalp vein set',
    'butterfly needle',
    'iv line',
    'extension line'
  ],
  'Blood Bank Supplies': [
    'blood bag',
    'blood collection bag',
    'blood collection',
    'transfusion bag',
    'apheresis'
  ],
  'Hospital Machines': [
    'nebulizer',
    'bipap',
    'bi-pap',
    'cpap',
    'suction machine',
    'suction pump',
    'aspirator',
    'ventilator',
    'oxygen concentrator'
  ],
  'Surgical & Wound Care': [
    'surgical tape',
    'adhesive tape',
    'colostomy',
    'ostomy',
    'wound dressing',
    'bandage',
    'gauze'
  ],
  'Diabetes Care': [
    'glucose meter',
    'glucometer',
    'blood sugar',
    'test strip',
    'glucose strip',
    'cgm',
    'continuous glucose',
    'diabetes'
  ],
  'Physiotherapy & Rehabilitation': [
    'tens',
    'tens therapy',
    'electrotherapy',
    'infrared lamp',
    'ir lamp',
    'heating pad',
    'heat therapy',
    'physiotherapy'
  ],
  'Medical Supplies': [
    'mattress',
    'medical mattress',
    'hospital bed',
    'patient bed',
    'wheelchair',
    'walker',
    'crutch'
  ],
  'Ophthalmology & ENT Equipment': [
    'ophthalmoscope',
    'otoscope',
    'retinoscope',
    'hearing aid',
    'hearing amplifier',
    'audiometer',
    'ent',
    'ophthalmology'
  ],
  'Surgical Instruments': [
    'forceps',
    'scissors',
    'scalpel',
    'surgical instrument',
    'trocar',
    'retractor',
    'needle holder',
    'clamp'
  ],
  'Respiratory Equipment': [
    'respiratory',
    'breathing',
    'spirometer',
    'peak flow meter',
    'oxygen mask',
    'nasal cannula'
  ],
  'Orthopedic Supports': [
    'brace',
    'support',
    'orthopedic',
    'knee support',
    'ankle support',
    'back support',
    'cervical collar',
    'lumbar'
  ],
  'Compression Garments': [
    'compression',
    'compression stocking',
    'ted stocking',
    'varicose',
    'elastic stocking'
  ],
  'Consumables': [
    'glove',
    'syringe',
    'needle',
    'catheter',
    'mask',
    'face shield',
    'gown',
    'disposable'
  ],
  'Medical Devices': [
    'monitor',
    'ecg',
    'ekg',
    'holter',
    'ultrasound',
    'diagnostic device'
  ]
};

// Function to find best matching category
function findMatchingCategory(productName, productDescription = '') {
  const searchText = `${productName} ${productDescription}`.toLowerCase();
  
  let bestMatch = null;
  let maxMatchCount = 0;
  
  for (const [categoryName, keywords] of Object.entries(CATEGORY_MAPPING)) {
    let matchCount = 0;
    
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestMatch = categoryName;
    }
  }
  
  return bestMatch;
}

async function organizeProducts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all categories
    console.log('📋 Loading categories...');
    const categories = await Category.find({ isActive: true });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    console.log(`✅ Loaded ${categories.length} active categories\n`);

    // Fetch all products
    console.log('📦 Loading products...');
    const products = await Product.find({});
    console.log(`✅ Found ${products.length} products\n`);

    console.log('🔄 Organizing products by category...\n');

    let organized = 0;
    let alreadyCorrect = 0;
    let noMatch = 0;
    const noMatchProducts = [];

    for (const product of products) {
      const currentCategory = product.category ? 
        categories.find(c => c._id.toString() === product.category.toString())?.name : 
        null;
      
      const suggestedCategory = findMatchingCategory(product.name, product.description);
      
      if (!suggestedCategory) {
        noMatch++;
        noMatchProducts.push(product.name);
        console.log(`  ⚠️  No match: "${product.name}" (currently: ${currentCategory || 'None'})`);
        continue;
      }
      
      const targetCategoryId = categoryMap[suggestedCategory];
      
      if (!targetCategoryId) {
        console.log(`  ⚠️  Category not found: "${suggestedCategory}" for "${product.name}"`);
        continue;
      }
      
      // Check if already in correct category
      if (currentCategory === suggestedCategory) {
        alreadyCorrect++;
        console.log(`  ✓ Already correct: "${product.name}" → ${suggestedCategory}`);
        continue;
      }
      
      // Update product category
      product.category = targetCategoryId;
      await product.save({ validateBeforeSave: false });
      
      organized++;
      console.log(`  ✓ Moved: "${product.name}" → ${suggestedCategory} (was: ${currentCategory || 'None'})`);
    }

    console.log('\n📊 Summary:');
    console.log(`  Total products: ${products.length}`);
    console.log(`  ✅ Organized: ${organized}`);
    console.log(`  ✓ Already correct: ${alreadyCorrect}`);
    console.log(`  ⚠️  No match found: ${noMatch}`);

    if (noMatchProducts.length > 0) {
      console.log('\n⚠️  Products without category match:');
      noMatchProducts.forEach(name => {
        console.log(`  - ${name}`);
      });
      console.log('\n💡 Tip: These products need manual assignment or add their keywords to CATEGORY_MAPPING');
    }

    console.log('\n✅ Product organization complete!');
    console.log('\n💡 Next Steps:');
    console.log('  1. Refresh your admin panel (Ctrl + Shift + R)');
    console.log('  2. Review products in each category');
    console.log('  3. Manually assign products with no match');
    console.log('  4. Test category pages on frontend');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the organization
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║     Automatic Product Category Organization Script          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

organizeProducts();
