/**
 * One-time script: Add Omron AC Adapter for Digital BP Monitor to the database.
 * Run from health-care/backend/:  node scripts/addOmronAdapterProduct.js
 */
require('dotenv').config();
const mongoose     = require('mongoose');
const Product      = require('../src/models/Product');
const Category     = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Resolve category (Diagnostic Equipment — same as other BP products) ───
  const category = await Category.findOne({
    $or: [
      { name: { $regex: /^Diagnostic Equipment$/i } },
      { slug: 'diagnostic-equipment' },
    ],
  }).lean();

  if (!category) {
    console.error('Category "Diagnostic Equipment" not found. Aborting.');
    process.exit(1);
  }
  console.log(`Category: ${category.name} (${category._id})`);

  // ── Resolve Omron manufacturer ────────────────────────────────────────────
  let manufacturer = await Manufacturer.findOne({ name: { $regex: /^Omron$/i } }).lean();
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name:    'Omron',
      slug:    'omron',
      country: 'Japan',
    });
    console.log(`Manufacturer created: Omron (${manufacturer._id})`);
  } else {
    console.log(`Manufacturer found: ${manufacturer.name} (${manufacturer._id})`);
  }

  // ── Check duplicate ───────────────────────────────────────────────────────
  const existing = await Product.findOne({ sku: 'OMR-ACW5-ADP' }).lean();
  if (existing) {
    console.log('Product with SKU OMR-ACW5-ADP already exists. Aborting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Create product ────────────────────────────────────────────────────────
  const product = await Product.create({
    name:        'Adapter for Omron Digital Blood Pressure Monitor (AC Adapter HEM-ACW5)',
    brand:       manufacturer._id,
    category:    category._id,
    sku:         'OMR-ACW5-ADP',
    price:       250,
    oldPrice:    300,
    stock:       0,           // source shows "Out of stock"
    description: `Original AC power adapter for Omron digital blood pressure monitors. Compatible with Omron HEM series BP machines. Replaces batteries for continuous home or clinic use.\n\nModel: 60220HW5SW (HEM-ACW5)\nINPUT: AC 100–240V, 50/60 Hz, 0.12A\nOUTPUT: DC 6V, 500mA`,
    specifications: {
      Brand:           'Omron',
      Model:           '60220HW5SW (HEM-ACW5)',
      'Input Voltage':  'AC 100–240V, 50/60 Hz, 0.12A',
      'Output Voltage': 'DC 6V, 500mA',
      Compatibility:   'Omron HEM series digital BP monitors',
      'Country of Origin': 'China',
    },
    tags: [
      'omron adapter', 'bp machine adapter', 'blood pressure monitor adapter',
      'omron accessories', 'HEM-ACW5', 'ac adapter', 'power adapter',
      'digital bp machine', 'diagnostic equipment',
    ],
    badge:          'new',
    isActive:       true,
    isFeatured:     false,
    certifications: [],
    storageTemp:    'room',
  });

  console.log(`\n✅ Product created successfully!`);
  console.log(`   Name : ${product.name}`);
  console.log(`   SKU  : ${product.sku}`);
  console.log(`   Slug : ${product.slug}`);
  console.log(`   ID   : ${product._id}`);
  console.log(`   Stock: ${product.stock} (Out of stock)`);
  console.log(`\nProduct URL: /products/${product.slug}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
