#!/usr/bin/env node

/**
 * ALPK2 Product Import Script
 * 
 * Imports ALPK2 brand products to MediportBD
 * Ensures accurate category mapping, pricing, and product information
 * 
 * Usage:
 *   node src/scripts/importALPK2Products.js
 * 
 * Features:
 *   - Automatic ALPK2 brand creation/lookup
 *   - Category validation and mapping
 *   - Image upload to Cloudinary
 *   - SKU generation
 *   - Duplicate detection
 *   - Detailed import reporting
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * ALPK2 Products Data
 * Add your ALPK2 products here with accurate information
 */
const ALPK2_PRODUCTS = [
  {
    name: 'ALPK2 Aneroid Sphygmomanometer',
    description: 'Professional aneroid sphygmomanometer from ALPK2 for accurate blood pressure measurement. Features durable construction, easy-to-read gauge with large numerals, and comfortable arm cuff. Ideal for hospitals, clinics, and home use in Bangladesh. The aneroid mechanism ensures precision measurements without batteries. Comes with premium carrying case for portability and protection. ALPK2 is a trusted brand for medical diagnostic equipment in Bangladesh, offering reliable and affordable healthcare solutions.',
    category: 'Diagnostic Equipment',
    price: 1499,
    oldPrice: 1860,
    stock: 50,
    images: [
      'https://example.com/alpk2-aneroid-sphygmomanometer.jpg' // Replace with actual image URL
    ],
    specifications: {
      'Type': 'Aneroid',
      'Measurement Range': '0-300 mmHg',
      'Accuracy': '±3 mmHg',
      'Cuff Size': 'Adult (22-32 cm)',
      'Material': 'Chrome-plated brass',
      'Gauge Diameter': '58mm',
      'Inflation': 'Manual pump',
      'Package Includes': 'Sphygmomanometer, carrying case',
    },
    certifications: ['CE'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: true,
    badge: 'sale',
  },
  {
    name: 'ALPK2 Blood Pressure Monitor with Stethoscope',
    description: 'Complete blood pressure monitoring kit from ALPK2 combining an accurate aneroid sphygmomanometer with a professional stethoscope. Perfect for medical professionals and home healthcare monitoring in Bangladesh. The dual-head stethoscope provides clear acoustic performance for both adult and pediatric examinations. Durable construction ensures long-lasting performance. Includes premium storage case. ALPK2 offers quality medical equipment at affordable prices for Bangladesh healthcare sector.',
    category: 'Diagnostic Equipment',
    price: 1799,
    oldPrice: 1898,
    stock: 40,
    images: [
      'https://example.com/alpk2-bp-monitor-stethoscope.jpg' // Replace with actual image URL
    ],
    specifications: {
      'Type': 'Aneroid with Stethoscope',
      'Measurement Range': '0-300 mmHg',
      'Accuracy': '±3 mmHg',
      'Cuff Size': 'Adult (22-32 cm)',
      'Stethoscope Type': 'Dual-head',
      'Tubing Length': '55cm',
      'Gauge Diameter': '58mm',
      'Package Includes': 'Sphygmomanometer, stethoscope, carrying case',
    },
    certifications: ['CE'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: true,
    badge: 'sale',
  },
  {
    name: 'Original Japan ALPK2 Aneroid Sphygmomanometer',
    description: 'Premium quality aneroid sphygmomanometer manufactured in Japan by ALPK2. Delivers exceptional accuracy and reliability for professional blood pressure measurement. Features robust construction with corrosion-resistant materials, large easy-to-read dial, and precision aneroid mechanism. The adult-size cuff accommodates most arm sizes comfortably. Designed for intensive use in hospitals, clinics, and diagnostic centers across Bangladesh. ALPK2 Japan quality ensures consistent performance and durability. Complete with protective carrying case.',
    category: 'Diagnostic Equipment',
    price: 2999,
    oldPrice: 3500,
    stock: 30,
    images: [
      'https://example.com/alpk2-japan-aneroid.jpg' // Replace with actual image URL
    ],
    specifications: {
      'Origin': 'Japan',
      'Type': 'Aneroid',
      'Measurement Range': '0-300 mmHg',
      'Accuracy': '±2 mmHg (High precision)',
      'Cuff Size': 'Adult (24-34 cm)',
      'Material': 'Medical grade brass with chrome plating',
      'Gauge Diameter': '62mm',
      'Calibration': 'Factory calibrated',
      'Package Includes': 'Sphygmomanometer, premium case',
    },
    certifications: ['CE', 'ISO 13485', 'JIS (Japan Industrial Standards)'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '2 years manufacturer warranty',
    isFeatured: true,
    badge: 'ce_certified',
  },
  {
    name: 'Original Japan ALPK2 Sphygmomanometer with Stethoscope',
    description: 'Premium Japanese-made blood pressure monitoring kit from ALPK2 featuring an aneroid sphygmomanometer paired with a professional-grade stethoscope. This combination provides accurate blood pressure readings with excellent acoustic clarity. The precision-engineered aneroid gauge delivers ±2mmHg accuracy, while the dual-head stethoscope ensures clear heart sound detection. Ideal for doctors, nurses, and healthcare professionals in Bangladesh. Durable construction designed for daily clinical use. Comes with deluxe carrying case for easy transport.',
    category: 'Diagnostic Equipment',
    price: 3799,
    oldPrice: 3998,
    stock: 25,
    images: [
      'https://example.com/alpk2-japan-sphygmo-stethoscope.jpg' // Replace with actual image URL
    ],
    specifications: {
      'Origin': 'Japan',
      'Type': 'Aneroid with Professional Stethoscope',
      'Measurement Range': '0-300 mmHg',
      'Accuracy': '±2 mmHg (High precision)',
      'Cuff Size': 'Adult (24-34 cm)',
      'Stethoscope Type': 'Professional dual-head',
      'Tubing Length': '60cm',
      'Gauge Diameter': '62mm',
      'Stethoscope Features': 'Excellent acoustic sensitivity',
      'Package Includes': 'Sphygmomanometer, stethoscope, deluxe case',
    },
    certifications: ['CE', 'ISO 13485', 'JIS (Japan Industrial Standards)'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '2 years manufacturer warranty',
    isFeatured: true,
    badge: 'sale',
  },
  {
    name: 'Original Japan ALPK2 Stethoscope',
    description: 'High-quality professional stethoscope from ALPK2 Japan, designed for accurate auscultation and cardiac examination. Features superior acoustic performance with dual-head chest piece for adult and pediatric use. The precision-tuned diaphragm captures high-frequency sounds, while the bell side picks up low-frequency sounds. Comfortable binaural earpieces with soft ear tips ensure prolonged use without fatigue. Durable latex-free tubing resists skin oils and alcohol. Perfect for doctors, nurses, medical students, and healthcare professionals in Bangladesh. ALPK2 combines Japanese precision with affordability.',
    category: 'Diagnostic Equipment',
    price: 999,
    oldPrice: 1200,
    stock: 60,
    images: [
      'https://example.com/alpk2-japan-stethoscope.jpg' // Replace with actual image URL
    ],
    specifications: {
      'Origin': 'Japan',
      'Type': 'Professional Dual-Head Stethoscope',
      'Chest Piece': 'Dual-head (adult & pediatric)',
      'Diaphragm Diameter': '44mm (adult), 32mm (pediatric)',
      'Tubing Material': 'Latex-free PVC',
      'Tubing Length': '75cm',
      'Acoustic Performance': 'High sensitivity',
      'Earpieces': 'Soft comfortable ear tips',
      'Weight': '150g',
      'Color': 'Black/Silver',
    },
    certifications: ['CE', 'ISO'],
    unit: 'piece',
    minOrderQty: 1,
    warranty: '1 year manufacturer warranty',
    isFeatured: true,
    badge: 'sale',
  },
  // Add more ALPK2 products here...
];

/**
 * Upload image to Cloudinary
 */
async function uploadImage(imageUrl, productName, index = 0) {
  try {
    console.log(`   Uploading image ${index + 1}: ${imageUrl}`);
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'Mediport/products/alpk2',
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
      alt: `${productName} - ALPK2 Medical Equipment Bangladesh - MediportBD`,
    };
  } catch (error) {
    console.error(`   ✗ Failed to upload image: ${error.message}`);
    return null;
  }
}

/**
 * Find or create ALPK2 manufacturer
 */
async function getALPK2Manufacturer() {
  let manufacturer = await Manufacturer.findOne({
    $or: [
      { name: /^ALPK2$/i },
      { slug: 'alpk2' }
    ]
  });

  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'ALPK2',
      slug: 'alpk2',
      description: 'ALPK2 - Premium medical diagnostic equipment manufacturer from Japan, specializing in sphygmomanometers, stethoscopes, and professional healthcare instruments. Known for precision, reliability, and quality in blood pressure measurement devices.',
      country: 'Japan',
      website: '',
      isActive: true,
    });
    console.log('✓ Created ALPK2 manufacturer');
  } else {
    console.log('✓ Found existing ALPK2 manufacturer');
  }

  return manufacturer;
}

