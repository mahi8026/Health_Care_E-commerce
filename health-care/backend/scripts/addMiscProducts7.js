#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Add 7 miscellaneous products with real images
 *
 * 1. Rechargeable LED Headlight Dual Light Zoom Headlamp (OT / Surgical)
 * 2. Biohermes Limpid Blood Glucose Test Strips GM-S01 50pcs
 * 3. Alcohol Pad 100pcs
 * 4. JMI Disposable Syringe 1ml
 * 5. JMI Disposable Syringe 10ml
 * 6. JMI Disposable Syringe 3ml
 * 7. Savlon Antiseptic Liquid 5000ml
 *
 * Usage: node scripts/addMiscProducts7.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');
const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CDN = 'https://cdn2.arogga.com/';

// ── Product definitions ───────────────────────────────────────────────────────
const PRODUCTS = [
  // 1. LED Headlamp (No Brand)
  {
    sku: 'LED-HLAMP-OT-DUAL',
    name: 'Rechargeable LED Headlight Dual Light Zoom Headlamp for OT, Cycling & Fishing',
    brandName: 'Generic',
    categoryName: 'Hospital Machines',
    subcategory: 'Surgical Lighting',
    price: 935, oldPrice: 1100,
    unit: 'piece', stock: 30,
    description: `Rechargeable LED Headlight with Dual Light Zoom — ideal for Operation Theatre (OT), cycling, fishing, camping and outdoor activities.

Key Features:
• Dual light source with zoom capability
• Maximum beam intensity 10,000 cd — throw distance up to 400 meters (ANSI FL1)
• Telescopic zoom with three-mode conversion (white light modes)
• Powered by 2 powerful rechargeable 18650 batteries
• Aerospace-grade aluminium alloy — military grade, hard anodized
• Adjustable headband — fits all head sizes
• 90-degree adjustable lighting angle
• Red indicator warning light for night visibility
• Waterproof: IPX-6 rated
• Suitable for: OT, hunting, cycling, climbing, hiking, fishing, camping

Applications in Healthcare:
• Operating Theatre (OT) headlight for surgeons and assistants
• Emergency field lighting
• Procedure lighting in low-resource settings`,
    specs: new Map([
      ['Type', 'Rechargeable Zoom Headlamp'],
      ['Light Source', 'Dual LED'],
      ['Beam Intensity', '10000 cd (ANSI FL1)'],
      ['Throw Distance', 'Up to 400 meters'],
      ['Battery', '2 x 18650 rechargeable'],
      ['Waterproof', 'IPX-6'],
      ['Material', 'Aerospace-grade aluminium alloy'],
    ]),
    tags: ['headlamp', 'led headlight', 'ot light', 'surgical light', 'rechargeable', 'zoom headlamp', 'operating theatre'],
    badge: 'new',
    images: [
      { token: TOKEN('K1'), pid: 'led-headlamp-ot-1', alt: 'Rechargeable LED Headlamp Dual Light Zoom for OT and outdoor — MediportBD' },
    ],
  },

  // 2. Biohermes Limpid Glucose Strips
  {
    sku: 'BH-LMPD-BGS-50',
    name: 'Biohermes Limpid Blood Glucose Test Strips GM S01 – 50 Pieces',
    brandName: 'Biohermes',
    categoryName: 'Diagnostic Equipment',
    subcategory: 'Glucometers & Diabetic Care',
    price: 910, oldPrice: 950,
    unit: 'pack', stock: 100,
    description: `Biohermes Limpid Blood Glucose Test Strips GM S01 are designed for convenient and reliable blood glucose monitoring with the Limpid GM S01 Glucometer. 50 test strips per pack.

Key Features:
• Accurate and reliable glucose readings
• Fast results — small blood sample required
• Easy strip insertion
• Compatible exclusively with Limpid GM S01 Glucometer
• 50-piece pack for regular monitoring

Usage:
1. Wash and dry hands
2. Insert Limpid GM S01 strip into compatible meter
3. Obtain small blood sample with lancing device
4. Apply blood to strip
5. Read result on meter
6. Dispose safely

Suitable For: Daily blood glucose monitoring, diabetes management at home.`,
    specs: new Map([
      ['Brand', 'Biohermes'],
      ['Model', 'GM S01'],
      ['Quantity', '50 test strips per pack'],
      ['Compatible Meter', 'Limpid GM S01 Glucometer'],
      ['Use', 'Blood Glucose Monitoring'],
    ]),
    tags: ['glucose strips', 'limpid', 'biohermes', 'blood sugar', 'diabetes', 'gm s01', 'test strips'],
    badge: 'new',
    images: [
      { token: TOKEN('K2'), pid: 'biohermes-limpid-strips-50-1', alt: 'Biohermes Limpid Blood Glucose Test Strips GM S01 50 pieces — MediportBD' },
    ],
  },

  // 3. Alcohol Pad 100pcs
  {
    sku: 'ALC-PAD-100',
    name: 'Alcohol Pad 100pcs',
    brandName: 'Generic',
    categoryName: 'PPE & Safety',
    subcategory: 'First Aid',
    price: 74, oldPrice: 80,
    unit: 'box', stock: 500,
    description: `Alcohol Pad 100 Pcs — individually foil-protected sterile pads for skin disinfection, injection site preparation, and general antiseptic use.

Key Features:
• 70% Isopropyl Alcohol — effective anti-bacterial action
• 100 individually foil-protected pads per box
• Thicker and softer construction for reliable site preparation
• Air-tight 4-layer wrapper — prevents leakage and drying
• Suitable for injection preparation, wound cleaning, surface disinfection

Applications:
• Disinfecting skin before injections or blood draws
• Cleaning minor cuts and wounds
• Sanitizing small surfaces and equipment
• General hygiene and household antiseptic use

Manufactured to US FDA Quality System standards (Holdrege, Nebraska, USA).`,
    specs: new Map([
      ['Content', '70% Isopropyl Alcohol'],
      ['Quantity', '100 pads per box'],
      ['Packaging', 'Individual foil protection'],
      ['Type', 'Sterile Alcohol Prep Pads'],
      ['Use', 'Disinfection and antiseptic'],
    ]),
    tags: ['alcohol pad', 'isopropyl alcohol', 'prep pads', 'disinfection', 'antiseptic', 'injection prep', 'first aid'],
    badge: 'bestseller',
    images: [
      { token: TOKEN('K3'), pid: 'alcohol-pad-100-1', alt: 'Alcohol Prep Pads 100pcs box 70% isopropyl — MediportBD' },
      { token: TOKEN('K4'), pid: 'alcohol-pad-100-2', alt: 'Alcohol Pad individual foil pack close-up — MediportBD' },
    ],
  },

  // 4. JMI Syringe 1ml
  {
    sku: 'JMI-SYR-1ML',
    name: 'JMI Disposable Syringe 1ml',
    brandName: 'JMI',
    categoryName: 'Hospital Machines',
    subcategory: 'Surgical Accessories',
    price: 5.5, oldPrice: 5.5,
    unit: 'piece', stock: 1000,
    description: `JMI Disposable Syringe 1ml — sterile, single-use hypodermic syringe for precise small-volume medication administration in medical settings.

Key Features:
• 1ml capacity — precise small-volume measurements
• Single-use design for infection control
• Pharmaceutical-grade polypropylene barrel and plunger
• Medical-grade non-toxic elastomer gasket
• EO gas sterilized — pyrogen-free
• Sharp hypodermic needle for smooth injection
• Individually packaged (blister / poly pouch / ribbon pack)

Suitable For:
• Medication administration requiring precise small volumes
• Clinical procedures in hospitals and clinics
• Laboratory applications
• Healthcare settings requiring sterile, single-use syringes

Safety: For single use only. Dispose in proper sharps container after use. Never reuse or share.`,
    specs: new Map([
      ['Brand', 'JMI'],
      ['Capacity', '1ml'],
      ['Type', 'Sterile Disposable Hypodermic Syringe'],
      ['Material', 'Pharmaceutical-grade Polypropylene'],
      ['Sterilization', 'EO Gas'],
      ['Use', 'Single Use Only'],
    ]),
    tags: ['syringe', 'disposable syringe', '1ml', 'jmi', 'hypodermic', 'sterile', 'injection', 'single use'],
    badge: null,
    images: [
      { token: TOKEN('K5'), pid: 'jmi-syringe-1ml-1', alt: 'JMI Disposable Syringe 1ml sterile — MediportBD' },
      { token: TOKEN('K6'), pid: 'jmi-syringe-1ml-2', alt: 'JMI Syringe 1ml pack view — MediportBD' },
    ],
  },

  // 5. JMI Syringe 10ml
  {
    sku: 'JMI-SYR-10ML',
    name: 'JMI Disposable Syringe 10ml',
    brandName: 'JMI',
    categoryName: 'Hospital Machines',
    subcategory: 'Surgical Accessories',
    price: 8, oldPrice: 8,
    unit: 'piece', stock: 500,
    description: `JMI Disposable Syringe 10ml — single-use high-quality syringe for accurate administration of medium-dose medications in medical, laboratory, and clinical settings.

Key Features:
• 10ml capacity with clear barrel for accurate dose reading
• Precise easy-to-read graduation marks
• Smooth plunger action for controlled injection
• Secure luer slip/luer lock tip — compatible with various needles
• Medical-grade non-toxic, pyrogen-free materials
• Individually packaged and sterilized
• Prevents cross-contamination

Applications:
• Medication administration (medium volumes)
• Vaccinations
• IV drug preparation
• Laboratory use
• Wound irrigation`,
    specs: new Map([
      ['Brand', 'JMI'],
      ['Capacity', '10ml'],
      ['Tip', 'Luer Slip / Luer Lock'],
      ['Material', 'Medical-grade Polypropylene'],
      ['Sterilization', 'EO Gas'],
      ['Use', 'Single Use Only'],
    ]),
    tags: ['syringe', 'disposable syringe', '10ml', 'jmi', 'hypodermic', 'sterile', 'injection'],
    badge: null,
    images: [
      { token: TOKEN('K7'), pid: 'jmi-syringe-10ml-1', alt: 'JMI Disposable Syringe 10ml — MediportBD' },
      { token: TOKEN('K8'), pid: 'jmi-syringe-10ml-2', alt: 'JMI Syringe 10ml in packaging — MediportBD' },
    ],
  },

  // 6. JMI Syringe 3ml
  {
    sku: 'JMI-SYR-3ML',
    name: 'JMI Disposable Syringe 3ml',
    brandName: 'JMI',
    categoryName: 'Hospital Machines',
    subcategory: 'Surgical Accessories',
    price: 4.41, oldPrice: 4.51,
    unit: 'piece', stock: 1000,
    description: `JMI Disposable Syringe 3ml — single-use high-quality syringe for accurate administration of small to medium-dose medications.

Key Features:
• 3ml capacity with clear barrel
• Precise easy-to-read graduation marks
• Smooth plunger for controlled injection
• Luer slip / luer lock tip compatibility
• Medical-grade, non-toxic, pyrogen-free materials
• Individually packaged and sterilized for optimal hygiene

Applications:
• Vaccinations and immunizations
• Medication administration
• Laboratory procedures
• IV drug preparation
• Clinical use in hospitals and clinics`,
    specs: new Map([
      ['Brand', 'JMI'],
      ['Capacity', '3ml'],
      ['Tip', 'Luer Slip / Luer Lock'],
      ['Material', 'Medical-grade Polypropylene'],
      ['Sterilization', 'EO Gas'],
      ['Use', 'Single Use Only'],
    ]),
    tags: ['syringe', 'disposable syringe', '3ml', 'jmi', 'hypodermic', 'sterile', 'injection', 'vaccination'],
    badge: null,
    images: [
      { token: TOKEN('K9'), pid: 'jmi-syringe-3ml-1', alt: 'JMI Disposable Syringe 3ml sterile single use — MediportBD' },
    ],
  },

  // 7. Savlon Antiseptic Liquid 5000ml
  {
    sku: 'SAVLON-ANT-5000ML',
    name: 'Savlon Antiseptic Liquid 5000ml',
    brandName: 'Savlon',
    categoryName: 'PPE & Safety',
    subcategory: 'Antiseptics & Disinfectants',
    price: 1100, oldPrice: 1200,
    unit: 'piece', stock: 50,
    description: `Savlon Antiseptic Liquid 5000ml — 5-litre institutional-size antiseptic for hospitals, clinics, hotels, offices, factories and other high-traffic environments.

Key Features:
• Alcohol Content: 70% V/V Ethyl Alcohol (95%V/V) denatured
• Broad-spectrum protection against bacteria, fungi, molds and viruses
• Ideal for hand sanitization and surface disinfection
• Large 5-litre can for refilling dispensers
• Includes Aloe Barbadensis leaf juice and Vitamin E for skin care
• Trusted Savlon formula

Active Ingredients:
• Ethyl Alcohol (70% V/V) — powerful antiseptic
• Isopropyl Alcohol (3.5% V/V) — enhanced germicidal action
• Propylene Glycol, Glycerin — skin conditioning
• Aloe Barbadensis Leaf Juice + Vitamin E

Usage:
• For wound cleansing: dilute before use
• For surface disinfection: use diluted on surfaces
• For refilling dispensers: pour into smaller bottles/dispensers

Ideal For: Hospitals, clinics, schools, offices, factories, retail outlets.

Storage: Cool, dry place, away from direct sunlight and heat.`,
    specs: new Map([
      ['Brand', 'Savlon'],
      ['Volume', '5000ml (5 Litres)'],
      ['Alcohol', '70% V/V Ethyl Alcohol'],
      ['Use', 'Antiseptic, Disinfectant, Hand Sanitizer'],
      ['Form', 'Liquid'],
    ]),
    tags: ['savlon', 'antiseptic', 'disinfectant', '5000ml', '5 litre', 'hand sanitizer', 'hospital', 'institutional'],
    badge: 'bestseller',
    images: [
      { token: TOKEN('K10'), pid: 'savlon-antiseptic-5000ml-1', alt: 'Savlon Antiseptic Liquid 5000ml 5 litre can — MediportBD' },
      { token: TOKEN('K11'), pid: 'savlon-antiseptic-5000ml-2', alt: 'Savlon 5L antiseptic bottle label — MediportBD' },
      { token: TOKEN('K12'), pid: 'savlon-antiseptic-5000ml-3', alt: 'Savlon antiseptic 5L view 3 — MediportBD' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function uploadImage(token, publicId, alt) {
  const result = await cloudinary.uploader.upload(`${CDN}${token}`, {
    folder: 'Mediport/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
    timeout: 60000,
  });
  return { url: result.secure_url, publicId: result.public_id, alt };
}

async function getOrCreateBrand(name) {
  const slug = slugify(name, { lower: true, strict: true });
  let b = await Manufacturer.findOne({ $or: [{ name: new RegExp(`^${name}$`, 'i') }, { slug }] });
  if (!b) {
    b = await Manufacturer.create({ name, slug, description: `${name} medical products`, isActive: true });
    console.log(`    🏷️  Created brand: ${name}`);
  }
  return b._id;
}

async function getOrCreateCategory(name) {
  const slug = slugify(name, { lower: true, strict: true });
  let c = await Category.findOne({ $or: [{ name: new RegExp(`^${name}$`, 'i') }, { slug }] });
  if (!c) {
    c = await Category.create({ name, slug, description: `${name} medical equipment`, isActive: true });
    console.log(`    📂 Created category: ${name}`);
  }
  return c._id;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│     Add 7 Miscellaneous Products with Real Images          │
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

  const results = { success: 0, skipped: 0, failed: 0, errors: [] };

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    console.log(`[${i + 1}/7] ${p.name}`);

    try {
      if (await Product.findOne({ sku: p.sku })) {
        console.log('       ⏭️  Already exists — skipped\n');
        results.skipped++;
        continue;
      }

      const brandId    = await getOrCreateBrand(p.brandName);
      const categoryId = await getOrCreateCategory(p.categoryName);

      // Upload images
      const uploadedImages = [];
      for (const img of p.images) {
        try {
          const u = await uploadImage(img.token, img.pid, img.alt);
          uploadedImages.push({ ...u, isPrimary: uploadedImages.length === 0 });
          process.stdout.write(`       📤 ✅\n`);
        } catch (e) {
          console.log(`       ⚠️  Image failed: ${e.message}`);
        }
      }

      // Unique slug
      let base = slugify(p.name, { lower: true, strict: true });
      let slug = base, n = 1;
      while (await Product.findOne({ slug })) slug = `${base}-${++n}`;

      await Product.create({
        sku: p.sku,
        name: p.name,
        slug,
        description: p.description,
        brand: brandId,
        category: categoryId,
        subcategory: p.subcategory || '',
        price: p.price,
        oldPrice: p.oldPrice,
        stock: p.stock,
        unit: p.unit,
        minOrderQty: 1,
        images: uploadedImages,
        specifications: p.specs,
        certifications: ['CE Certified'],
        storageTemp: 'room',
        hazardClass: 'safe',
        tags: p.tags,
        badge: p.badge || null,
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

    await new Promise(r => setTimeout(r, 700));
  }

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│                       RESULTS                              │');
  console.log('└────────────────────────────────────────────────────────────┘');
  console.log(`  ✅ Imported:  ${results.success}`);
  console.log(`  ⏭️  Skipped:   ${results.skipped}`);
  console.log(`  ❌ Failed:    ${results.failed}`);
  if (results.errors.length) {
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
