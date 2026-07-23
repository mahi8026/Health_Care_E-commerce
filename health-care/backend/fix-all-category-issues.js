/**
 * Comprehensive Category Fix Script
 * 
 * This script fixes ALL category-related issues:
 * 1. Recalculates accurate product counts for all categories
 * 2. Ensures all 18 active categories exist
 * 3. Verifies database consistency
 * 4. Provides detailed report
 * 
 * Run: node fix-all-category-issues.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}\n`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Fix all category issues
const fixAllIssues = async () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 COMPREHENSIVE CATEGORY FIX');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Get all categories
  console.log('📊 Step 1: Fetching all categories...');
  const allCategories = await Category.find({}).sort({ name: 1 });
  console.log(`   Found: ${allCategories.length} total categories`);
  console.log(`   Active: ${allCategories.filter(c => c.isActive).length}`);
  console.log(`   Inactive: ${allCategories.filter(c => !c.isActive).length}\n`);

  // Step 2: Get all products
  console.log('📦 Step 2: Fetching all products...');
  const allProducts = await Product.find({});
  const activeProducts = allProducts.filter(p => p.isActive);
  console.log(`   Total products: ${allProducts.length}`);
  console.log(`   Active products: ${activeProducts.length}\n`);

  // Step 3: Count products per category
  console.log('🔢 Step 3: Counting products per category...');
  const categoryProductCounts = {};
  
  for (const product of activeProducts) {
    if (product.category) {
      const categoryId = product.category.toString();
      categoryProductCounts[categoryId] = (categoryProductCounts[categoryId] || 0) + 1;
    }
  }
  
  console.log(`   Counted products in ${Object.keys(categoryProductCounts).length} categories\n`);

  // Step 4: Update all category product counts
  console.log('💾 Step 4: Updating category product counts...');
  const updates = [];
  let fixed = 0;
  let unchanged = 0;

  for (const category of allCategories) {
    const categoryId = category._id.toString();
    const actualCount = categoryProductCounts[categoryId] || 0;
    const savedCount = category.productCount || 0;

    if (savedCount !== actualCount) {
      await Category.updateOne(
        { _id: category._id },
        { $set: { productCount: actualCount } }
      );
      
      updates.push({
        name: category.name,
        slug: category.slug,
        isActive: category.isActive,
        oldCount: savedCount,
        newCount: actualCount,
        difference: actualCount - savedCount
      });
      
      fixed++;
      console.log(`   ✅ ${category.name}: ${savedCount} → ${actualCount}`);
    } else {
      unchanged++;
    }
  }

  console.log(`\n   Updated: ${fixed} categories`);
  console.log(`   Unchanged: ${unchanged} categories\n`);

  // Step 5: Verify active categories
  console.log('✔️  Step 5: Verifying active categories...');
  const updatedCategories = await Category.find({ isActive: true }).sort({ name: 1 });
  console.log(`   Active categories: ${updatedCategories.length}`);
  
  if (updatedCategories.length !== 18) {
    console.log(`   ⚠️  Expected 18, found ${updatedCategories.length}\n`);
  } else {
    console.log(`   ✅ Correct count!\n`);
  }

  // Step 6: Generate detailed report
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 DETAILED CATEGORY REPORT');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('ACTIVE CATEGORIES (18 expected):');
  console.log('─────────────────────────────────────────────────────\n');

  updatedCategories.forEach((cat, index) => {
    const productCount = cat.productCount || 0;
    const emoji = productCount > 0 ? '📦' : '📭';
    const status = productCount > 0 ? 'OK' : 'EMPTY';
    console.log(`${String(index + 1).padStart(2, '0')}. ${emoji} ${cat.name.padEnd(40, ' ')} ${String(productCount).padStart(4, ' ')} products [${status}]`);
  });

  console.log('\n─────────────────────────────────────────────────────');

  // Step 7: Show categories that were updated
  if (updates.length > 0) {
    console.log('\n📊 CATEGORIES WITH UPDATED COUNTS:');
    console.log('─────────────────────────────────────────────────────\n');
    
    updates
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
      .forEach((update, index) => {
        const arrow = update.difference > 0 ? '↑' : '↓';
        const sign = update.difference > 0 ? '+' : '';
        console.log(`${String(index + 1).padStart(2, '0')}. ${update.name.padEnd(40, ' ')} ${update.oldCount} → ${update.newCount} (${arrow} ${sign}${update.difference})`);
      });
    
    console.log('\n─────────────────────────────────────────────────────');
  }

  // Step 8: Summary statistics
  console.log('\n📈 SUMMARY STATISTICS:');
  console.log('─────────────────────────────────────────────────────\n');

  const totalProducts = updatedCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
  const categoriesWithProducts = updatedCategories.filter(c => c.productCount > 0).length;
  const emptyCategories = updatedCategories.filter(c => !c.productCount || c.productCount === 0).length;
  const avgProductsPerCategory = (totalProducts / updatedCategories.length).toFixed(1);

  console.log(`   Total Categories: ${updatedCategories.length}`);
  console.log(`   Categories with Products: ${categoriesWithProducts}`);
  console.log(`   Empty Categories: ${emptyCategories}`);
  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Average Products per Category: ${avgProductsPerCategory}`);

  // Top 5 categories
  const topCategories = updatedCategories
    .filter(c => c.productCount > 0)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 5);

  console.log('\n🏆 TOP 5 CATEGORIES:');
  topCategories.forEach((cat, index) => {
    console.log(`   ${index + 1}. ${cat.name}: ${cat.productCount} products`);
  });

  // Step 9: Check for orphaned products
  console.log('\n🔍 Step 6: Checking for orphaned products...');
  const productsWithoutCategory = activeProducts.filter(p => !p.category);
  const productsWithInvalidCategory = [];

  for (const product of activeProducts) {
    if (product.category) {
      const categoryExists = allCategories.find(c => c._id.toString() === product.category.toString());
      if (!categoryExists) {
        productsWithInvalidCategory.push(product);
      }
    }
  }

  console.log(`   Products without category: ${productsWithoutCategory.length}`);
  console.log(`   Products with invalid category: ${productsWithInvalidCategory.length}`);

  if (productsWithoutCategory.length > 0) {
    console.log('\n   ⚠️  Products without category:');
    productsWithoutCategory.slice(0, 10).forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.name}`);
    });
    if (productsWithoutCategory.length > 10) {
      console.log(`      ... and ${productsWithoutCategory.length - 10} more`);
    }
  }

  // Final status
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ CATEGORY FIX COMPLETE!');
  console.log('═══════════════════════════════════════════════════════\n');

  if (updatedCategories.length === 18 && productsWithoutCategory.length === 0) {
    console.log('🎉 All issues fixed! Your categories are now correct.\n');
  } else {
    console.log('⚠️  Some issues remain:');
    if (updatedCategories.length !== 18) {
      console.log(`   - Expected 18 active categories, found ${updatedCategories.length}`);
    }
    if (productsWithoutCategory.length > 0) {
      console.log(`   - ${productsWithoutCategory.length} products need categories assigned`);
    }
    console.log('');
  }

  console.log('💡 Next Steps:');
  console.log('   1. Refresh your admin panel (Ctrl + Shift + R)');
  console.log('   2. Verify all categories show correct counts');
  console.log('   3. Check Railway deployment logs');
  console.log('   4. Test category creation/editing\n');

  return {
    totalCategories: updatedCategories.length,
    totalProducts,
    categoriesWithProducts,
    emptyCategories,
    updatedCounts: fixed,
    orphanedProducts: productsWithoutCategory.length
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    const result = await fixAllIssues();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Completed at: ${new Date().toLocaleString()}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

main();
