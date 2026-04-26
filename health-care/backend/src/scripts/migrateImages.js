/**
 * Migration script: Convert old string-based images to new object format
 * Run: node backend/src/scripts/migrateImages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✓ Connected to MongoDB');
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({}).toArray();
  let updated = 0;
  let alreadyCorrect = 0;
  let noImages = 0;

  for (const product of products) {
    // Case 1: No images at all
    if (!product.images || product.images.length === 0) {
      noImages++;
      continue;
    }

    // Case 2: Already in correct format (array of objects with url property)
    if (typeof product.images[0] === 'object' && product.images[0].url) {
      alreadyCorrect++;
      continue;
    }

    // Case 3: Old format (array of strings) - needs migration
    if (typeof product.images[0] === 'string') {
      const newImages = product.images.map((url, idx) => ({
        url,
        publicId: '',
        isPrimary: idx === 0,
        alt: product.name || 'Product image',
      }));
      await db.collection('products').updateOne(
        { _id: product._id },
        { $set: { images: newImages } }
      );
      updated++;
      console.log(`✓ Migrated: ${product.name} (${product.sku})`);
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`✅ Migrated: ${updated} products`);
  console.log(`✓ Already correct: ${alreadyCorrect} products`);
  console.log(`○ No images: ${noImages} products`);
  console.log(`📊 Total: ${products.length} products`);
  
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
