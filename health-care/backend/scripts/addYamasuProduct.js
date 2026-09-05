/**
 * One-time script: Add Yamasu Aneroid Sphygmomanometer to the database.
 * Run from health-care/backend/:  node scripts/addYamasuProduct.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../src/models/Product');
const Category = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Resolve category ──────────────────────────────────────────────────────
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

  // ── Resolve or create Manufacturer (brand) ────────────────────────────────
  let manufacturer = await Manufacturer.findOne({ name: { $regex: /^Yamasu$/i } }).lean();
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name:    'Yamasu',
      slug:    'yamasu',
      country: 'Japan',
    });
    console.log(`Manufacturer created: Yamasu (${manufacturer._id})`);
  } else {
    console.log(`Manufacturer found: ${manufacturer.name} (${manufacturer._id})`);
  }

  // ── Check duplicate ───────────────────────────────────────────────────────
  const existing = await Product.findOne({ sku: 'YAM-500CE-BP' }).lean();
  if (existing) {
    console.log('Product with SKU YAM-500CE-BP already exists. Aborting.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Create product ────────────────────────────────────────────────────────
  const product = await Product.create({
    name:        'Yamasu Aneroid Sphygmomanometer Manual Blood Pressure Machine 500CE (Made in Japan)',
    brand:       manufacturer._id,
    category:    category._id,
    sku:         'YAM-500CE-BP',
    price:       2200,
    oldPrice:    2500,
    stock:       50,
    description: `100% Original Yamasu Aneroid Sphygmomanometer, made in Japan. Pocket aneroid design with 300 mmHg no-stop manometer, lightweight diecast case and brass-zip pouch. Standard adult cuff (23–36 cm circumference) with durable tubing, bulb and cuff. Supplied in a durable vinyl carry bag — very portable with one-handed thumb-and-fingertip control.`,
    specifications: {
      Brand:              'Yamasu',
      Model:              '500CE',
      'Country of Origin': 'Japan',
      'Display Type':     'Analogue (Aneroid)',
      'Inflation Type':   'Manual',
      'Pressure Range':   '0–300 mmHg',
      'Cuff Size':        'Standard Adult 23–36 cm',
      'Manometer Type':   '300 mmHg No-Stop',
      Case:               'Lightweight diecast with brass-zip pouch',
      Portability:        'Vinyl carry bag included',
    },
    tags: [
      'blood pressure', 'sphygmomanometer', 'aneroid', 'manual bp machine',
      'yamasu', 'made in japan', 'bp machine', 'diagnostic equipment',
    ],
    badge:          'new',
    isActive:       true,
    isFeatured:     false,
    certifications: ['CE'],
    storageTemp:    'room',
  });

  console.log(`\n✅ Product created successfully!`);
  console.log(`   Name : ${product.name}`);
  console.log(`   SKU  : ${product.sku}`);
  console.log(`   Slug : ${product.slug}`);
  console.log(`   ID   : ${product._id}`);
  console.log(`\nProduct URL: /products/${product.slug}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
