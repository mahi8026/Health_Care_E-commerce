/**
 * Migration script to add size variants to existing products
 * 
 * Usage:
 *   node migrate-add-size-variants.js [--dry-run] [--category=CategoryName]
 * 
 * Examples:
 *   node migrate-add-size-variants.js --dry-run
 *   node migrate-add-size-variants.js --category="PPE & Safety"
 *   node migrate-add-size-variants.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const CATEGORIES_WITH_SIZES = [
  'PPE & Safety',
  'Surgical Instruments',
  'Medical Clothing',
  'Lab Coats',
  'Scrubs',
  'Patient Gowns'
];

const DEFAULT_SIZES = [
  { name: 'S', sku: '', priceAdjustment: 0, stock: 10, isAvailable: true },
  { name: 'M', sku: '', priceAdjustment: 0, stock: 15, isAvailable: true },
  { name: 'L', sku: '', priceAdjustment: 0, stock: 15, isAvailable: true },
  { name: 'XL', sku: '', priceAdjustment: 0, stock: 10, isAvailable: true },
  { name: 'XXL', sku: '', priceAdjustment: 0, stock: 5, isAvailable: true }
];

async function migrate() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  const specificCategory = categoryArg ? categoryArg.split('=')[1] : null;

  console.log('🚀 Starting size variant migration...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  if (specificCategory) {
    console.log(`Target category: ${specificCategory}`);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get target categories
    let targetCategories = CATEGORIES_WITH_SIZES;
    if (specificCategory) {
      targetCategories = [specificCategory];
    }

    // Find category IDs
    const categories = await Category.find({ name: { $in: targetCategories } });
    const categoryIds = categories.map(cat => cat._id);
    
    console.log(`\n📦 Found ${categories.length} categories:`);
    categories.forEach(cat => console.log(`   - ${cat.name} (${cat._id})`));

    // Find products in these categories that don't have sizes yet
    const query = {
      category: { $in: categoryIds },
      $or: [
        { 'variants.sizes': { $exists: false } },
        { 'variants.sizes': { $size: 0 } },
        { 'variants.sizes': null }
      ]
    };

    const products = await Product.find(query);
    console.log(`\n🔍 Found ${products.length} products without size variants`);

    if (products.length === 0) {
      console.log('✨ No products need migration. All done!');
      await mongoose.disconnect();
      return;
    }

    // Preview products
    console.log('\n📋 Products to be updated:');
    products.slice(0, 10).forEach((product, idx) => {
      console.log(`   ${idx + 1}. ${product.name} (SKU: ${product.sku})`);
    });
    if (products.length > 10) {
      console.log(`   ... and ${products.length - 10} more`);
    }

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes made');
      console.log(`\nTo apply changes, run without --dry-run flag`);
      await mongoose.disconnect();
      return;
    }

    // Confirm before proceeding (if not dry run)
    console.log('\n⚠️  This will modify', products.length, 'products');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update products
    let updated = 0;
    let failed = 0;

    for (const product of products) {
      try {
        // Generate size-specific SKUs
        const sizes = DEFAULT_SIZES.map(size => ({
          ...size,
          sku: `${product.sku}-${size.name}`,
          stock: Math.floor(product.stock / DEFAULT_SIZES.length) // Distribute stock evenly
        }));

        // Initialize variants object if it doesn't exist
        if (!product.variants) {
          product.variants = {};
        }

        product.variants.sizes = sizes;
        await product.save();
        
        updated++;
        if (updated % 10 === 0) {
          console.log(`   ✅ Updated ${updated}/${products.length} products...`);
        }
      } catch (error) {
        failed++;
        console.error(`   ❌ Failed to update ${product.name}:`, error.message);
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`   ✅ Successfully updated: ${updated} products`);
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed} products`);
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
