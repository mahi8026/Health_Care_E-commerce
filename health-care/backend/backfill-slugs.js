/**
 * backfill-slugs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script: generates slugs for every Product that currently has none.
 *
 * WHY THIS EXISTS
 * Products imported before the pre-save hook was added have no slug field.
 * When Google crawls /products/<ObjectId>, the frontend now redirects to
 * /products (the listing) because product.slug is null — those ID-based URLs
 * appear as "Crawled – currently not indexed" in Search Console.
 * Running this script fills in the missing slugs so every product gets a
 * clean, canonical URL and the ID-based redirect lands on the right product.
 *
 * USAGE (run once from the backend directory)
 *   node backfill-slugs.js
 *   node backfill-slugs.js --dry-run   ← preview without writing
 *
 * SAFETY
 *   • Skips products that already have a slug (idempotent)
 *   • Uses the same generateSlug logic as the pre-save hook
 *   • Resolves slug collisions with an incrementing counter
 *   • Logs every change to stdout
 */

'use strict';

const mongoose = require('mongoose');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DRY_RUN = process.argv.includes('--dry-run');

// ── Slug generator (mirrors Product model pre-save hook) ─────────────────────
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  console.log(DRY_RUN ? '🔍  DRY RUN — no changes will be written.\n' : '🚀  Starting slug backfill…\n');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('✅  Connected to MongoDB.\n');

  const Product = require('./src/models/Product');

  // Fetch only products without a slug
  const products = await Product.find(
    { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] },
    { _id: 1, name: 1 }
  ).lean();

  console.log(`Found ${products.length} products without a slug.\n`);

  if (products.length === 0) {
    console.log('✅  Nothing to do — all products already have slugs.');
    await mongoose.disconnect();
    return;
  }

  // Build a set of already-used slugs to handle uniqueness without re-hitting DB
  // for every product (reduces N×M queries to 1 + N)
  const existingSlugs = new Set(
    (await Product.find({ slug: { $exists: true, $ne: null, $ne: '' } }, { slug: 1 }).lean())
      .map(p => p.slug)
  );

  let updated  = 0;
  let skipped  = 0;
  let errored  = 0;

  for (const { _id, name } of products) {
    if (!name) {
      console.warn(`  ⚠️   Skipping ${_id} — no name.`);
      skipped++;
      continue;
    }

    let slug    = generateSlug(name);
    let counter = 1;

    // Resolve collisions
    while (existingSlugs.has(slug)) {
      slug = `${generateSlug(name)}-${counter}`;
      counter++;
    }

    existingSlugs.add(slug); // reserve this slug immediately

    if (DRY_RUN) {
      console.log(`  📝  [DRY RUN] ${_id}  →  "${slug}"`);
      updated++;
      continue;
    }

    try {
      await Product.updateOne({ _id }, { $set: { slug } });
      console.log(`  ✅  ${_id}  →  "${slug}"`);
      updated++;
    } catch (err) {
      console.error(`  ❌  ${_id}  failed: ${err.message}`);
      errored++;
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Errors  : ${errored}`);
  console.log(`────────────────────────────────────────\n`);

  if (!DRY_RUN) {
    console.log('✅  Slug backfill complete. Revalidate the Next.js ISR cache if needed:');
    console.log('    curl -X POST https://www.mediportbd.com/api/revalidate?tag=product-list\n');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
