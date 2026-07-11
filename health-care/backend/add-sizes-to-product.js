/**
 * Add size variants to a specific product
 * 
 * Usage:
 *   node add-sizes-to-product.js --product-id=ID [--sizes=S,M,L,XL]
 * 
 * Examples:
 *   node add-sizes-to-product.js --product-id=507f1f77bcf86cd799439011
 *   node add-sizes-to-product.js --product-id=507f1f77bcf86cd799439011 --sizes=S,M,L
 *   node add-sizes-to-product.js --product-name="Tynor Cervical Collar"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

async function addSizesToProduct() {
  console.log('🚀 Adding size variants to product...\n');

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const productIdArg = args.find(arg => arg.startsWith('--product-id='));
    const productNameArg = args.find(arg => arg.startsWith('--product-name='));
    const sizesArg = args.find(arg => arg.startsWith('--sizes='));

    if (!productIdArg && !productNameArg) {
      console.error('❌ Error: Please provide --product-id=ID or --product-name=NAME');
      console.log('\nUsage:');
      console.log('  node add-sizes-to-product.js --product-id=507f1f77bcf86cd799439011');
      console.log('  node add-sizes-to-product.js --product-name="Tynor Cervical Collar"');
      console.log('  node add-sizes-to-product.js --product-id=ID --sizes=S,M,L,XL');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore');
    console.log('✅ Connected to MongoDB\n');

    // Find the product
    let query = {};
    if (productIdArg) {
      query._id = productIdArg.split('=')[1];
    } else {
      const productName = productNameArg.split('=')[1];
      query.name = new RegExp(productName, 'i');
    }

    const product = await Product.findOne(query).populate('category brand');

    if (!product) {
      console.error('❌ Product not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📦 Found product:');
    console.log(`   Name: ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Category: ${product.category?.name || 'N/A'}`);
    console.log(`   Brand: ${product.brand?.name || 'N/A'}`);
    console.log(`   Current Stock: ${product.stock}`);
    console.log(`   ID: ${product._id}\n`);

    // Check if already has sizes
    if (product.variants?.sizes && product.variants.sizes.length > 0) {
      console.log('⚠️  Product already has sizes:');
      product.variants.sizes.forEach(s => {
        console.log(`   - ${s.name}: Stock ${s.stock}, Price Adj ${s.priceAdjustment}, Available: ${s.isAvailable}`);
      });
      console.log('\n❓ Do you want to add more sizes? (Ctrl+C to cancel)\n');
    }

    // Determine which sizes to add
    let sizesToAdd = ALL_SIZES;
    if (sizesArg) {
      sizesToAdd = sizesArg.split('=')[1].split(',').map(s => s.trim().toUpperCase());
    }

    // Calculate stock per size (distribute total stock)
    const totalStock = product.stock || 50;
    const stockPerSize = Math.floor(totalStock / sizesToAdd.length);

    // Create size variants
    const existingSizeNames = (product.variants?.sizes || []).map(s => s.name);
    const newSizes = sizesToAdd
      .filter(sizeName => !existingSizeNames.includes(sizeName))
      .map(sizeName => ({
        name: sizeName,
        sku: `${product.sku}-${sizeName}`,
        stock: stockPerSize,
        priceAdjustment: 0,
        isAvailable: true
      }));

    if (newSizes.length === 0) {
      console.log('✅ All requested sizes already exist on this product');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`📝 Adding ${newSizes.length} size variant(s):\n`);
    newSizes.forEach(s => {
      console.log(`   ✅ ${s.name}: Stock ${s.stock}, SKU ${s.sku}`);
    });

    // Update product
    if (!product.variants) {
      product.variants = {};
    }
    if (!product.variants.sizes) {
      product.variants.sizes = [];
    }

    product.variants.sizes.push(...newSizes);
    await product.save();

    console.log('\n✅ Size variants added successfully!');
    console.log(`\n📊 Product now has ${product.variants.sizes.length} size(s):`);
    product.variants.sizes.forEach(s => {
      console.log(`   - ${s.name}: Stock ${s.stock}, Price Adj ৳${s.priceAdjustment}, Available: ${s.isAvailable ? '✓' : '✗'}`);
    });

    console.log(`\n🌐 View product: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${product.slug || product._id}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

addSizesToProduct();
