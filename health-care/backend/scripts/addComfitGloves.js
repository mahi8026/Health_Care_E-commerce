#!/usr/bin/env node

/**
 * Add Comfit Medical Gloves Products
 * Adds 3 Comfit glove products from Arogga.com
 * 
 * Usage: node scripts/addComfitGloves.js
 */

const mongoose = require('mongoose');
const path = require('path');
const { importProduct } = require('../src/utils/productScraper');
const logger = require('../src/utils/logger');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Product data from Arogga.com
const comfitProducts = [
  {
    name: 'Comfit Examination Gloves Medium (M) 100 pieces/box',
    sku: 'CMF-EXG-M-100',
    price: 550,
    description: `Comfit Examination Gloves are high-quality, disposable medical examination gloves designed for healthcare professionals and medical procedures. Made from premium latex material, these gloves provide excellent tactile sensitivity and dexterity for precise medical examinations and procedures.

Key Features:
• Size: Medium (M)
• Quantity: 100 pieces per box
• Material: Natural rubber latex
• Powder-free for reduced allergen risk
• Ambidextrous design fits both hands
• Textured fingertips for enhanced grip
• High tensile strength and durability
• Compliant with international quality standards
• Ideal for medical examinations, diagnostics, and general healthcare use

Applications:
• Medical examinations and diagnostics
• Laboratory work and specimen handling
• Dental procedures
• First aid and emergency care
• General healthcare protection
• Patient care and nursing

Quality Standards:
• CE certified for medical use
• Meets ASTM D3578 international standards
• DGDA registered medical device
• Quality tested for strength and barrier protection

Storage: Store in cool, dry place away from direct sunlight and heat sources.`,
    brand: 'Comfit',
    category: 'PPE & Safety',
    subcategory: 'Medical Gloves',
    stock: 150,
    unit: 'box',
    minOrderQty: 1,
    images: [
      'https://res.cloudinary.com/mediport/image/upload/v1/Mediport/products/comfit-examination-gloves-medium',
    ],
    specifications: {
      'Product Type': 'Examination Gloves',
      'Material': 'Natural Rubber Latex',
      'Size': 'Medium (M)',
      'Quantity': '100 pieces per box',
      'Surface': 'Textured fingertips',
      'Design': 'Ambidextrous',
      'Powder': 'Powder-free',
      'Color': 'Natural',
      'Cuff Length': 'Standard',
      'Thickness': 'Standard medical grade',
      'Sterility': 'Non-sterile',
      'Origin': 'Bangladesh',
    },
    certifications: ['CE Certified', 'DGDA Registered', 'ASTM D3578'],
    tags: ['examination gloves', 'latex gloves', 'medical gloves', 'comfit', 'disposable gloves', 'powder-free', 'medium size', 'healthcare', 'ppe'],
    badge: 'bestseller',
  },
  {
    name: 'Comfit Examination Gloves Large (L) 100 pieces/box',
    sku: 'CMF-EXG-L-100',
    price: 550,
    description: `Comfit Examination Gloves in Large size are premium disposable medical gloves designed for healthcare professionals with larger hands. Made from high-quality latex material, these gloves offer superior comfort, fit, and protection during medical examinations and procedures.

Key Features:
• Size: Large (L)
• Quantity: 100 pieces per box
• Material: Natural rubber latex
• Powder-free formulation
• Ambidextrous design for universal fit
• Textured surface for superior grip
• Excellent tactile sensitivity
• High durability and tear resistance
• Meets international medical standards
• Perfect for extended wear comfort

Applications:
• Medical examinations and patient care
• Surgical assistance and minor procedures
• Laboratory diagnostics and testing
• Dental treatments and oral examinations
• Emergency medical services
• Clinical diagnostics and specimen handling

Quality Standards:
• CE certified medical device
• Complies with ASTM D3578 standards
• DGDA registered in Bangladesh
• Tested for puncture resistance and strength
• Allergen-reduced powder-free formula

Storage Instructions: Keep in a cool, dry environment away from direct sunlight and extreme temperatures.`,
    brand: 'Comfit',
    category: 'PPE & Safety',
    subcategory: 'Medical Gloves',
    stock: 120,
    unit: 'box',
    minOrderQty: 1,
    images: [
      'https://res.cloudinary.com/mediport/image/upload/v1/Mediport/products/comfit-examination-gloves-large',
    ],
    specifications: {
      'Product Type': 'Examination Gloves',
      'Material': 'Natural Rubber Latex',
      'Size': 'Large (L)',
      'Quantity': '100 pieces per box',
      'Surface': 'Textured',
      'Design': 'Ambidextrous',
      'Powder': 'Powder-free',
      'Color': 'Natural',
      'Cuff Length': 'Standard',
      'Thickness': 'Medical grade',
      'Sterility': 'Non-sterile',
      'Origin': 'Bangladesh',
    },
    certifications: ['CE Certified', 'DGDA Registered', 'ASTM D3578'],
    tags: ['examination gloves', 'latex gloves', 'medical gloves', 'comfit', 'large size', 'disposable', 'powder-free', 'healthcare', 'ppe'],
    badge: 'bestseller',
  },
  {
    name: 'Comfit Surgical Hand Gloves 1 pair',
    sku: 'CMF-SRG-1PR',
    price: 120,
    description: `Comfit Surgical Hand Gloves are premium sterile gloves designed specifically for surgical procedures and invasive medical interventions. Manufactured to the highest quality standards, these gloves provide superior barrier protection, comfort, and tactile sensitivity required in operating rooms and surgical environments.

Key Features:
• Sterile surgical gloves
• Sold as 1 pair (2 gloves)
• Premium natural rubber latex material
• Powder-free for reduced contamination risk
• Anatomically designed for left and right hands
• Enhanced grip with micro-textured surface
• Extended cuff for additional wrist protection
• Superior puncture and tear resistance
• Excellent tactile sensitivity for precision work
• Triple-tested quality assurance

Applications:
• Major and minor surgical procedures
• Invasive diagnostic procedures
• Sterile wound care and dressing changes
• Catheterization and vascular access procedures
• Labor and delivery procedures
• Interventional radiology procedures
• Operating room sterile environments

Quality Standards:
• CE certified for surgical use
• Meets ASTM D3577 surgical glove standards
• DGDA registered medical device
• Gamma-sterilized for surgical safety
• EN 455 compliant (European standard)
• FDA equivalent quality standards

Sizing: Available in multiple sizes - please verify size before ordering. This listing is for one pair (not sized).

Storage: Store in original sterile packaging until use. Keep in cool, dry conditions away from sunlight and ozone-generating equipment.

Caution: Single-use only. Check for defects before use. Latex may cause allergic reactions in sensitive individuals.`,
    brand: 'Comfit',
    category: 'PPE & Safety',
    subcategory: 'Surgical Gloves',
    stock: 200,
    unit: 'pair',
    minOrderQty: 1,
    images: [
      'https://res.cloudinary.com/mediport/image/upload/v1/Mediport/products/comfit-surgical-gloves',
    ],
    specifications: {
      'Product Type': 'Surgical Gloves',
      'Material': 'Natural Rubber Latex',
      'Quantity': '1 pair (2 gloves)',
      'Surface': 'Micro-textured for enhanced grip',
      'Design': 'Anatomical (left/right specific)',
      'Powder': 'Powder-free',
      'Color': 'Natural/White',
      'Cuff Length': 'Extended surgical cuff',
      'Thickness': 'Surgical grade premium',
      'Sterility': 'Sterile (Gamma sterilized)',
      'Shelf Life': '5 years from manufacturing',
      'Origin': 'Bangladesh',
    },
    certifications: ['CE Certified', 'DGDA Registered', 'ASTM D3577', 'EN 455', 'ISO 13485'],
    tags: ['surgical gloves', 'sterile gloves', 'latex gloves', 'comfit', 'operating room', 'surgery', 'medical gloves', 'powder-free', 'ppe'],
    badge: 'ce_certified',
    storageTemp: 'room',
    hazardClass: 'safe',
  },
];

