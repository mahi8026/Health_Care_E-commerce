/**
 * Show product SKUs to compare with image names
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcore';

async function showSKUs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    const products = await Product.find({}).limit(50).lean();
    
    console.log('🏷️  Sample Product SKUs (first 50):\n');
    console.log('='.repeat(80));
    
    products.forEach((product, idx) => {
      console.log(`${idx + 1}. SKU: ${product.sku}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Has images: ${product.images && product.images.length > 0 ? '✅ YES' : '❌ NO'}`);
      console.log();
    });
    
    console.log('='.repeat(80));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

showSKUs();