/**
 * Find category by name
 */
async function findCategory(categoryName) {
  const category = await Category.findOne({
    name: categoryName,
    isActive: true
  });

  if (!category) {
    throw new Error(`Category "${categoryName}" not found. Please create it first or use an existing category.`);
  }

  return category;
}

/**
 * Generate unique SKU
 */
async function generateSKU(productName, manufacturer) {
  // Generate base SKU from product name
  const base = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10);
  
  const prefix = manufacturer.name.substring(0, 3).toUpperCase();
  let sku = `${prefix}-${base}`;
  
  // Ensure uniqueness
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
 * Import single product
 */
async function importProduct(productData, manufacturer) {
  try {
    console.log(`\n→ Processing: ${productData.name}`);

    // Check for duplicates
    const existing = await Product.findOne({
      name: new RegExp(`^${productData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    if (existing) {
      console.log(`   ⊘ Skipped: Product already exists (ID: ${existing._id})`);
      return { success: false, reason: 'duplicate', product: existing };
    }

    // Find category
    const category = await findCategory(productData.category);
    console.log(`   ✓ Category: ${category.name}`);

    // Generate SKU
    const sku = await generateSKU(productData.name, manufacturer);
    console.log(`   ✓ SKU: ${sku}`);

    // Generate slug
    const slug = await generateUniqueSlug(productData.name);
    console.log(`   ✓ Slug: ${slug}`);

    // Upload images
    const uploadedImages = [];
    if (productData.images && productData.images.length > 0) {
      console.log(`   ↑ Uploading ${productData.images.length} image(s)...`);
      
      for (let i = 0; i < productData.images.length && i < 5; i++) {
        const uploadedImage = await uploadImage(productData.images[i], productData.name, i);
        if (uploadedImage) {
          uploadedImages.push(uploadedImage);
        }
      }
      
      console.log(`   ✓ Uploaded ${uploadedImages.length} image(s)`);
    }

    // Prepare specifications
    const specifications = new Map();
    if (productData.specifications) {
      Object.entries(productData.specifications).forEach(([key, value]) => {
        specifications.set(key, value);
      });
    }

    // Add warranty to specifications if provided
    if (productData.warranty) {
      specifications.set('Warranty', productData.warranty);
    }

    // Create product
    const newProduct = await Product.create({
      name: productData.name,
      slug,
      sku,
      description: productData.description,
      brand: manufacturer._id,
      category: category._id,
      price: productData.price,
      oldPrice: productData.oldPrice || null,
      stock: productData.stock || 0,
      lowStockThreshold: productData.lowStockThreshold || 10,
      unit: productData.unit || 'piece',
      minOrderQty: productData.minOrderQty || 1,
      images: uploadedImages,
      specifications,
      certifications: productData.certifications || [],
      badge: productData.badge || null,
      isFeatured: productData.isFeatured || false,
      isActive: true,
      tags: ['ALPK2', category.name, 'Japan Quality'],
    });

    console.log(`   ✓ Created product (ID: ${newProduct._id})`);
    console.log(`   ✓ Price: ৳${newProduct.price.toLocaleString()}`);
    console.log(`   ✓ Stock: ${newProduct.stock} units`);

    return { success: true, product: newProduct };
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return { success: false, reason: error.message, product: null };
  }
}

/**
 * Main import function
 */
async function importALPK2Products() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ALPK2 Product Import Script');
  console.log('═══════════════════════════════════════════════════════════\n');

  const stats = {
    total: ALPK2_PRODUCTS.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get or create ALPK2 manufacturer
    console.log('→ Setting up ALPK2 manufacturer...');
    const manufacturer = await getALPK2Manufacturer();
    console.log(`   ID: ${manufacturer._id}\n`);

    // Get available categories
    console.log('→ Available categories:');
    const categories = await Category.find({ isActive: true })
      .select('name')
      .sort({ name: 1 })
      .lean();
    categories.forEach(cat => console.log(`   - ${cat.name}`));
    console.log('');

    // Import products
    console.log(`→ Importing ${stats.total} product(s)...\n`);
    console.log('─'.repeat(60));

    for (const productData of ALPK2_PRODUCTS) {
      const result = await importProduct(productData, manufacturer);
      
      if (result.success) {
        stats.success++;
      } else if (result.reason === 'duplicate') {
        stats.skipped++;
      } else {
        stats.failed++;
        stats.errors.push({
          product: productData.name,
          error: result.reason,
        });
      }

      // Add delay to avoid rate limiting on Cloudinary
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print summary
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 Import Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total products:      ${stats.total}`);
    console.log(`   ✓ Successfully added: ${stats.success}`);
    console.log(`   ⊘ Skipped (existing): ${stats.skipped}`);
    console.log(`   ✗ Failed:             ${stats.failed}`);
    console.log('─'.repeat(60));

    // Print errors if any
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:\n');
      stats.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.product}`);
        console.log(`      Error: ${err.error}\n`);
      });
    }

    // Print next steps
    if (stats.success > 0) {
      console.log('\n✅ Next Steps:\n');
      console.log('   1. Verify products in Admin Dashboard');
      console.log('   2. Check product images and descriptions');
      console.log('   3. Update stock levels if needed');
      console.log('   4. Set featured products if desired');
      console.log('   5. Review and adjust pricing\n');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
}

// Run import
if (require.main === module) {
  importALPK2Products().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { importALPK2Products, ALPK2_PRODUCTS };
