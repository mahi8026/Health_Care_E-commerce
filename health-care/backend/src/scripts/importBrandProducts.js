#!/usr/bin/env node

/**
 * Generic brand product importer
 * Reads data/<brand>-products.json produced by scrapeBrandProducts.js
 * Uploads images to Cloudinary and creates products in MediportBD
 *
 * Usage:
 *   node src/scripts/importBrandProducts.js <brand-slug>
 *
 * Examples:
 *   node src/scripts/importBrandProducts.js mindray
 *   node src/scripts/importBrandProducts.js contec
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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

const PRICE_ON_REQUEST = 0;

const BRANDS = {
  mindray: {
    name: 'Mindray',
    country: 'China',
    website: 'https://www.mindray.com',
    description: 'Mindray Medical International Limited - one of the world\'s leading medical device developers and suppliers. Headquartered in Shenzhen, China. Known for patient monitors, ultrasound systems, laboratory analyzers, anesthesia machines, infusion pumps, and ECG devices used in hospitals and clinics worldwide.',
    priceOnRequest: true,
    dataFile: 'mindray-products.json',
    categoryMap: {
      'Ultrasound Machine': 'Hospital Machines',
      'Ultrasound Transducer': 'Hospital Machines',
      'Hematology Analyzer/ Blood Cell Counter': 'Laboratory Equipment',
      'ECG': 'Hospital Machines',
      'Harmon analyzer, Microplate, Elisa&Microbiology Reader': 'Laboratory Equipment',
      'ESR Analyzer': 'Laboratory Equipment',
      'Syringe/Infusion Pump': 'Hospital Machines',
      'Biochemistry/Clinical Chemistry Analyzer': 'Laboratory Equipment',
      'Anesthesia': 'Hospital Machines',
    },
    tags: ['Mindray', 'Hospital Equipment', 'China Quality'],
  },
  contec: {
    name: 'Contec',
    country: 'China',
    website: 'https://www.contecmed.com',
    description: 'CONTEC Medical Systems - leading Chinese manufacturer of professional medical monitoring and diagnostic devices. Known for ECG machines, Holter monitors, patient monitors, pulse oximeters, spirometers, fetal dopplers, nebulizers, and urine analyzers used worldwide.',
    priceOnRequest: false,
    dataFile: 'contec-products.json',
    categoryMap: {
      'ECG': 'Hospital Machines',
      'Holter': 'Hospital Machines',
      'Urine Analyzer': 'Laboratory Equipment',
      'Pulse Oximeter': 'Diagnostic Equipment',
      'Patient Monitor': 'Hospital Machines',
      'Nebulizer': 'Hospital Machines',
      'Fetal Doppler': 'Diagnostic Equipment',
      'SPIROMETRY': 'Respiratory Equipment',
    },
    tags: ['Contec', 'Medical Equipment', 'China Quality'],
  },
  comen: {
    name: 'Comen',
    country: 'China',
    website: 'https://www.comen.com',
    description: 'Comen Medical Systems - one of the leading medical device manufacturers in China, specializing in patient monitors, fetal monitors, anesthesia systems, ventilators, and diagnostic equipment. Known for the STAR series patient monitors and high-quality multi-parameter monitoring solutions used in hospitals worldwide.',
    priceOnRequest: false,
    dataFile: 'comen-products.json',
    categoryMap: {
      'Patient Monitor': 'Hospital Machines',
    },
    tags: ['Comen', 'Hospital Equipment', 'China Quality'],
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const brand = (args[0] || '').toLowerCase();
  if (!BRANDS[brand]) {
    console.error('Usage: node src/scripts/importBrandProducts.js <brand-slug>');
    console.error('Available brands: ' + Object.keys(BRANDS).join(', '));
    process.exit(1);
  }
  return { brand };
}

async function uploadImage(imageUrl, productName, index, brand) {
  try {
    console.log('   Uploading image ' + (index + 1) + ': ' + imageUrl);
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/' + brand,
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
      alt: productName + ' - ' + brand.toUpperCase() + ' Bangladesh - MediportBD',
    };
  } catch (error) {
    console.error('   x Failed to upload image: ' + error.message);
    return null;
  }
}

async function getManufacturer(cfg) {
  let manufacturer = await Manufacturer.findOne({
    $or: [{ name: new RegExp('^' + cfg.name + '$', 'i') }, { slug: cfg.name.toLowerCase() }],
  });
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: cfg.name,
      slug: cfg.name.toLowerCase(),
      description: cfg.description,
      country: cfg.country,
      website: cfg.website,
      isActive: true,
    });
    console.log('✓ Created ' + cfg.name + ' manufacturer');
  } else {
    console.log('✓ Found existing ' + cfg.name + ' manufacturer');
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

async function generateSKU(productName, manufacturer) {
  const base = productName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
  const prefix = manufacturer.name.substring(0, 3).toUpperCase();
  let sku = prefix + '-' + base;
  let counter = 1;
  while (await Product.findOne({ sku })) {
    sku = prefix + '-' + base + '-' + counter;
    counter++;
  }
  return sku;
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

async function importProduct(raw, cfg, brand, manufacturer) {
  try {
    console.log('\n→ Processing: ' + raw.name);

    const existing = await Product.findOne({
      name: new RegExp('^' + raw.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
    });
    if (existing) {
      console.log('   ⊘ Skipped: already exists (ID: ' + existing._id + ')');
      return { success: false, reason: 'duplicate' };
    }

    const sourceCat = (raw.category || raw.categoryFromListing || '').trim();
    const mappedName = cfg.categoryMap[sourceCat];
    if (!mappedName) {
      console.log('   ✗ No category mapping for: "' + sourceCat + '"');
      return { success: false, reason: 'unknown category: ' + sourceCat };
    }
    const category = await findCategory(mappedName);
    console.log('   ✓ Category: ' + mappedName);

    // Price handling
    let price = PRICE_ON_REQUEST;
    let oldPrice = null;
    if (!cfg.priceOnRequest && raw.price && raw.price > 0) {
      price = raw.price;
      oldPrice = raw.oldPrice || null;
    }
    const isPriceOnRequest = price === 0;

    const sku = await generateSKU(raw.name, manufacturer);
    const slug = await generateUniqueSlug(raw.name);

    // Images
    const imgUrls = [];
    if (raw.image) imgUrls.push(raw.image);
    if (raw.galleryImages && raw.galleryImages.length) {
      raw.galleryImages.forEach((u) => {
        if (!imgUrls.includes(u)) imgUrls.push(u);
      });
    }

    const uploadedImages = [];
    if (imgUrls.length) {
      console.log('   ↑ Uploading ' + imgUrls.length + ' image(s)...');
      for (let i = 0; i < imgUrls.length && i < 5; i++) {
        const up = await uploadImage(imgUrls[i], raw.name, i, brand);
        if (up) uploadedImages.push(up);
      }
      console.log('   ✓ Uploaded ' + uploadedImages.length + ' image(s)');
    }

    const specifications = new Map();
    if (isPriceOnRequest) {
      specifications.set('Price', 'Price on request - contact us for quotation');
    }
    specifications.set('Warranty', '1 year manufacturer warranty');

    const product = await Product.create({
      name: raw.name,
      slug,
      sku,
      description: raw.description || cfg.name + ' medical device - ' + raw.name + '.\nPrice on request - please contact us for a quotation.',
      brand: manufacturer._id,
      category: category._id,
      price,
      oldPrice,
      stock: raw.isOutOfStock ? 0 : 10,
      lowStockThreshold: 5,
      unit: 'piece',
      minOrderQty: 1,
      images: uploadedImages,
      specifications,
      certifications: [],
      badge: raw.badge || null,
      isFeatured: false,
      isActive: true,
      tags: cfg.tags.concat([mappedName]),
    });

    console.log('   ✓ Created product (ID: ' + product._id + ')');
    console.log('   ✓ Price: ' + (isPriceOnRequest ? 'Price on request' : '৳' + product.price.toLocaleString()));
    console.log('   ✓ Stock: ' + product.stock + ' units');
    return { success: true, product };
  } catch (error) {
    console.error('   ✗ Error: ' + error.message);
    return { success: false, reason: error.message };
  }
}

async function main() {
  const args = parseArgs();
  const brand = args.brand;
  const cfg = BRANDS[brand];

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ' + cfg.name.toUpperCase() + ' Product Import (' + brand + ')');
  console.log('═══════════════════════════════════════════════════════════\n');

  const dataPath = path.join(__dirname, '..', '..', 'data', cfg.dataFile);
  let rawProducts;
  try {
    rawProducts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e) {
    console.error('Cannot read data file: ' + dataPath);
    console.error(e.message);
    process.exit(1);
  }
  console.log('Loaded ' + rawProducts.length + ' products from ' + cfg.dataFile + '\n');

  const stats = { total: rawProducts.length, success: 0, failed: 0, skipped: 0, errors: [] };

  try {
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const manufacturer = await getManufacturer(cfg);
    console.log('   ID: ' + manufacturer._id + '\n');

    console.log('→ Importing ' + stats.total + ' product(s)...\n');
    console.log('─'.repeat(60));

    for (const raw of rawProducts) {
      const result = await importProduct(raw, cfg, brand, manufacturer);
      if (result.success) stats.success++;
      else if (result.reason === 'duplicate') stats.skipped++;
      else {
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