/**
 * Product Visibility Fix Script
 * 
 * This script helps diagnose and fix products that aren't showing in production.
 * 
 * Usage:
 *   node scripts/fix-product-visibility.js --mode=diagnose
 *   node scripts/fix-product-visibility.js --mode=activate-all
 *   node scripts/fix-product-visibility.js --mode=activate-category --category="Laboratory Reagents"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const mode = args.mode || 'diagnose';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function diagnose() {
  console.log('\n📊 PRODUCT VISIBILITY DIAGNOSTICS\n');
  console.log('=' .repeat(60));
  
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      missingCategory,
      missingBrand,
      outOfStock,
      lowStock,
      inStock,
      featured,
      missingImages
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ $or: [{ category: null }, { category: undefined }] }),
      Product.countDocuments({ $or: [{ brand: null }, { brand: undefined }] }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ 
        $expr: { 
          $and: [
            { $gt: ['$stock', 0] }, 
            { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 10] }] }
          ] 
        } 
      }),
      Product.countDocuments({ stock: { $gt: 10 } }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ $or: [{ images: { $size: 0 } }, { images: null }] })
    ]);

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Products:       ${totalProducts}`);
    console.log(`   ✅ Active:            ${activeProducts} (${((activeProducts/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   ❌ Inactive:          ${inactiveProducts} (${((inactiveProducts/totalProducts)*100).toFixed(1)}%)`);
    console.log(`   ⭐ Featured:          ${featured}`);
    console.log(`   🏷️  Missing Category:  ${missingCategory}`);
    console.log(`   🏭 Missing Brand:     ${missingBrand}`);
    console.log(`   📦 In Stock:          ${inStock}`);
    console.log(`   ⚠️  Low Stock:         ${lowStock}`);
    console.log(`   🚫 Out of Stock:      ${outOfStock}`);
    console.log(`   🖼️  Missing Images:    ${missingImages}`);

    if (inactiveProducts > 0) {
      console.log(`\n⚠️  ISSUE DETECTED: ${inactiveProducts} products are marked as INACTIVE`);
      console.log('   These products will NOT show in the admin panel or public site.\n');
      
      // Get sample inactive products
      const samples = await Product.find({ isActive: false })
        .select('sku name isActive category brand stock')
        .populate('category', 'name')
        .populate('brand', 'name')
        .limit(10)
        .lean();
      
      console.log('   Sample inactive products:');
      samples.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.sku} - ${p.name}`);
        console.log(`      Category: ${p.category?.name || 'N/A'} | Brand: ${p.brand?.name || 'N/A'} | Stock: ${p.stock}`);
      });
      
      console.log(`\n💡 FIX: Run with --mode=activate-all to activate all products`);
    }

    if (missingCategory > 0 || missingBrand > 0) {
      console.log(`\n⚠️  ISSUE DETECTED: ${missingCategory + missingBrand} products have missing references`);
      
      const samples = await Product.find({
        $or: [
          { category: { $in: [null, undefined] } },
          { brand: { $in: [null, undefined] } }
        ]
      })
        .select('sku name category brand')
        .limit(10)
        .lean();
      
      console.log('   Sample products with missing references:');
      samples.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.sku} - ${p.name}`);
        console.log(`      Category: ${p.category || '❌ MISSING'} | Brand: ${p.brand || '❌ MISSING'}`);
      });
      
      console.log(`\n💡 FIX: Assign valid categories and brands to these products`);
    }

    // Get category breakdown
    const categoryBreakdown = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDoc'
        }
      },
      {
        $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$categoryDoc.name',
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    console.log(`\n📊 BREAKDOWN BY CATEGORY:`);
    categoryBreakdown.forEach(cat => {
      const name = cat._id || 'No Category';
      console.log(`   ${name}: ${cat.total} total (${cat.active} active, ${cat.inactive} inactive)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Diagnostics complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnostics:', error.message);
    throw error;
  }
}

async function activateAll() {
  console.log('\n🔧 ACTIVATING ALL PRODUCTS\n');
  console.log('=' .repeat(60));
  
  try {
    const inactiveCount = await Product.countDocuments({ isActive: false });
    
    if (inactiveCount === 0) {
      console.log('✅ All products are already active!');
      return;
    }

    console.log(`\n⚠️  About to activate ${inactiveCount} inactive products...`);
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const result = await Product.updateMany(
      { isActive: false },
      { $set: { isActive: true } }
    );
    
    console.log(`\n✅ Successfully activated ${result.modifiedCount} products!`);
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error activating products:', error.message);
    throw error;
  }
}

async function activateByCategory(categoryName) {
  console.log(`\n🔧 ACTIVATING PRODUCTS IN CATEGORY: ${categoryName}\n`);
  console.log('=' .repeat(60));
  
  try {
    // Find the category
    const category = await Category.findOne({ 
      name: { $regex: new RegExp('^' + categoryName + '$', 'i') } 
    });
    
    if (!category) {
      console.log(`❌ Category "${categoryName}" not found!`);
      console.log('\nAvailable categories:');
      const categories = await Category.find().select('name').lean();
      categories.forEach(cat => console.log(`   - ${cat.name}`));
      return;
    }
    
    const inactiveCount = await Product.countDocuments({ 
      category: category._id, 
      isActive: false 
    });
    
    if (inactiveCount === 0) {
      console.log(`✅ All products in "${categoryName}" are already active!`);
      return;
    }

    console.log(`\n⚠️  About to activate ${inactiveCount} inactive products in "${categoryName}"...`);
    console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await Product.updateMany(
      { category: category._id, isActive: false },
      { $set: { isActive: true } }
    );
    
    console.log(`\n✅ Successfully activated ${result.modifiedCount} products in "${categoryName}"!`);
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error activating products:', error.message);
    throw error;
  }
}

async function main() {
  await connectDB();
  
  try {
    switch (mode) {
      case 'diagnose':
        await diagnose();
        break;
      
      case 'activate-all':
        await activateAll();
        // Run diagnostics after to show results
        await diagnose();
        break;
      
      case 'activate-category':
        if (!args.category) {
          console.log('❌ Error: --category parameter is required');
          console.log('   Example: node scripts/fix-product-visibility.js --mode=activate-category --category="Laboratory Reagents"');
          process.exit(1);
        }
        await activateByCategory(args.category);
        await diagnose();
        break;
      
      default:
        console.log('❌ Invalid mode. Use: diagnose, activate-all, or activate-category');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB\n');
    process.exit(0);
  }
}

main();
