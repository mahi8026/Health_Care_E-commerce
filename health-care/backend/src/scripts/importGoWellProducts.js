#!/usr/bin/env node

/**
 * GoWell Product Import Script
 * Adds GoWell products to MediportBD with Cloudinary image upload.
 *
 * Usage:
 *   node src/scripts/importGoWellProducts.js
 *
 * Add products to the GOWELL_PRODUCTS array below following the documented
 * structure in GOWELL_IMPORT_GUIDE.md.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GOWELL_PRODUCTS = [
  {
    name: 'GoWell Comfy Stim 806 Plus Digital TENS Machine',
    description:
      'Digital TENS machine providing effective pain relief and muscle stimulation with TENS and EMS technology. Features multiple therapy modes and adjustable intensity levels for versatile physiotherapy use at home or clinic.',
    category: 'Physiotherapy & Rehabilitation',
    price: 5860,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/311-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1589-scaled.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1586-rotated.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1583-rotated.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/IMG_1578-rotated.jpg',
    ],
    specifications: {
      'Type': 'Digital TENS Machine (TENS & EMS)',
      'Technology': 'TENS and EMS',
      'Use': 'Pain relief and muscle stimulation',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Physiotherapy', 'Pain Relief', 'EMS'],
    sku: '59424695',
  },
  {
    name: 'GoWell Comfy Tens 804 Digital Physiotherapy Machine',
    description:
      'Digital physiotherapy machine offering non-invasive pain relief and muscle relaxation with TENS technology. Compact design for home and clinical physiotherapy use.',
    category: 'Physiotherapy & Rehabilitation',
    price: 4950,
    oldPrice: null,
    stock: 20,
    lowStockThreshold: 5,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_22_1317313_comfy-tens-physiotherapy-back-pain-remove-machine-physiotherapy-device-taiwan-made-with-warranty.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_7_giant_278715.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_6_giant_278714.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/imgi_23_1317314_comfy-tens-physiotherapy-back-pain-remove-machine-physiotherapy-device-taiwan-made-with-warranty.jpg',
      'https://gowellbd.com/wp-content/uploads/2024/09/Gemini_Generated_Image_gcon9fgcon9fgcon.png',
    ],
    specifications: {
      'Type': 'Digital Physiotherapy Machine',
      'Technology': 'TENS',
      'Use': 'Non-invasive pain relief and muscle relaxation',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Physiotherapy', 'Pain Relief'],
    sku: '59423799',
  },
  {
    name: 'GoWell Blueidea Electronic TENS Pulse Massager BLD321',
    description:
      'Electronic TENS pulse massager with LCD digital screen and 8 therapy modes. Adjustable intensity levels, suitable for full body use. Lightweight and compact design for home physiotherapy and pain relief.',
    category: 'Physiotherapy & Rehabilitation',
    price: 1590,
    oldPrice: null,
    stock: 50,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-8.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-9.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-8-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-7-1.webp',
      'https://gowellbd.com/wp-content/uploads/2026/05/s-l1600-6-2.webp',
    ],
    specifications: {
      'Brand': 'Blueidea',
      'Model': 'BLD-321',
      'Type': 'Electronic TENS Pulse Massager',
      'Display': 'LCD Digital Screen',
      'Modes': '8 Therapy Modes',
      'Intensity': 'Adjustable Levels',
      'Usage Area': 'Full Body',
      'Portability': 'Lightweight & Compact',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'TENS Machine', 'Pulse Massager', 'Physiotherapy', 'Pain Relief'],
    sku: '61727139',
  },
  {
    name: 'GoWell 35W Disposable Skin Stapler (Stainless Steel)',
    description:
      'High-quality 35W disposable skin stapler with 35 stainless steel staples. Designed for safe, precise, and sterile wound closure in medical applications. Single-use, ready-to-use design for surgical and clinical use.',
    category: 'Surgical Instruments',
    price: 400,
    oldPrice: null,
    stock: 100,
    lowStockThreshold: 20,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/06/35W.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/35W1.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_81_f62c816cf1e07567dbc5669cbd6aeaa2.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/06/imgi_82_f22b7d640e08ce95a38b853ef7d5dc2b.jpg',
    ],
    specifications: {
      'Type': 'Disposable Skin Stapler',
      'Staple Count': '35 stainless steel staples',
      'Material': 'Stainless Steel',
      'Use': 'Wound closure - surgical and clinical',
      'Sterility': 'Sterile, single-use',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: ['CE'],
    warranty: '1 year manufacturer warranty',
    badge: null,
    isFeatured: false,
    tags: ['GoWell', 'Skin Stapler', 'Surgical', 'Wound Closure', 'Disposable'],
    sku: '03315403',
  },
  {
    name: 'GoWell Dual Light Zoom Headlamp T6',
    description:
      'Dual light source headlamp with powerful illumination, telescopic zoom for wide and focused lighting, and high beam intensity. Features three lighting modes for versatile use, a durable aluminium alloy body, adjustable 90° lighting angle, comfortable headband, and red rear indicator light for safety. Powered by a rechargeable 2400mAh battery. Ideal for outdoor work, camping, hiking, inspection, and medical examination use.',
    category: 'Diagnostic Equipment',
    price: 880,
    oldPrice: null,
    stock: 30,
    lowStockThreshold: 10,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      'https://gowellbd.com/wp-content/uploads/2026/04/dual-zoom.png',
      'https://gowellbd.com/wp-content/uploads/2026/04/4%D1%81.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/04/Gemini_Generated_Image_7u941n7u941n7u94.png',
      'https://gowellbd.com/wp-content/uploads/2026/04/6%D1%81.jpg',
      'https://gowellbd.com/wp-content/uploads/2026/04/8%D1%81.jpg',
    ],
    specifications: {
      'Type': 'Dual Light Zoom Headlamp',
      'Material': 'Aluminium Alloy',
      'Power Source': 'Rechargeable Battery (2400mAh)',
      'Lighting Angle': 'Adjustable up to 90°',
      'Lighting Modes': 'Three modes (high beam intensity)',
      'Zoom': 'Telescopic zoom for wide and focused lighting',
      'Safety Feature': 'Red rear indicator light',
      'Headband': 'Adjustable and comfortable',
      'Colour': 'Multicolour',
      'Warranty': '1 year manufacturer warranty',
    },
    certifications: [],
    warranty: '1 year manufacturer warranty',
    badge: 'new',
    isFeatured: false,
    tags: ['GoWell', 'Headlamp', 'Flash Light', 'Rechargeable'],
    sku: '01514079',
  },
];

async function uploadImage(imageUrl, productName, index) {
  try {
    console.log('   Uploading image ' + (index + 1) + ': ' + imageUrl);
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/gowell',
      resource_type: 'auto',
      timeout: 60000,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: index === 0,
      alt: productName + ' - GoWell - MediportBD',
    };
  } catch (error) {
    console.error('   x Failed to upload image: ' + error.message);
    return null;
  }
}

async function getManufacturer() {
  let manufacturer = await Manufacturer.findOne({ name: 'Generic' });
  if (!manufacturer) {
    manufacturer = await Manufacturer.findOne({ name: 'Non-Brand' });
  }
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'Generic',
      slug: 'generic',
      description: 'Generic / non-brand products.',
      isActive: true,
    });
    console.log('✓ Created Generic manufacturer');
  } else {
    console.log('✓ Found ' + manufacturer.name + ' manufacturer');
  }
  return manufacturer;
}

async function findCategory(mappedName) {
  const category = await Category.findOne({ name: mappedName, isActive: true });
  if (!category) {
    throw new Error('Category "' + mappedName + '" not found in DB');
  }
  return category;
}

async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = slugify(name, { lower: true, strict: true }) + '-' + counter;
    counter++;
  }
  return slug;
}

async function importProduct(raw) {
  try {
    console.log('\n→ Processing: ' + raw.name);

    const existing = await Product.findOne({
      name: new RegExp('^' + raw.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (existing) {
      console.log('   ⊘ Skipped: already exists (ID: ' + existing._id + ')');
      return { success: false, reason: 'duplicate' };
    }

    const category = await findCategory(raw.category);
    console.log('   ✓ Category: ' + raw.category);

    const sku = (raw.sku || '').trim();
    const slug = await generateUniqueSlug(raw.name);

    const uploadedImages = [];
    if (raw.images && raw.images.length) {
      console.log('   ↑ Uploading ' + raw.images.length + ' image(s)...');
      for (let i = 0; i < raw.images.length && i < 5; i++) {
        const up = await uploadImage(raw.images[i], raw.name, i);
        if (up) {
          uploadedImages.push(up);
        }
      }
      console.log('   ✓ Uploaded ' + uploadedImages.length + ' image(s)');
    }

    const specifications = new Map(Object.entries(raw.specifications || {}));

    const product = await Product.create({
      name: raw.name,
      slug,
      sku,
      description: raw.description,
      brand: manufacturer._id,
      category: category._id,
      price: raw.price,
      oldPrice: raw.oldPrice || null,
      stock: raw.stock,
      lowStockThreshold: raw.lowStockThreshold || 10,
      unit: raw.unit || 'piece',
      minOrderQty: raw.minOrderQty || 1,
      images: uploadedImages,
      specifications,
      certifications: raw.certifications || [],
      badge: raw.badge || null,
      isFeatured: raw.isFeatured || false,
      isActive: true,
      tags: raw.tags || [],
    });

    console.log('   ✓ Created product (ID: ' + product._id + ')');
    console.log('   ✓ Price: ৳' + product.price.toLocaleString());
    console.log('   ✓ Stock: ' + product.stock + ' units');
    return { success: true, product };
  } catch (error) {
    console.error('   ✗ Error: ' + error.message);
    return { success: false, reason: error.message };
  }
}

let manufacturer;

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GOWELL PRODUCT IMPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = { total: GOWELL_PRODUCTS.length, success: 0, failed: 0, skipped: 0, errors: [] };

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    manufacturer = await getManufacturer();
    console.log('   ID: ' + manufacturer._id + '\n');

    console.log('→ Importing ' + stats.total + ' product(s)...\n');
    console.log('─'.repeat(60));

    for (const raw of GOWELL_PRODUCTS) {
      const result = await importProduct(raw);
      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({ product: raw.name, error: result.reason });
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log('   Total products:      ' + stats.total);
    console.log('   ✓ Successfully added: ' + stats.success);
    console.log('   ⊘ Skipped (existing): ' + stats.skipped);
    console.log('   ✗ Failed:             ' + stats.failed);

    if (stats.errors.length) {
      console.log('\n❌ Errors:\n');
      stats.errors.forEach((e, i) => {
        console.log('   ' + (i + 1) + '. ' + e.product);
        console.log('      ' + e.error + '\n');
      });
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});