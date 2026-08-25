#!/usr/bin/env node
/**
 * Adds two portable autoclave products sourced from bmabazar.com:
 *  1. Autoclave Portable Steam Sterilizer 10"x12" Electric 70L  — ৳21,500
 *  2. Autoclave Portable Steam Sterilizer 12"x15" Electric 100L — ৳30,000
 *
 * Run: node add-autoclave-products.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product      = require('./src/models/Product');
const Category     = require('./src/models/Category');
const Manufacturer = require('./src/models/Manufacturer');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── Resolve category ───────────────────────────────────────────────────────
  // These are hospital sterilisation machines → "Hospital Machines"
  let category = await Category.findOne({ name: /Hospital Machines/i });
  if (!category) {
    // Fallback: try Surgical Instruments or create a new one
    category = await Category.findOne({ name: /Surgical/i });
  }
  if (!category) {
    console.error('❌ Could not find a suitable category. Check your Category collection.');
    process.exit(1);
  }
  console.log(`📂 Category: ${category.name} (${category._id})`);

  // ── Resolve brand ──────────────────────────────────────────────────────────
  // Made in Bangladesh — find or create a "Local / Bangladesh" manufacturer
  let brand = await Manufacturer.findOne({ name: /bangladesh|local/i });
  if (!brand) {
    brand = await Manufacturer.findOne(); // any brand as fallback
  }
  if (!brand) {
    console.error('❌ No manufacturer found. Add a brand first.');
    process.exit(1);
  }
  console.log(`🏭 Brand: ${brand.name} (${brand._id})\n`);

  // ── Product definitions ────────────────────────────────────────────────────
  const products = [
    {
      sku:         'AUTO-10X12-70L',
      name:        'Autoclave Portable Steam Sterilizer 10"x12" Electric 70L',
      description: `Portable electric steam autoclave for rapid and effective sterilization using saturated steam.

Suitable for sterilizing medical instruments, surgical dressings, glass utensils, solutions, and substrates in hospitals, diagnostic centres, public health centers, clinics, factories, mines, and scientific research institutes.

Key features:
• Scale: 10″×12″
• Capacity: 70 Litres
• Utilizable double drum
• Electric heating element
• Accurate pressure/temperature composition
• Environment-friendly
• Made in Bangladesh

Note: Price is without drum. Contact for drum pricing.`,
      category:    category._id,
      brand:       brand._id,
      price:       21500,
      oldPrice:    null,
      stock:       10,
      unit:        'piece',
      minOrderQty: 1,
      specifications: new Map([
        ['Scale',         '10″×12″'],
        ['Capacity',      '70 Litres'],
        ['Power Source',  'Electric'],
        ['Drum',          'Double Drum (Utilizable)'],
        ['Origin',        'Made in Bangladesh'],
      ]),
      tags: [
        'autoclave', 'steam sterilizer', 'portable autoclave', '70L autoclave',
        'hospital sterilizer', 'medical sterilizer', 'electric autoclave',
        'Bangladesh autoclave', 'surgical instrument sterilizer'
      ],
      certifications: [],
      storageTemp:  'room',
      hazardClass:  'safe',
      isActive:     true,
      isFeatured:   false,
      badge:        null,
      images: [
        {
          url:       'https://bmabazar.com/wp-content/uploads/2021/02/Local-Autoclave-70L.jpg',
          publicId:  '',
          isPrimary: true,
          alt:       'Autoclave Portable Steam Sterilizer 10x12 Electric 70L — MediportBD Bangladesh',
        }
      ],
    },
    {
      sku:         'AUTO-12X15-100L',
      name:        'Autoclave Portable Steam Sterilizer 12"x15" Electric 100L',
      description: `Portable electric steam autoclave for rapid and effective sterilization using saturated steam.

Suitable for sterilizing medical instruments, surgical dressings, glass utensils, solutions, and substrates in hospitals, diagnostic centres, public health centers, clinics, factories, mines, and scientific research institutes.

Key features:
• Scale: 12″×15″
• Capacity: 100 Litres
• Utilizable double drum
• Electric heating element
• Accurate pressure/temperature composition
• Environment-friendly
• Made in Bangladesh

Note: Price is without drum. Contact for drum pricing.`,
      category:    category._id,
      brand:       brand._id,
      price:       30000,
      oldPrice:    null,
      stock:       10,
      unit:        'piece',
      minOrderQty: 1,
      specifications: new Map([
        ['Scale',         '12″×15″'],
        ['Capacity',      '100 Litres'],
        ['Power Source',  'Electric'],
        ['Drum',          'Double Drum (Utilizable)'],
        ['Origin',        'Made in Bangladesh'],
      ]),
      tags: [
        'autoclave', 'steam sterilizer', 'portable autoclave', '100L autoclave',
        'hospital sterilizer', 'medical sterilizer', 'electric autoclave',
        'Bangladesh autoclave', 'surgical instrument sterilizer', 'large autoclave'
      ],
      certifications: [],
      storageTemp:  'room',
      hazardClass:  'safe',
      isActive:     true,
      isFeatured:   false,
      badge:        null,
      images: [
        {
          url:       'https://bmabazar.com/wp-content/uploads/2021/02/Local-Autoclave-100L.jpg',
          publicId:  '',
          isPrimary: true,
          alt:       'Autoclave Portable Steam Sterilizer 12x15 Electric 100L — MediportBD Bangladesh',
        }
      ],
    },
  ];

  // ── Insert products ────────────────────────────────────────────────────────
  let added = 0;
  for (const data of products) {
    const exists = await Product.findOne({ sku: data.sku });
    if (exists) {
      console.log(`⏭️  Already exists: ${data.name} (SKU: ${data.sku})`);
      continue;
    }

    const product = new Product(data);
    await product.save(); // triggers pre-save hook → auto-generates slug
    console.log(`✅ Added: ${product.name}`);
    console.log(`   SKU:   ${product.sku}`);
    console.log(`   Slug:  ${product.slug}`);
    console.log(`   Price: ৳${product.price.toLocaleString()}`);
    console.log(`   URL:   /products/${product.slug}\n`);
    added++;
  }

  // ── Update category product count ──────────────────────────────────────────
  const count = await Product.countDocuments({ category: category._id, isActive: true });
  await Category.findByIdAndUpdate(category._id, { productCount: count });
  console.log(`📊 ${category.name} product count updated → ${count}`);

  console.log(`\n✅ Done — ${added} product(s) added`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
