/**
 * One-time migration: fix product slugs that contain forward slashes.
 *
 * A slug with '/' breaks URL routing in Next.js because '/' is treated
 * as a path separator. This script finds all affected products, clears
 * their slug, and re-saves them so the pre-save hook generates a clean
 * slug using the fixed generateSlug function (which now sanitises the
 * SKU suffix).
 *
 * Run once on Render via the shell or as a one-off job:
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

  // Find all products whose slug contains a forward slash
  const affected = await Product.find({ slug: /\// }).populate('brand', 'name');
  console.log(`Found ${affected.length} product(s) with slash in slug`);

  if (affected.length === 0) {
    console.log('Nothing to fix.');
    await mongoose.connection.close();
    return;
  }

  let fixed = 0;
  let errors = 0;

  for (const product of affected) {
    const oldSlug = product.slug;
    try {
      // Clear slug so the pre-save hook regenerates it
      product.slug = undefined;
      product.markModified('name'); // ensure hook runs
      await product.save();
      console.log(`  ✓ ${product.name}`);
      console.log(`    old: ${oldSlug}`);
      console.log(`    new: ${product.slug}`);
      fixed++;
    } catch (err) {
      console.error(`  ✗ ${product.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Fixed: ${fixed}  ✗ Errors: ${errors}`);
  await mongoose.connection.close();
}

fix().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
