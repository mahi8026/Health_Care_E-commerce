/**
 * Quick script to check if products have sizes and add them to specific products
 * 
 * Usage:
 *   node check-and-add-sizes.js [--product-id=ID] [--product-name=NAME]
 * 
 * Examples:
 *   node check-and-add-sizes.js --product-name="Tynor Cervical Collar"
 *   node check-and-add-sizes.js --product-id=507f1f77bcf86cd799439011
 *   node check-and-add-sizes.js (checks all products)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const DEFAULT_SIZES = [
  { name: 'S', sku: '', priceAdjustment: 0, stock: 15, isAvailable: true },
  { name: 'M', sku: '', priceAdjustment: 0, stock: 20, isAvailable: true },
  { name: 'L', sku: '', priceAdjustment: 0, stock: 15, isAvailable: true },
  { name: 'XL', sku: '', priceAdjustment: 0, stock: 10, isAvailable: true }
];

async function checkAndAddSizes() {
  console.log('🔍 Checking products for size variants...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport');
    console.log('✅ Connected to MongoDB\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const productIdArg = args.find(arg => arg.startsWith('--product-id='));
    const productNameArg = args.find(arg => arg.startsWith('--product-name='));
    
    let query = {};
    
    if (productIdArg) {
      const productId = productIdArg.split('=')[1];
      query._id = productId;
      console.log(`🎯 Targeting specific product ID: ${productId}\n`);
    } else if (productNameArg) {
      const productName = productNameArg.split('=')[1];
      query.name = new RegExp(productName, 'i');
      console.log(`🎯 Targeting products matching: ${productName}\n`);
    } else {
      console.log(`🎯 Checking ALL products\n`);
    }

    // Find products
    const products = await Product.find(query).populate('category brand').lean();
    
    if (products.length === 0) {
      console.log('❌ No products found matching the criteria');
      process.exit(0);
    }

    console.log(`📊 Found ${products.length} product(s)\n`);
    console.log('═'.repeat(80));

    let productsWithSizes = 0;
    let productsWithoutSizes = 0;

    // Check each product
    for (const product of products) {
      const hasSizes = product.variants?.sizes && product.variants.sizes.length > 0;
      const categoryName = typeof product.category === 'object' ? product.category.name : 'N/A';
      const brandName = typeof product.brand === 'object' ? product.brand.name : 'N/A';

      console.log(`\n📦 Product: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Category: ${categoryName}`);
      console.log(`   Brand: ${brandName}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   ID: ${product._id}`);
      
      if (hasSizes) {
        console.log(`   ✅ HAS SIZES: ${product.variants.sizes.map(s => `${s.name} (stock: ${s.stock})`).join(', ')}`);
        productsWithSizes++;
      } else {
        console.log(`   ❌ NO SIZES - Would you like to add sizes to this product?`);
        productsWithoutSizes++;
      }
      console.log('─'.repeat(80));
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Products with sizes: ${productsWithSizes}`);
    console.log(`   Products without sizes: ${productsWithoutSizes}`);
    console.log(`   Total: ${products.length}`);

    // If checking a specific product, offer to add sizes
    if ((productIdArg || productNameArg) && productsWithoutSizes > 0) {
      console.log(`\n💡 To add sizes to this product, use:`);
      console.log(`   Admin Panel: Edit product → Scroll to "Size Variants" → Click "✨ Add All Sizes"`);
      console.log(`   OR`);
      console.log(`   Run: node add-sizes-to-product.js --product-id=${products[0]._id}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndAddSizes();
