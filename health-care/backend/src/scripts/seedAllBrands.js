require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Import product data from JSON file
const productsData = require('./all-brands-products.json');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find or create a manufacturer by name
 */
async function findOrCreateManufacturer(brandName, country = '') {
  try {
    let manufacturer = await Manufacturer.findOne({ name: brandName });
    
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({
        name: brandName,
        country: country,
        isActive: true
      });
      logger.info(`✨ Created manufacturer: ${brandName}`);
    }
    
    return manufacturer;
  } catch (error) {
    logger.error(`Error finding/creating manufacturer ${brandName}: ${error.message}`);
    throw error;
  }
}

/**
 * Find or create category by name
 */
async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ 
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
    });
    
    if (!category) {
      category = await Category.create({
        name: categoryName,
        isActive: true,
        displayOrder: 0
      });
      logger.info(`✨ Created category: ${categoryName}`);
    }
    
    return category;
  } catch (error) {
    logger.error(`Error finding/creating category ${categoryName}: ${error.message}`);
    throw error;
  }
}

/**
 * Check if product with SKU already exists
 */
async function productExists(sku) {
  try {
    const product = await Product.findOne({ sku: sku.toUpperCase() });
    return !!product;
  } catch (error) {
    logger.error(`Error checking product existence for SKU ${sku}: ${error.message}`);
    throw error;
  }
}

/**
 * Insert a single product
 */
async function insertProduct(productData) {
  try {
    // Check if product already exists
    if (await productExists(productData.sku)) {
      return { status: 'skipped', sku: productData.sku, name: productData.name };
    }

    // Find or create manufacturer
    const manufacturer = await findOrCreateManufacturer(
      productData.brand, 
      productData.manufacturer || ''
    );

    // Find or create category
    const category = await findOrCreateCategory(productData.category);

    // Prepare product document
    const productDoc = {
      sku: productData.sku.toUpperCase(),
      name: productData.name,
      description: productData.description,
      brand: manufacturer._id,
      category: category._id,
      price: productData.price,
      stock: productData.stock || 0,
      minOrderQty: productData.minOrderQty || 1,
      specifications: productData.specifications || {},
      certifications: productData.certifications || [],
      tags: productData.tags || [],
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      isFeatured: productData.isFeatured || false,
      images: productData.images || []
    };

    // Create product
    const product = await Product.create(productDoc);
    
    return { 
      status: 'added', 
      sku: product.sku, 
      name: product.name,
      id: product._id 
    };

  } catch (error) {
    return { 
      status: 'failed', 
      sku: productData.sku, 
      name: productData.name,
      error: error.message 
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

async function seedProducts() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info('✓ Connected to MongoDB');
    logger.info(`\n🌱 Starting seed process for ${productsData.length} products...\n`);

    const results = {
      added: [],
      skipped: [],
      failed: []
    };

    // Process each product
    for (const productData of productsData) {
      const result = await insertProduct(productData);
      
      if (result.status === 'added') {
        results.added.push(result);
        console.log(`✅ Added: ${result.name} (${result.sku})`);
      } else if (result.status === 'skipped') {
        results.skipped.push(result);
        console.log(`⏭️  Skipped: ${result.name} (${result.sku}) - Already exists`);
      } else if (result.status === 'failed') {
        results.failed.push(result);
        console.log(`❌ Failed: ${result.name} (${result.sku}) - ${result.error}`);
      }
    }

    // Print summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Added:   ${results.added.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed:  ${results.failed.length}`);
    console.log('═'.repeat(70) + '\n');

    if (results.failed.length > 0) {
      console.log('Failed products:');
      results.failed.forEach(item => {
        console.log(`  - ${item.name} (${item.sku}): ${item.error}`);
      });
      console.log('');
    }

    logger.info('✓ Seed process completed');

  } catch (error) {
    logger.error(`Seed process error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('✓ Database connection closed');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN SCRIPT
// ═══════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✓ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts, insertProduct, findOrCreateManufacturer, findOrCreateCategory };
