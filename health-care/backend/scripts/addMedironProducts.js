#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Add all 6 Mediron brand products with real images
 * Source: https://www.arogga.com/brand/101824/mediron
 *
 * Products:
 *  1. Mediron Excellent Blood Glucose Meter
 *  2. Mediron Blood Lancets Twist Type 31G 100pcs
 *  3. Mediron Automatic Blood Pressure Monitor (Smart) MEDI 589
 *  4. Mediron Advance Automatic Blood Pressure Monitor MEDI 447
 *  5. Mediron Prime Automatic Blood Pressure Monitor MEDI 712
 *  6. Mediron Blood Glucose Test Strip 25 Test Strips (Foil Pack)
 *
 * Usage: node scripts/addMedironProducts.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');
const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Image CDN tokens extracted from Arogga pages ─────────────────────────────
const CDN = 'https://cdn2.arogga.com/';

const PRODUCTS = [
  // ── 1. Blood Glucose Meter ─────────────────────────────────────────────────
  {
    sku: 'MDRN-BGM-EXCEL',
    name: 'Mediron Excellent Blood Glucose Meter',
    price: 745,
    oldPrice: 1650,
    category: 'Diagnostic Equipment',
    subcategory: 'Glucometers & Diabetic Care',
    unit: 'piece',
    stock: 50,
    description: `Mediron Excellent Blood Glucose Meter is a digital glucometer designed for quick and convenient blood glucose monitoring at home or in professional healthcare settings.

Key Features:
• Fast 5-Second Results
• Tiny Blood Sample: requires only 0.5 μL
• No Coding Required — auto-calibration
• Large Memory Capacity: stores up to 480 test results
• Date & Time Display for history tracking
• Auto Shut-Off to conserve battery
• Easy-to-Read Digital Display
• ISO Certified & CE Marked
• DAR No.: 72-8880-2024

Package Contents:
• Mediron Blood Glucose Meter
• Carrying Case
• Lancing Device
• Test Strip Foil
• Sterile Blood Lancets
• User's Manual`,
    specs: [
      ['Brand', 'Mediron'],
      ['Product Type', 'Blood Glucose Meter / Digital Glucometer'],
      ['Blood Sample', '0.5 μL'],
      ['Test Time', 'Approx. 5 Seconds'],
      ['Coding', 'No Coding Required'],
      ['Memory', 'Up to 480 Test Results'],
      ['Display', 'Digital LCD'],
      ['Certification', 'ISO Certified & CE Marked'],
      ['DAR No', '72-8880-2024'],
    ],
    certifications: ['CE Certified', 'ISO 13485'],
    tags: ['glucometer', 'blood glucose meter', 'diabetes', 'blood sugar', 'mediron', 'home monitoring'],
    badge: 'bestseller',
    images: [
      { token: TOKEN('K1'), pid: 'mediron-bgm-excellent-1', alt: 'Mediron Excellent Blood Glucose Meter glucometer — MediportBD' },
      { token: TOKEN('K2'), pid: 'mediron-bgm-excellent-2', alt: 'Mediron Blood Glucose Meter kit contents — MediportBD' },
    ],
  },

  // ── 2. Blood Lancets ───────────────────────────────────────────────────────
  {
    sku: 'MDRN-LANC-31G-100',
    name: 'Mediron Blood Lancets Twist Type 31G 100pcs',
    price: 93.5,
    oldPrice: 110,
    category: 'Diagnostic Equipment',
    subcategory: 'Glucometers & Diabetic Care',
    unit: 'box',
    stock: 200,
    description: `Mediron Blood Lancets Twist Type 31G are sterile, single-use lancets designed for safe and virtually painless blood sampling for diabetes management and routine glucose monitoring.

Key Features:
• 31G Fine Gauge Needle — ultra-thin for minimal discomfort
• Tri-Bevel Tip — engineered for smooth, precise puncture
• Twist-Off Cap — ensures sterility and easy handling
• Universal Compatibility — fits most standard lancing devices
• Sterile Packaging — each lancet individually sealed
• 100 Pieces per Box
• DAR No.: 72-8880-2024

Usage: Insert into compatible lancing device, lance fingertip, apply blood to test strip. Single-use only — never reuse or share.`,
    specs: [
      ['Brand', 'Mediron'],
      ['Gauge', '31G (Fine)'],
      ['Tip Type', 'Tri-Bevel'],
      ['Cap', 'Twist-Off'],
      ['Quantity', '100 pieces per box'],
      ['Compatibility', 'Universal — fits most lancing devices'],
      ['Sterility', 'Sterile, Single-Use'],
      ['DAR No.', '72-8880-2024'],
    ],
    certifications: ['CE Certified', 'DGDA Registered'],
    tags: ['blood lancets', 'lancets', '31g', 'diabetes', 'glucose testing', 'mediron', 'twist type'],
    badge: 'bestseller',
    images: [
      { token: TOKEN('K3'), pid: 'mediron-lancets-31g-1', alt: 'Mediron Blood Lancets 31G 100pcs box — MediportBD' },
      { token: TOKEN('K4'), pid: 'mediron-lancets-31g-2', alt: 'Mediron Lancets twist type close-up — MediportBD' },
    ],
  },

  // ── 3. BP Monitor Smart MEDI 589 ──────────────────────────────────────────
  {
    sku: 'MDRN-BPM-589',
    name: 'Mediron Automatic Blood Pressure Monitor (Smart) Model No. MEDI 589',
    price: 2399,
    oldPrice: 3150,
    category: 'Diagnostic Equipment',
    subcategory: 'Blood Pressure Monitors',
    unit: 'piece',
    stock: 30,
    description: `Mediron Smart Blood Pressure Monitor MEDI 589 provides precise, convenient, and reliable blood pressure and pulse measurements for home health monitoring.

Key Features:
• Cuff Wrapping Guide for correct positioning
• Hypertension Indicator — alerts if BP exceeds normal range
• Body Movement Detection during measurement
• Last Memory Recall for easy comparison
• Irregular Heartbeat Detection notification
• Oscillometric Measurement Method

Specifications:
• BP Range: 0–280 mmHg | Pulse: 40–199 BPM
• Accuracy: ±3 mmHg pressure, ±5% pulse
• Cuff Size: Fits 23–33 cm arm circumference
• Weight: ~290g (without batteries)
• Power: 4 × AA batteries or Micro-USB (DC 5V/500mA)
• Battery Life: ~1000 measurements

Package: Main Unit, Arm Cuff, 4 AA Batteries, Instruction Manual, USB Cable, Zipper Bag
DAR No.: 72-8880-2024`,
    specs: [
      ['Brand', 'Mediron'],
      ['Model', 'MEDI 589'],
      ['Type', 'Automatic Upper Arm Blood Pressure Monitor'],
      ['Measurement Method', 'Oscillometric'],
      ['BP Range', '0–280 mmHg'],
      ['Pulse Range', '40–199 BPM'],
      ['Accuracy', '±3 mmHg / ±5%'],
      ['Cuff Fit', '23–33 cm arm circumference'],
      ['Power', '4 × AA batteries or USB (DC 5V)'],
      ['Battery Life', '~1000 measurements'],
      ['DAR No.', '72-8880-2024'],
    ],
    certifications: ['CE Certified', 'DGDA Registered'],
    tags: ['blood pressure monitor', 'bp machine', 'bp monitor', 'automatic', 'smart', 'medi 589', 'mediron', 'home monitoring'],
    badge: 'new',
    images: [
      { token: TOKEN('K5'), pid: 'mediron-bpm-589-1', alt: 'Mediron Smart Blood Pressure Monitor MEDI 589 — MediportBD' },
      { token: TOKEN('K6'), pid: 'mediron-bpm-589-2', alt: 'Mediron MEDI 589 BP monitor in use — MediportBD' },
      { token: TOKEN('K7'), pid: 'mediron-bpm-589-3', alt: 'Mediron MEDI 589 display reading — MediportBD' },
    ],
  },

  // ── 4. BP Monitor Advance MEDI 447 ────────────────────────────────────────
  {
    sku: 'MDRN-BPM-447',
    name: 'Mediron Advance Automatic Blood Pressure Monitor Model no: MEDI 447',
    price: 2550,
    oldPrice: 3150,
    category: 'Diagnostic Equipment',
    subcategory: 'Blood Pressure Monitors',
    unit: 'piece',
    stock: 30,
    description: `Mediron Advance Automatic Blood Pressure Monitor MEDI 447 provides accurate and efficient blood pressure readings at home with one-touch operation.

Key Features:
• Fully Automatic Measurement — one-touch operation
• Digital LCD Display — shows systolic, diastolic, and pulse rate
• Standard Cuff Size — fits most adult arms
• Quick Response Time — accurate results in 5 seconds
• Compact and Lightweight — ideal for home and travel
• Battery Operated — portable use
• 3-Year Warranty
• Manufactured in China

Benefits:
• Enables regular monitoring to support heart health
• Detects early signs of hypertension or irregular pulse
• Easy to operate for elderly users
• Provides consistent, repeatable results
• DAR No.: 72-8880-2024`,
    specs: [
      ['Brand', 'Mediron'],
      ['Model', 'MEDI 447'],
      ['Type', 'Automatic Upper Arm Blood Pressure Monitor'],
      ['Measurement', 'Oscillometric'],
      ['Display', 'Digital LCD'],
      ['Response Time', '5 seconds'],
      ['Warranty', '3 Years'],
      ['Origin', 'China'],
      ['DAR No.', '72-8880-2024'],
    ],
    certifications: ['CE Certified', 'DGDA Registered'],
    tags: ['blood pressure monitor', 'bp machine', 'bp monitor', 'automatic', 'advance', 'medi 447', 'mediron'],
    badge: 'new',
    images: [
      { token: TOKEN('K8'), pid: 'mediron-bpm-447-1', alt: 'Mediron Advance Blood Pressure Monitor MEDI 447 — MediportBD' },
      { token: TOKEN('K9'), pid: 'mediron-bpm-447-2', alt: 'Mediron MEDI 447 BP monitor full set — MediportBD' },
    ],
  },

  // ── 5. BP Monitor Prime MEDI 712 ──────────────────────────────────────────
  {
    sku: 'MDRN-BPM-712',
    name: 'Mediron Prime Automatic Blood Pressure Monitor Model No. MEDI 712',
    price: 3400,
    oldPrice: 3400,
    category: 'Diagnostic Equipment',
    subcategory: 'Blood Pressure Monitors',
    unit: 'piece',
    stock: 25,
    description: `Mediron Prime Automatic Blood Pressure Monitor MEDI 712 is the newest model in the Mediron range, designed for convenient and reliable home health monitoring with one-touch operation.

Key Features:
• One-touch automatic operation
• Intelligent measurement system for accurate readings
• Irregular Heartbeat Detection
• Memory storage: up to 120 readings for multiple users
• Large LCD display for clear results
• Comfortable adjustable arm cuff
• Dual power options: batteries and USB
• Fast measurement within seconds

Ideal for:
• Individuals managing hypertension
• Daily wellness monitoring
• Adults of all ages including elderly

Caution: Follow instruction manual for best results. Ensure correct cuff fit and stay still during measurement.`,
    specs: [
      ['Brand', 'Mediron'],
      ['Model', 'MEDI 712'],
      ['Type', 'Automatic Upper Arm Blood Pressure Monitor'],
      ['Memory', 'Up to 120 readings (multi-user)'],
      ['Display', 'Large LCD'],
      ['Power', 'Battery + USB dual power'],
      ['Feature', 'Irregular Heartbeat Detection'],
    ],
    certifications: ['CE Certified', 'DGDA Registered'],
    tags: ['blood pressure monitor', 'bp machine', 'bp monitor', 'automatic', 'prime', 'medi 712', 'mediron', 'latest model'],
    badge: 'new',
    images: [
      { token: TOKEN('K10'), pid: 'mediron-bpm-712-1', alt: 'Mediron Prime Blood Pressure Monitor MEDI 712 — MediportBD' },
    ],
  },

  // ── 6. Blood Glucose Test Strips ──────────────────────────────────────────
  {
    sku: 'MDRN-BGS-25',
    name: 'Mediron Blood Glucose Test Strip 25 Test Strips (Foil Pack)',
    price: 550,
    oldPrice: 665,
    category: 'Diagnostic Equipment',
    subcategory: 'Glucometers & Diabetic Care',
    unit: 'pack',
    stock: 150,
    description: `Mediron Blood Glucose Test Strips deliver fast, accurate, and reliable blood sugar readings for individuals managing diabetes. Compatible exclusively with Mediron glucose meters.

Key Features:
• 25 individually sealed test strips per pack (foil pack)
• Compatible with Mediron Glucometers only
• No coding required — auto-calibration
• Each strip individually sealed for hygiene and safety
• For use with capillary whole blood
• Shelf life: use within 90 days after opening
• DAR No.: 72-8880-2024

Usage: Insert strip → obtain blood sample → apply to strip → read result in seconds.

Storage: Cool, dry place, vial tightly closed. Avoid sunlight, moisture, and freezing.`,
    specs: [
      ['Brand', 'Mediron'],
      ['Quantity', '25 test strips per pack'],
      ['Compatible With', 'Mediron Glucometers only'],
      ['Coding', 'No coding required'],
      ['Sample Type', 'Capillary Whole Blood'],
      ['Packaging', 'Individual foil seals'],
      ['Shelf Life After Opening', '90 days'],
      ['DAR No.', '72-8880-2024'],
    ],
    certifications: ['CE Certified', 'DGDA Registered'],
    tags: ['glucose strips', 'test strips', 'blood sugar strips', 'diabetes', 'mediron', 'glucometer strips', 'foil pack'],
    badge: 'new',
    images: [
      { token: TOKEN('K11'), pid: 'mediron-strips-25-1', alt: 'Mediron Blood Glucose Test Strip 25pcs foil pack — MediportBD' },
    ],
  },
];

