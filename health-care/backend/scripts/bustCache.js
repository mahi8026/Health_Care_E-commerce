/**
 * Touch product updatedAt to bust Redis cache TTL, and verify images are correct.
 * Run: node scripts/bustCache.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../src/models/Product');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected\n');

  const skus = ['YAM-500CE-BP', 'OMR-ACW5-ADP'];
  for (const sku of skus) {
    const product = await Product.findOne({ sku });
    if (!product) { console.log(`NOT FOUND: ${sku}`); continue; }
    product.updatedAt = new Date();
    // Mark modified so mongoose saves it
    product.markModified('updatedAt');
    await product.save({ timestamps: false });

    console.log(`Touched: ${sku}`);
    console.log(`Images (${product.images.length}):`);
    product.images.forEach(img => console.log(`  - ${img.url}`));
    console.log();
  }

  await mongoose.disconnect();
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
