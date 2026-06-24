/**
 * One-time migration: regenerate ALL product slugs using the new
 * name-only slug format.
 *
 * Previous slugs included brand name and SKU suffix (e.g.
 * "nichipore-surgical-tape-25mm-x-6m-nichiban-25-001"), making URLs
 * ugly and hard to read. The new format uses the product name only
 * (e.g. "nichipore-surgical-tape-25mm-x-6m").
 *
 * This script clears every slug and re-saves each product so the
 * pre-save hook generates a clean slug.
 *
 * Run once on Render via the Shell tab:
 *   node src/scripts/fixSlashSlugs.js
 */
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function fix() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const products = await Product.find({});
  console.log(`Found ${products.length} total product(s) — regenerating all slugs\n`);

  let fixed = 0;
  let errors = 0;

  for (const product of products) {
    const oldSlug = product.slug;
    try {
      product.slug = undefined;          // clear so pre-save hook regenerates it
      product.markModified('name');      // ensure the if(!this.slug) branch runs
      await product.save();
      if (oldSlug !== product.slug) {
        console.log(`  ✓ ${product.name}`);
        console.log(`    old: ${oldSlug || '(none)'}`);
        console.log(`    new: ${product.slug}`);
      }
      fixed++;
    } catch (err) {
      console.error(`  ✗ ${product.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Processed: ${fixed}  ✗ Errors: ${errors}`);
  await mongoose.connection.close();
}

fix().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
