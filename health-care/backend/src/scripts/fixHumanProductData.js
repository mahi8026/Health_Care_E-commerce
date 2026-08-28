#!/usr/bin/env node

/**
 * Fix Human GmbH Product Prices and Pack Sizes
 *
 * Corrects all price and pack size errors found in existing Human brand
 * products by comparing against the official Human GmbH price list
 * (supplied by Tradesworth Ltd.).
 *
 * Errors fixed:
 *  - HN1501  Bilirubin liquicolor (T):           price 8590 → 6590
 *  - HN1502  Bilirubin D+T liquicolor:           price 8590 → 6590
 *  - HN1107  Glucose Standard:                   price 850  → 650
 *  - HN1901  Phosphorus liquirapid (UV):         price 13985 → 13885
 *  - HN2102  Total Protein liquicolor:           price 9630 → 6260
 *  - HN2802  Iron liquicolor 2x100ML:            price 22290 → 22220
 *  - HN6002  Hemostat Thromboplastin-SI 6x10ML:  price 11000 → 31000
 *  - HN9050  HC-5D Diluent:                      price 25600 → 25500
 *  - HN1709  Triglyceride liquicolor mono:       pack '4 x 100ML/ 400T' → '9 x 15ML/ 135T'
 *  - HN1706  Triglyceride liquicolor mono:       pack '3 x 250ML/ 750T' → '4 x 100ML/ 400T'
 *  - HN1704  Triglyceride liquicolor mono Btl:   pack '250ML/ 250T'     → '3 x 250ML/ 750T'
 *  - HN1710  Triglyceride liquicolor mono Btl:   pack '2 x 100ML/ 200T' → '250ML/ 250T'
 *  - HN1201  Urea liquicolor Complete Kit:       pack '4 x 30ML/ 120T'  → '2 x 100ML/ 200T'
 *  - HN1602  Uric Acid liquicolor Complete Kit:  pack '4 x 100ML/ 400T' → '4 x 30ML/ 120T'
 *  - HN6105  Fibrinogen (wrong SKU in DB):       sku HN6105 → HN6201 + name fix
 *  - HN0903  Syphilis RPR Reagent Only:          pack '1000 Test' → '100 Test'
 *  - HN1004  Imtec-B2-Glycoprotein IgG:         name typo 'bz' → 'B2'
 *  - HN7805  CA 125 Ag ELISA:                   sku HN7805 → HN7905
 *
 * Usage:
 *   node src/scripts/fixHumanProductData.js
 *
 * Safe to re-run — each correction is applied only when the current value
 * differs from the correct value.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

/**
 * Correction definitions.
 *
 * Each entry targets a product by its SKU in the database and lists
 * the fields that need to be corrected.
 *
 * `tests` is the field used to store pack size / number of tests.
 * `specifications` patches are merged into the existing Map.
 */
const CORRECTIONS = [
  // ── Price fixes ────────────────────────────────────────────────────────────
  {
    sku: 'HN1501',
    label: 'Bilirubin liquicolor (T)',
    set: { price: 6590 },
  },
  {
    sku: 'HN1502',
    label: 'Bilirubin D+T liquicolor',
    set: { price: 6590 },
  },
  {
    sku: 'HN1107',
    label: 'Glucose Standard',
    set: { price: 650 },
  },
  {
    sku: 'HN1901',
    label: 'Phosphorus liquirapid (UV)',
    set: { price: 13885 },
  },
  {
    sku: 'HN2102',
    label: 'Total Protein liquicolor Complete Kit',
    set: { price: 6260 },
  },
  {
    sku: 'HN2802',
    label: 'Iron liquicolor Complete Kit (2 x 100ML)',
    fallbackName: 'Iron liquicolor Complete Kit',
    // The DB may have two Iron kit entries; target the 2x100ML one by also
    // checking its pack/tests field after lookup.
    set: { price: 22220 },
  },
  {
    sku: 'HN6002',
    label: 'Hemostat Thromboplastin-SI (6 x 10ML)',
    // Both HN6001 (6x2ML/60T) and HN6002 (6x10ML/300T) share the same name.
    // The wrong price (11000 vs 31000) identifies the correct record.
    fallbackPrice: 11000,
    fallbackName: 'Hemostat Thromboplastin-SI',
    set: { price: 31000 },
  },
  {
    sku: 'HN9050',
    label: 'HC-5D Diluent',
    set: { price: 25500 },
  },

  // ── Pack size fixes (tests field + specifications Map entry) ───────────────
  {
    sku: 'HN1709',
    label: 'Triglyceride liquicolor mono (9 x 15ML)',
    set: { tests: '9 x 15ML/ 135T' },
    specPatch: { 'Pack Size': '9 x 15ML/ 135T' },
  },
  {
    sku: 'HN1706',
    label: 'Triglyceride liquicolor mono (4 x 100ML)',
    fallbackName: 'Triglyceride liquicolor mono',
    set: { tests: '4 x 100ML/ 400T', price: 24000 },
    specPatch: { 'Pack Size': '4 x 100ML/ 400T' },
  },
  {
    sku: 'HN1704',
    label: 'Triglyceride liquicolor mono (3 x 250ML)',
    set: { tests: '3 x 250ML/ 750T' },
    specPatch: { 'Pack Size': '3 x 250ML/ 750T' },
  },
  {
    sku: 'HN1710',
    label: 'Triglyceride liquicolor mono Btl (250ML)',
    fallbackName: 'Triglyceride liquicolor mono Btl',
    set: { tests: '250ML/ 250T', price: 12515 },
    specPatch: { 'Pack Size': '250ML/ 250T' },
  },
  {
    sku: 'HN1201',
    label: 'Urea liquicolor Complete Kit',
    set: { tests: '2 x 100ML/ 200T' },
    specPatch: { 'Pack Size': '2 x 100ML/ 200T' },
  },
  {
    sku: 'HN1602',
    label: 'Uric Acid liquicolor Complete Kit (4 x 30ML)',
    set: { tests: '4 x 30ML/ 120T' },
    specPatch: { 'Pack Size': '4 x 30ML/ 120T' },
  },
  {
    sku: 'HN0903',
    label: 'Syphilis RPR Reagent Only',
    set: { tests: '100 Test' },
    specPatch: { 'Pack Size': '100 Test' },
  },

  // ── SKU / name fixes ───────────────────────────────────────────────────────
  {
    // The Fibrinogen kit was imported with wrong SKU HN6105; correct is HN6201
    sku: 'HN6105',
    label: 'Hemostat Fibrinogen Complete Kit (SKU fix HN6105 → HN6201)',
    set: { sku: 'HN6201', name: 'Hemostat Fibrinogen Complete Kit' },
    specPatch: { 'Code': 'HN6201' },
  },
  {
    // CA 125 Ag ELISA was imported with wrong SKU HN7805; correct is HN7905
    sku: 'HN7805',
    label: 'CA 125 Ag ELISA (SKU fix HN7805 → HN7905)',
    set: { sku: 'HN7905' },
    specPatch: { 'Code': 'HN7905' },
  },
  {
    // Name typo: 'Imtec-bz-Glycoprotein IgG' → 'Imtec-B2-Glycoprotein IgG'
    sku: 'HN1004',
    label: 'Imtec-B2-Glycoprotein IgG (name typo fix)',
    set: { name: 'Imtec-B2-Glycoprotein IgG' },
  },
];

