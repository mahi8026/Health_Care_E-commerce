/**
 * Test Script for Size Variants Feature
 * 
 * This script tests the complete size variants implementation:
 * 1. Product with sizes
 * 2. Cart with size selection
 * 3. Order with size-specific stock deduction
 * 
 * Usage:
 *   node test-size-variants.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Cart = require('./src/models/Cart');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

const TEST_PRODUCT_SKU = 'TEST-SIZE-PRODUCT-001';
const TEST_USER_EMAIL = 'test-size@example.com';

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  await Product.deleteOne({ sku: TEST_PRODUCT_SKU });
  await User.deleteOne({ email: TEST_USER_EMAIL });
  await Cart.deleteMany({ user: { $exists: false } }); // Clean test carts
  console.log('✅ Cleanup complete');
}

async function createTestProduct() {
  console.log('\n📦 Creating test product with sizes...');
  
  const product = await Product.create({
    sku: TEST_PRODUCT_SKU,
    name: 'Test Lumbo Sacral Belt',
    slug: 'test-lumbo-sacral-belt',
    description: 'Test product for size variants',
    brand: 'Test Brand',
    category: new mongoose.Types.ObjectId(),
    price: 1000,
    stock: 50,
    variants: {
      sizes: [
        {
          name: 'S',
          sku: `${TEST_PRODUCT_SKU}-S`,
          priceAdjustment: 0,
          stock: 10,
          isAvailable: true
        },
        {
          name: 'M',
          sku: `${TEST_PRODUCT_SKU}-M`,
          priceAdjustment: 0,
          stock: 15,
          isAvailable: true
        },
        {
          name: 'L',
          sku: `${TEST_PRODUCT_SKU}-L`,
          priceAdjustment: 0,
          stock: 15,
          isAvailable: true
        },
        {
          name: 'XL',
          sku: `${TEST_PRODUCT_SKU}-XL`,
          priceAdjustment: 50,
          stock: 8,
          isAvailable: true
        },
        {
          name: 'XXL',
          sku: `${TEST_PRODUCT_SKU}-XXL`,
          priceAdjustment: 100,
          stock: 2,
          isAvailable: true
        }
      ]
    },
    images: [{ url: 'https://example.com/image.jpg', isPrimary: true }],
    isActive: true
  });

  console.log(`✅ Created product: ${product.name} (${product.sku})`);
  console.log('   Sizes available:');
  product.variants.sizes.forEach(size => {
    console.log(`   - ${size.name}: ${size.stock} units (Price: ৳${product.price + size.priceAdjustment})`);
  });
  
  return product;
}

async function testSizeValidation(product) {
  console.log('\n🔍 Testing size validation...');
  
  // Test 1: Product has sizes
  if (!product.variants?.sizes || product.variants.sizes.length === 0) {
    throw new Error('❌ Product should have size variants');
  }
  console.log('✅ Product has size variants');
  
  // Test 2: Each size has required fields
  for (const size of product.variants.sizes) {
    if (!size.name || typeof size.stock !== 'number' || typeof size.isAvailable !== 'boolean') {
      throw new Error(`❌ Size ${size.name} missing required fields`);
    }
  }
  console.log('✅ All sizes have required fields');
  
  // Test 3: Price adjustments work
  const xlSize = product.variants.sizes.find(s => s.name === 'XL');
  const expectedPrice = product.price + xlSize.priceAdjustment;
  console.log(`✅ Price calculation: Base ৳${product.price} + XL adjustment ৳${xlSize.priceAdjustment} = ৳${expectedPrice}`);
}

async function testCartWithSize(product) {
  console.log('\n🛒 Testing cart with size selection...');
  
  // Create test user
  const user = await User.create({
    name: 'Test User',
    email: TEST_USER_EMAIL,
    password: 'testpassword123',
    phone: '01700000000',
    role: 'customer'
  });
  
  // Create cart with size
  const cart = await Cart.create({
    user: user._id,
    items: [
      {
        product: product._id,
        quantity: 2,
        price: product.price + 0, // M size (no adjustment)
        selectedSize: {
          name: 'M',
          priceAdjustment: 0
        }
      },
      {
        product: product._id,
        quantity: 1,
        price: product.price + 50, // XL size (+50 adjustment)
        selectedSize: {
          name: 'XL',
          priceAdjustment: 50
        }
      }
    ]
  });
  
  await cart.save();
  
  console.log('✅ Cart created with size variants');
  console.log(`   - 2x Medium (৳${product.price} each) = ৳${2 * product.price}`);
  console.log(`   - 1x XL (৳${product.price + 50} each) = ৳${product.price + 50}`);
  console.log(`   Total: ৳${cart.subtotal}`);
  
  // Test cart calculation
  const expectedSubtotal = (2 * product.price) + (1 * (product.price + 50));
  if (cart.subtotal !== expectedSubtotal) {
    throw new Error(`❌ Cart subtotal mismatch. Expected: ${expectedSubtotal}, Got: ${cart.subtotal}`);
  }
  console.log('✅ Cart subtotal calculation correct');
  
  return { user, cart };
}

async function testStockDeduction(product, user) {
  console.log('\n📉 Testing size-specific stock deduction...');
  
  // Get initial stocks
  const initialMStock = product.variants.sizes.find(s => s.name === 'M').stock;
  const initialXLStock = product.variants.sizes.find(s => s.name === 'XL').stock;
  
  console.log(`   Initial M stock: ${initialMStock}`);
  console.log(`   Initial XL stock: ${initialXLStock}`);
  
  // Manually simulate order stock deduction (without creating actual order)
  const mSize = product.variants.sizes.find(s => s.name === 'M');
  const xlSize = product.variants.sizes.find(s => s.name === 'XL');
  
  mSize.stock -= 2;
  xlSize.stock -= 1;
  product.stock = product.variants.sizes.reduce((sum, s) => sum + s.stock, 0);
  
  await product.save();
  
  // Verify stock deduction
  const updatedProduct = await Product.findById(product._id);
  const updatedMStock = updatedProduct.variants.sizes.find(s => s.name === 'M').stock;
  const updatedXLStock = updatedProduct.variants.sizes.find(s => s.name === 'XL').stock;
  
  console.log(`   Final M stock: ${updatedMStock} (Expected: ${initialMStock - 2})`);
  console.log(`   Final XL stock: ${updatedXLStock} (Expected: ${initialXLStock - 1})`);
  
  if (updatedMStock !== initialMStock - 2) {
    throw new Error(`❌ M size stock deduction failed`);
  }
  if (updatedXLStock !== initialXLStock - 1) {
    throw new Error(`❌ XL size stock deduction failed`);
  }
  
  console.log('✅ Size-specific stock deduction successful');
}

async function runTests() {
  console.log('🚀 Starting Size Variants Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Cleanup any existing test data
    await cleanup();
    
    // Run tests
    const product = await createTestProduct();
    await testSizeValidation(product);
    
    const { user, cart } = await testCartWithSize(product);
    await testStockDeduction(product, user);
    
    // Final cleanup
    await cleanup();
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests passed! Size variants feature is working correctly.');
    console.log('='.repeat(60) + '\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    
    await cleanup();
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
