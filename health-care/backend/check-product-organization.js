#!/usr/bin/env node
/**
 * Check Product Organization Status
 * Shows which products are organized and which need manual assignment
 * 
 * Usage: node check-product-organization.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

async function checkOrganization() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all categories
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat.name;
    });

    // Fetch all products
    const products = await Product.find({}).sort({ name: 1 });

    console.log('📊 PRODUCT ORGANIZATION STATUS\n');
    console.log('═'.repeat(70));

    // Group products by category
    const productsByCategory = {};
    const unassignedProducts = [];

    products.forEach(product => {
      if (!product.category) {
        unassignedProducts.push(product);
      } else {
        const categoryName = categoryMap[product.category.toString()] || 'Unknown Category';
        if (!productsByCategory[categoryName]) {
          productsByCategory[categoryName] = [];
        }
        productsByCategory[categoryName].push(product);
      }
    });

    // Display organized products by category
    console.log('\n✅ ORGANIZED PRODUCTS BY CATEGORY\n');
    
    let totalOrganized = 0;
    Object.keys(productsByCategory).sort().forEach(categoryName => {
      const categoryProducts = productsByCategory[categoryName];
      totalOrganized += categoryProducts.length;
      
      console.log(`\n📦 ${categoryName} (${categoryProducts.length} products)`);
      console.log('─'.repeat(70));
      
      categoryProducts.forEach((product, index) => {
        const price = product.price ? `৳${product.price.toLocaleString()}` : 'No price';
        const stock = product.stock || 0;
        const status = product.isActive ? '✓' : '✗';
        console.log(`  ${index + 1}. ${status} ${product.name} - ${price} (Stock: ${stock})`);
      });
    });

    // Display unassigned products
    if (unassignedProducts.length > 0) {
      console.log('\n\n⚠️  PRODUCTS NEEDING MANUAL ASSIGNMENT\n');
      console.log('═'.repeat(70));
      
      unassignedProducts.forEach((product, index) => {
        const price = product.price ? `৳${product.price.toLocaleString()}` : 'No price';
        const brand = product.brand || 'No brand';
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Brand: ${brand}`);
        console.log(`   Price: ${price}`);
        console.log(`   Stock: ${product.stock || 0}`);
        console.log(`   Description: ${(product.description || '').substring(0, 100)}...`);
        console.log(`   Suggested Category: ${suggestCategory(product)}`);
      });
    }

    // Summary
    console.log('\n\n📊 SUMMARY\n');
    console.log('═'.repeat(70));
    console.log(`Total Products: ${products.length}`);
    console.log(`✅ Organized: ${totalOrganized} (${((totalOrganized/products.length)*100).toFixed(1)}%)`);
    console.log(`⚠️  Need Assignment: ${unassignedProducts.length} (${((unassignedProducts.length/products.length)*100).toFixed(1)}%)`);
    console.log(`📦 Active Categories: ${Object.keys(productsByCategory).length}`);

    // Category distribution
    console.log('\n\n📈 CATEGORY DISTRIBUTION\n');
    console.log('═'.repeat(70));
    
    const sortedCategories = Object.entries(productsByCategory)
      .sort((a, b) => b[1].length - a[1].length);
    
    sortedCategories.forEach(([categoryName, products]) => {
      const percentage = ((products.length / totalOrganized) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(products.length / 5));
      console.log(`${categoryName.padEnd(35)} ${products.length.toString().padStart(3)} (${percentage}%) ${bar}`);
    });

    // Recommendations
    console.log('\n\n💡 RECOMMENDATIONS\n');
    console.log('═'.repeat(70));
    
    if (unassignedProducts.length > 0) {
      console.log('\n1. ASSIGN UNASSIGNED PRODUCTS:');
      console.log('   Go to admin panel and manually assign the products listed above.');
      console.log('   Refresh browser first: Ctrl + Shift + R');
    }
    
    if (sortedCategories.length > 0) {
      const topCategories = sortedCategories.slice(0, 3);
      console.log('\n2. TOP CATEGORIES TO OPTIMIZE:');
      topCategories.forEach(([name, products]) => {
        console.log(`   - ${name}: ${products.length} products (consider adding subcategories)`);
      });
    }
    
    const emptyCategories = categories.filter(cat => 
      !productsByCategory[cat.name] || productsByCategory[cat.name].length === 0
    );
    
    if (emptyCategories.length > 0) {
      console.log('\n3. EMPTY CATEGORIES:');
      emptyCategories.forEach(cat => {
        console.log(`   - ${cat.name} (no products assigned)`);
      });
      console.log('   Consider deactivating or adding products to these categories.');
    }

    console.log('\n\n✅ Analysis complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Suggest category based on product name/description
function suggestCategory(product) {
  const text = `${product.name} ${product.description || ''} ${product.brand || ''}`.toLowerCase();
  
  const suggestions = [
    { category: 'Surgical & Wound Care', keywords: ['duoderm', 'dressing', 'wound', 'stomahesive', 'pouch', 'wafer', 'ostomy', 'colostomy'] },
    { category: 'Consumables', keywords: ['ryles tube', 'urine bag', 'adult diaper', 'airway', 'romsons', 'catheter'] },
    { category: 'Laboratory Reagents', keywords: ['t3', 't4', 'ft3', 'ft4', 'vitamin b12', 'reagent', 'test kit', 'finecare'] },
    { category: 'Diagnostic Equipment', keywords: ['scale', 'weighing', 'weight', 'blood pressure', 'thermometer'] },
    { category: 'Hospital Machines', keywords: ['suction', 'v5', 'v7', 'pump', 'aspirator'] },
    { category: 'Diabetes Care', keywords: ['glucose', 'diabetic', 'insulin', 'sugar'] },
    { category: 'Medical Supplies', keywords: ['medical', 'hospital', 'healthcare'] }
  ];
  
  for (const { category, keywords } of suggestions) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Medical Supplies (default)';
}

// Run the check
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          Product Organization Status Report                 ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

checkOrganization();