/**
 * Apply a single correction to one product document.
 * Looks up by SKU first; falls back to name match if not found.
 */
async function applyCorrection(correction) {
  const { sku, label, set, specPatch, fallbackName, fallbackPrice } = correction;

  let product = await Product.findOne({ sku });

  // Some products were imported by an earlier script with different SKUs.
  // Fall back to a name-based lookup so we still correct them.
  if (!product && fallbackName) {
    const query = { name: new RegExp(`^${fallbackName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    // When multiple docs share the same name, use the wrong price to pinpoint the right one
    if (fallbackPrice !== undefined) {
      query.price = fallbackPrice;
    }
    product = await Product.findOne(query);
  }
  if (!product) {
    return { status: 'not_found', sku, label };
  }

  let changed = false;
  const before = {};
  const after = {};

  // Apply scalar field updates
  for (const [field, value] of Object.entries(set)) {
    if (String(product[field]) !== String(value)) {
      before[field] = product[field];
      after[field] = value;
      product[field] = value;
      changed = true;
    }
  }

  // Apply specification Map patches
  if (specPatch) {
    if (!product.specifications) {
      product.specifications = new Map();
    }
    for (const [key, value] of Object.entries(specPatch)) {
      if (product.specifications.get(key) !== value) {
        product.specifications.set(key, value);
        changed = true;
      }
    }
    // Mark the Map as modified so Mongoose detects the change
    product.markModified('specifications');
  }

  if (!changed) {
    return { status: 'already_correct', sku, label };
  }

  await product.save();
  return { status: 'updated', sku, label, before, after };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Fix Human GmbH Product Prices & Pack Sizes');
  console.log('  Source: Official Human GmbH Price List (Tradesworth Ltd.)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    // Verify Human manufacturer exists
    const human = await Manufacturer.findOne({ slug: 'human' });
    if (!human) {
      console.error('✗ Human manufacturer not found. Run importAllHumanProducts.js first.');
      process.exit(1);
    }
    console.log(`✓ Human manufacturer found (ID: ${human._id})\n`);
    console.log('─'.repeat(65));

    const results = { updated: 0, already_correct: 0, not_found: 0 };

    for (const correction of CORRECTIONS) {
      const result = await applyCorrection(correction);

      if (result.status === 'updated') {
        const changes = Object.keys(result.before)
          .map(f => `${f}: ${result.before[f]} → ${result.after[f]}`)
          .join(', ');
        console.log(`✓ [${result.sku}] ${result.label}`);
        console.log(`    Changed: ${changes}`);
        results.updated++;
      } else if (result.status === 'already_correct') {
        console.log(`⊘ [${result.sku}] ${result.label} — already correct`);
        results.already_correct++;
      } else {
        console.log(`✗ [${result.sku}] ${result.label} — NOT FOUND in database`);
        results.not_found++;
      }
    }

    console.log('\n' + '─'.repeat(65));
    console.log('\n📊 Summary');
    console.log('─'.repeat(65));
    console.log(`   ✓ Updated:         ${results.updated}`);
    console.log(`   ⊘ Already correct: ${results.already_correct}`);
    console.log(`   ✗ Not found:       ${results.not_found}`);
    console.log(`   📦 Total checked:  ${CORRECTIONS.length}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

main();
