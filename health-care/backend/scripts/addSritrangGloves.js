#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Add Sritrang Examination Gloves White - M
 * Source: https://www.arogga.com/product/81041/sritrang-examination-gloves-white-m
 *
 * Usage: node scripts/addSritrangGloves.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');
const slugify = require('slugify');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Real image URL from Arogga CDN (product 81041)
const AROGGA_IMAGE =
  `https://cdn2.arogga.com/${TOKEN('K1')}`;

async function main() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│     Add Sritrang Examination Gloves White - M              │
└────────────────────────────────────────────────────────────┘
`);

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Connect MongoDB
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // ── 1. Find or create brand: Sritrang ─────────────────────────────────────
  console.log('🏷️  Resolving brand: Sritrang...');
  const brandSlug = slugify('Sritrang', { lower: true, strict: true });
  let brand = await Manufacturer.findOne({
    $or: [{ name: /^sritrang$/i }, { slug: brandSlug }],
  });
  if (!brand) {
    brand = await Manufacturer.create({
      name: 'Sritrang',
      slug: brandSlug,
      description: 'Sritrang — Thai natural rubber latex glove manufacturer',
      country: 'Thailand',
      website: 'https://www.sritrang.com',
      isActive: true,
    });
    console.log('  ✅ Brand "Sritrang" created');
  } else {
    console.log('  ℹ️  Brand "Sritrang" already exists');
  }

  // ── 2. Find category: PPE & Safety ────────────────────────────────────────
  console.log('📂 Resolving category: PPE & Safety...');
  const category = await Category.findOne({
    $or: [{ name: /^ppe.*safety$/i }, { slug: 'ppe-and-safety' }],
  });
  if (!category) {
    throw new Error('Category "PPE & Safety" not found. Please create it first.');
  }
  console.log('  ✅ Category found\n');

  // ── 3. Check for duplicate ────────────────────────────────────────────────
  const existing = await Product.findOne({ sku: 'SRT-EXG-W-M' });
  if (existing) {
    console.log('⏭️  Product with SKU SRT-EXG-W-M already exists. Skipping import.');
    await mongoose.connection.close();
    return;
  }

  // ── 4. Upload image to Cloudinary ─────────────────────────────────────────
  console.log('📤 Uploading image to Cloudinary...');
  const uploaded = await cloudinary.uploader.upload(AROGGA_IMAGE, {
    folder: 'Mediport/products',
    public_id: 'sritrang-examination-gloves-white-m',
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
  console.log(`  ✅ Image uploaded: ${uploaded.secure_url}\n`);

  // ── 5. Create product ─────────────────────────────────────────────────────
  console.log('💾 Creating product in database...');

  // Build unique slug
  const baseSlug = slugify('Sritrang Examination Gloves White M', { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const product = await Product.create({
    sku: 'SRT-EXG-W-M',
    name: 'Sritrang Examination Gloves White - M',
    slug,
    description: `Sritrang Examination Gloves White in Medium (M) size are high-quality disposable natural rubber latex gloves, sourced from Sri Trang Agro-Industry — one of the world's largest latex glove manufacturers based in Thailand.

These white examination gloves provide reliable barrier protection for medical, laboratory, and hygiene-sensitive tasks, combining comfort, flexibility, and professional-grade performance.

Key Features:
• Size: Medium (M)
• Color: White
• Quantity: 100 pieces per box
• Material: Premium natural rubber latex
• Powder-free for reduced allergen risk
• Ambidextrous design fits both hands
• Beaded cuff prevents roll-down and eases donning
• Textured fingertips for improved grip and tactile sensitivity
• Soft, flexible fit for extended wear comfort
• Single-use disposable design

Applications:
• Medical examinations and patient care
• Diagnostic laboratory work
• Dental procedures
• Cleaning and sanitation
• Caregiving and nursing
• Food handling and hygiene services
• Beauty and salon services
• General protective use

Quality Standards:
• Manufactured by Sri Trang Agro-Industry (Thailand)
• Meets ASTM D3578 international examination glove standard
• CE certified for medical use
• ISO 13485 quality management

Storage: Store in a cool, dry place away from direct sunlight, heat, and ozone sources. Keep in original packaging until use.`,
    brand: brand._id,
    category: category._id,
    subcategory: 'Medical Gloves',
    price: 1000,
    oldPrice: 1000,
    discountPct: 47,
    stock: 100,
    unit: 'box',
    minOrderQty: 1,
    images: [
      {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        isPrimary: true,
        alt: 'Sritrang Examination Gloves White Medium M 100 pieces box — MediportBD',
      },
    ],
    specifications: new Map([
      ['Product Type',  'Examination Gloves'],
      ['Brand',        'Sritrang (Sri Trang Agro-Industry)'],
      ['Material',     'Natural Rubber Latex'],
      ['Color',        'White'],
      ['Size',         'Medium (M)'],
      ['Quantity',     '100 pieces per box'],
      ['Surface',      'Textured fingertips'],
      ['Cuff',         'Beaded'],
      ['Design',       'Ambidextrous'],
      ['Powder',       'Powder-free'],
      ['Sterility',    'Non-sterile'],
      ['Origin',       'Thailand'],
    ]),
    certifications: ['CE Certified', 'ASTM D3578', 'ISO 13485'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: [
      'sritrang', 'examination gloves', 'latex gloves', 'medical gloves',
      'white gloves', 'medium', 'disposable', 'powder-free', 'ppe',
      'thai gloves', 'sri trang', 'healthcare', 'laboratory gloves',
    ],
    badge: 'new',
    isActive: true,
    isFeatured: false,
  });

  console.log(`  ✅ Product created: ${product.name}`);
  console.log(`  🔗 Slug: ${product.slug}`);
  console.log(`  🆔 ID:   ${product._id}\n`);

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│  ✅  Sritrang gloves added with real image                 │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  await mongoose.connection.close();
  console.log('📡 DB connection closed');
}

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

main().catch(async (err) => {
  console.error('❌ Fatal:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