// ── Upload image from CDN token ───────────────────────────────────────────────
async function uploadImage(token, publicId, alt) {
  const url = `${CDN}${token}`;
  const result = await cloudinary.uploader.upload(url, {
    folder: 'Mediport/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
    timeout: 60000,
  });
  return { url: result.secure_url, publicId: result.public_id, alt };
}

// ── Find or create category ───────────────────────────────────────────────────
async function getOrCreateCategory(name) {
  const slug = slugify(name, { lower: true, strict: true });
  let cat = await Category.findOne({ $or: [{ name: new RegExp(`^${name}$`, 'i') }, { slug }] });
  if (!cat) {
    cat = await Category.create({ name, slug, description: `${name} — medical diagnostic equipment`, isActive: true });
    console.log(`    📂 Created category: ${name}`);
  }
  return cat._id;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│        Add All Mediron Products (6 items) + Images         │
└────────────────────────────────────────────────────────────┘
`);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // ── Create / find brand ────────────────────────────────────────────────────
  console.log('🏷️  Resolving brand: Mediron...');
  const brandSlug = slugify('Mediron', { lower: true, strict: true });
  let brand = await Manufacturer.findOne({ $or: [{ name: /^mediron$/i }, { slug: brandSlug }] });
  if (!brand) {
    brand = await Manufacturer.create({
      name: 'Mediron',
      slug: brandSlug,
      description: 'Mediron — home diagnostic medical devices: blood pressure monitors, glucometers and consumables',
      country: 'China',
      isActive: true,
      seo: {
        metaTitle: 'Mediron Medical Devices Bangladesh',
        metaDescription: 'Mediron blood pressure monitors and glucose meters in Bangladesh',
        keywords: ['mediron', 'bp machine', 'glucometer', 'blood pressure monitor'],
      },
    });
    console.log('  ✅ Brand "Mediron" created');
  } else {
    console.log('  ℹ️  Brand "Mediron" already exists');
  }
  console.log('');

  const results = { success: 0, skipped: 0, failed: 0, errors: [] };

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    console.log(`[${i + 1}/${PRODUCTS.length}] ${p.name}`);

    try {
      // Skip duplicates
      if (await Product.findOne({ sku: p.sku })) {
        console.log('       ⏭️  Already exists — skipped\n');
        results.skipped++;
        continue;
      }

      // Resolve category
      const categoryId = await getOrCreateCategory(p.category);

      // Upload images
      const uploadedImages = [];
      for (const img of p.images) {
        try {
          const uploaded = await uploadImage(img.token, img.pid, img.alt);
          uploadedImages.push({ ...uploaded, isPrimary: uploadedImages.length === 0 });
          process.stdout.write(`       📤 ${img.pid} ✅\n`);
        } catch (e) {
          console.log(`       ⚠️  Image failed: ${e.message}`);
        }
      }

      // Build unique slug
      let baseSlug = slugify(p.name, { lower: true, strict: true });
      let slug = baseSlug, counter = 1;
      while (await Product.findOne({ slug })) { slug = `${baseSlug}-${++counter}`; }

      // Build specs as a proper Mongoose Map
      const specificationsMap = new Map();
      for (const [k, v] of (p.specs || [])) {
        // Clean key: replace special chars that may cause issues
        const cleanKey = k.replace(/[.]/g, '_');
        specificationsMap.set(cleanKey, String(v));
      }

      // Create product
      await Product.create({
        sku: p.sku,
        name: p.name,
        slug,
        description: p.description,
        brand: brand._id,
        category: categoryId,
        subcategory: p.subcategory || '',
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        unit: p.unit,
        minOrderQty: 1,
        images: uploadedImages,
        specifications: specificationsMap,
        certifications: p.certifications || ['CE Certified'],
        storageTemp: 'room',
        hazardClass: 'safe',
        tags: p.tags || [],
        badge: p.badge || 'new',
        isActive: true,
        isFeatured: false,
      });

      console.log(`       ✅ Created\n`);
      results.success++;

    } catch (err) {
      console.log(`       ❌ Failed: ${err.message}\n`);
      results.failed++;
      results.errors.push({ sku: p.sku, error: err.message });
    }

    await new Promise(r => setTimeout(r, 600));
  }

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│                       RESULTS                              │');
  console.log('└────────────────────────────────────────────────────────────┘');
  console.log(`  ✅ Imported:  ${results.success}`);
  console.log(`  ⏭️  Skipped:   ${results.skipped}`);
  console.log(`  ❌ Failed:    ${results.failed}`);
  if (results.errors.length) {
    console.log('\n  Errors:');
    results.errors.forEach(e => console.log(`    • ${e.sku}: ${e.error}`));
  }
  console.log('');

  await mongoose.connection.close();
  console.log('📡 DB connection closed');
}

process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });
main().catch(async err => {
  console.error('❌ Fatal:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