async function addComfitGloves() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│         Add Comfit Medical Gloves Products                 │
└────────────────────────────────────────────────────────────┘
  `);

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`📦 Preparing to import ${comfitProducts.length} Comfit glove products\n`);

    const results = {
      total: comfitProducts.length,
      success: 0,
      failed: 0,
      skipped: 0,
      products: [],
      errors: [],
    };

    // Import each product
    for (let i = 0; i < comfitProducts.length; i++) {
      const productData = comfitProducts[i];
      
      try {
        console.log(`[${i + 1}/${comfitProducts.length}] Processing: ${productData.name}...`);

        const importResult = await importProduct(productData, {
          brandName: productData.brand,
          categoryName: productData.category,
          uploadImages: false, // Images are already Cloudinary URLs
          skipExisting: true,
        });

        if (importResult.success) {
          results.success++;
          results.products.push(importResult.product);
          console.log(`  ✅ Imported successfully (৳${productData.price})`);
        } else if (importResult.reason === 'already_exists') {
          results.skipped++;
          console.log(`  ⏭️  Skipped (already exists)`);
        } else {
          results.failed++;
          results.errors.push({
            product: productData.name,
            error: importResult.reason,
          });
          console.log(`  ❌ Failed: ${importResult.reason}`);
        }

        // Small delay between imports
        await new Promise((resolve) => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          product: productData.name,
          error: error.message,
        });
      }
    }

    // Display results
    console.log('\n┌────────────────────────────────────────────────────────────┐');
    console.log('│                    IMPORT RESULTS                          │');
    console.log('└────────────────────────────────────────────────────────────┘\n');
    console.log(`  Total Products:  ${results.total}`);
    console.log(`  ✅ Imported:     ${results.success}`);
    console.log(`  ⏭️  Skipped:      ${results.skipped} (already exist)`);
    console.log(`  ❌ Failed:       ${results.failed}`);
    console.log('');

    if (results.success > 0) {
      console.log('Successfully imported products:');
      results.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (৳${product.price?.toLocaleString()})`);
      });
      console.log('');
    }

    if (results.errors.length > 0) {
      console.log('Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.product}: ${error.error}`);
      });
      console.log('');
    }

    console.log('✅ Import complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    logger.error('Comfit gloves import failed', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user. Cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the import
addComfitGloves();
