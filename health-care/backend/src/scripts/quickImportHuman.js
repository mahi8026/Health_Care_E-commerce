#!/usr/bin/env node

/**
 * Quick Import Script for Human Brand Reagents
 * 
 * This script automates the entire process:
 * 1. Uploads images to Cloudinary
 * 2. Creates Human manufacturer if not exists
 * 3. Verifies Laboratory Reagents category exists
 * 4. Imports all 20 Human products
 * 
 * Usage:
 *   node src/scripts/quickImportHuman.js
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

// Sample product images from the provided files
const SAMPLE_IMAGES = [
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141842.jpg',
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141732.jpg',
  'C:\\Users\\mahim\\Downloads\\IMG_20260818_141745.jpg',
];

let uploadedImageUrls = [];

/**
 * Upload sample images to Cloudinary
 */
async function uploadSampleImages() {
  console.log('\n→ Step 1: Uploading sample product images to Cloudinary...\n');
  
  for (let i = 0; i < SAMPLE_IMAGES.length; i++) {
    try {
      console.log(`   Uploading image ${i + 1}/${SAMPLE_IMAGES.length}...`);
      const result = await cloudinary.uploader.upload(SAMPLE_IMAGES[i], {
        folder: 'Mediport/products/human',
        public_id: `human-reagent-sample-${i + 1}`,
        resource_type: 'auto',
        timeout: 60000,
        transformation: [
          { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good' },
        ],
      });
      uploadedImageUrls.push(result.secure_url);
      console.log(`   ✓ Uploaded: ${result.secure_url}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`   ✗ Failed to upload image ${i + 1}: ${error.message}`);
      // Use placeholder if upload fails
      uploadedImageUrls.push('https://via.placeholder.com/1000x1000?text=Human+Reagent');
    }
  }
  
  console.log(`\n   ✓ Uploaded ${uploadedImageUrls.length} sample images\n`);
}

/**
 * Verify or create category
 */
async function ensureCategory() {
  console.log('→ Step 2: Verifying Laboratory Reagents category...\n');
  
  let category = await Category.findOne({ name: 'Laboratory Reagents' });
  
  if (!category) {
    console.log('   Creating Laboratory Reagents category...');
    category = await Category.create({
      name: 'Laboratory Reagents',
      slug: 'laboratory-reagents',
      description: 'Laboratory reagents and rapid test kits for clinical chemistry, immunology, and diagnostics. HbA1c, CBC, biochemistry, immunoassay, coagulation, and urinalysis reagents from leading manufacturers.',
      isActive: true,
    });
    console.log('   ✓ Created category (ID: ' + category._id + ')');
  } else {
    console.log('   ✓ Category already exists (ID: ' + category._id + ')');
  }
  
  console.log('');
  return category;
}

/**
 * Create Human manufacturer
 */
async function ensureManufacturer() {
  console.log('→ Step 3: Creating Human manufacturer...\n');
  
  let manufacturer = await Manufacturer.findOne({ slug: 'human' });
  
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'Human',
      slug: 'human',
      description: 'Human Diagnostics Worldwide - Leading German manufacturer of in-vitro diagnostic products. Founded in 1968, Human specializes in clinical chemistry, immunology, hemostasis, and point-of-care testing. Known for the Liquicolor reagent line with excellent quality, precision, and reliability. CE IVD certified and ISO 13485 compliant.',
      country: 'Germany',
      website: 'https://www.human.de',
      isActive: true,
    });
    console.log('   ✓ Created manufacturer (ID: ' + manufacturer._id + ')');
  } else {
    console.log('   ✓ Manufacturer already exists (ID: ' + manufacturer._id + ')');
  }
  
  console.log('');
  return manufacturer;
}

/**
 * Generate unique SKU
 */
async function generateSKU(productName, manufacturer) {
  const base = productName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
  const prefix = 'HUM';
  let sku = `${prefix}-${base}`;
  let counter = 1;
  while (await Product.findOne({ sku })) {
    sku = `${prefix}-${base}-${counter}`;
    counter++;
  }
  return sku;
}

/**
 * Generate unique slug
 */
async function generateUniqueSlug(name) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await Product.findOne({ slug })) {
    slug = `${slugify(name, { lower: true, strict: true })}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Import products
 */
async function importProducts(manufacturer, category) {
  console.log('→ Step 4: Importing 20 Human Liquicolor reagent products...\n');
  console.log('─'.repeat(60));
  
  const products = [
    { name: 'Human Liquicolor Cholesterol Test Kit', price: 8500, stock: 25, storage: 'cold' },
    { name: 'Human Liquicolor Triglycerides Test Kit', price: 9200, stock: 20, storage: 'cold' },
    { name: 'Human Liquicolor HDL Cholesterol Direct Test Kit', price: 12500, stock: 15, storage: 'cold' },
    { name: 'Human Liquicolor LDL Cholesterol Direct Test Kit', price: 13500, stock: 15, storage: 'cold' },
    { name: 'Human Liquicolor Glucose GOD-PAP Test Kit', price: 7500, stock: 30, storage: 'cold' },
    { name: 'Human Liquicolor Urea Urease/GLDH Test Kit', price: 8800, stock: 20, storage: 'cold' },
    { name: 'Human Liquicolor Creatinine Jaffe Test Kit', price: 8500, stock: 25, storage: 'cold' },
    { name: 'Human Liquicolor Uric Acid Uricase Test Kit', price: 8900, stock: 20, storage: 'cold' },
    { name: 'Human Liquicolor Total Protein Biuret Test Kit', price: 7800, stock: 25, storage: 'room' },
    { name: 'Human Liquicolor Albumin BCG Test Kit', price: 8200, stock: 20, storage: 'room' },
    { name: 'Human Liquicolor ALT (GPT) IFCC Test Kit', price: 9500, stock: 20, storage: 'cold' },
    { name: 'Human Liquicolor AST (GOT) IFCC Test Kit', price: 9500, stock: 20, storage: 'cold' },
    { name: 'Human Liquicolor Alkaline Phosphatase ALP Test Kit', price: 9200, stock: 18, storage: 'cold' },
    { name: 'Human Liquicolor Total Bilirubin DPD Test Kit', price: 10500, stock: 15, storage: 'cold' },
    { name: 'Human Liquicolor Direct Bilirubin DPD Test Kit', price: 10500, stock: 15, storage: 'cold' },
    { name: 'Human Liquicolor GGT Test Kit', price: 11500, stock: 15, storage: 'cold' },
    { name: 'Human Liquicolor Calcium Arsenazo III Test Kit', price: 8800, stock: 20, storage: 'room' },
    { name: 'Human Liquicolor Magnesium Xylidyl Blue Test Kit', price: 9500, stock: 18, storage: 'room' },
    { name: 'Human Liquicolor Inorganic Phosphorus Test Kit', price: 8500, stock: 20, storage: 'room' },
    { name: 'Human Liquicolor Iron FerroZine Test Kit', price: 10500, stock: 15, storage: 'room' },
  ];
  
  const stats = { success: 0, skipped: 0, failed: 0 };
  
  for (const prod of products) {
    try {
      // Check if exists
      const existing = await Product.findOne({
        name: new RegExp('^' + prod.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'),
      });
      
      if (existing) {
        console.log(`\n   ⊘ ${prod.name} - Already exists`);
        stats.skipped++;
        continue;
      }
      
      const sku = await generateSKU(prod.name, manufacturer);
      const slug = await generateUniqueSlug(prod.name);
      
      // Use uploaded sample images (cycle through them)
      const imageIndex = stats.success % uploadedImageUrls.length;
      const images = [{
        url: uploadedImageUrls[imageIndex],
        publicId: `human-reagent-sample-${imageIndex + 1}`,
        isPrimary: true,
        alt: `${prod.name} - Human Diagnostics Germany - MediportBD Bangladesh`,
      }];
      
      const specifications = new Map([
        ['Test Count', '100 tests per kit'],
        ['Storage', prod.storage === 'cold' ? '2-8°C' : 'Room temperature (15-25°C)'],
        ['Shelf Life', '18-24 months'],
        ['Certification', 'CE IVD, ISO 13485, ISO 9001'],
        ['Manufacturer', 'Human Diagnostics, Germany'],
        ['Warranty', '1 year manufacturer warranty'],
      ]);
      
      await Product.create({
        name: prod.name,
        slug,
        sku,
        description: `${prod.name} - High-quality clinical chemistry reagent from Human Diagnostics Germany. Part of the Liquicolor reagent line known for excellent precision and reliability. 100 tests per kit. CE IVD certified and ISO 13485 compliant. Suitable for manual and automated analyzers. Made in Germany.`,
        brand: manufacturer._id,
        category: category._id,
        price: prod.price,
        stock: prod.stock,
        lowStockThreshold: 5,
        unit: 'kit',
        minOrderQty: 1,
        images,
        specifications,
        certifications: ['CE IVD', 'ISO 13485', 'ISO 9001'],
        storageTemp: prod.storage,
        tests: '100 tests per kit',
        isFeatured: false,
        isActive: true,
        tags: ['Human', 'Clinical Chemistry', 'Liquicolor', 'Germany Quality', 'Laboratory Reagents', 'Reagent Kit'],
      });
      
      console.log(`\n   ✓ ${prod.name}`);
      console.log(`      Price: ৳${prod.price.toLocaleString()} | Stock: ${prod.stock} kits`);
      stats.success++;
      
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.log(`\n   ✗ ${prod.name} - Error: ${error.message}`);
      stats.failed++;
    }
  }
  
  return stats;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Human Brand Reagent Quick Import');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Step 1: Upload sample images
    await uploadSampleImages();
    
    // Step 2: Ensure category exists
    const category = await ensureCategory();
    
    // Step 3: Ensure manufacturer exists
    const manufacturer = await ensureManufacturer();
    
    // Step 4: Import products
    const stats = await importProducts(manufacturer, category);
    
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Complete!');
    console.log('─'.repeat(60));
    console.log(`   ✓ Successfully imported: ${stats.success} products`);
    console.log(`   ⊘ Skipped (existing):    ${stats.skipped} products`);
    console.log(`   ✗ Failed:                ${stats.failed} products`);
    console.log(`   📦 Total products:        ${stats.success + stats.skipped + stats.failed}`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Visit http://localhost:3000/products to see the products');
    console.log('   2. Filter by Brand: "Human"');
    console.log('   3. Or visit http://localhost:3000/reagent-store');
    console.log('   4. Check admin panel for product management');
    
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

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
