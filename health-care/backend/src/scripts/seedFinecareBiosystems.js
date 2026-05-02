require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');

/**
 * Seed Finecare Biosystems Products
 * Real Bangladesh distributor price list
 * Usage: node src/scripts/seedFinecareBiosystems.js
 */

// Finecare Analyzer Reagents - Real Bangladesh Prices
const finecareProducts = [
  {
    "name": "Finecare TSH Rapid Quantitative Test",
    "brand": "Finecare",
    "category": "Laboratory Reagents",
    "sku": "FC-TSH-25T",
    "description": "Rapid fluorescence immunoassay test for Thyroid Stimulating Hormone (TSH) quantitative detection. For use with Finecare FIA Meter series analyzers. Results in 15 minutes.",
    "specifications": {
      "Test Parameter": "TSH (Thyroid Stimulating Hormone)",
      "Panel": "Thyroid Function",
      "Pack Size": "25 Tests",
      "Sample Type": "Whole blood, serum, plasma",
      "Result Time": "15 minutes",
      "Storage": "2-8°C",
      "Shelf Life": "18 months",
      "Analyzer Compatibility": "Finecare FIA Meter, Finecare Plus"
    },
    "certifications": ["CE IVD", "NMPA"],
    "price": 3250,
    "b2bPrice": 3250,
    "mrpPerTest": 170,
    "distributorPricePerTest": 130,
    "currency": "BDT",
    "priceUnit": "per pack (25 tests)",
    "stock": 20,
    "minOrderQty": 1,
    "unit": "pack",
    "tags": ["TSH", "thyroid", "finecare", "rapid test", "immunoassay", "FIA"],
    "isActive": true,
    "isFeatured": true
  },
  {
    "name": "Finecare T3 Rapid Quantitative Test",
    "brand": "Finecare",
    "category": "Laboratory Reagents",
    "sku": "FC-T3-25T",
    "description": "Rapid fluorescence immunoassay test for Triiodothyronine (T3) quantitative detection. Part of complete thyroid function testing panel.",
    "specifications": {
      "Test Parameter": "T3 (Triiodothyronine)",
      "Panel": "Thyroid Function",
      "Pack Size": "25 Tests",
      "Sample Type": "Whole blood, serum, plasma",
      "Result Time": "15 minutes",
      "Storage": "2-8°C",
      "Analyzer Compatibility": "Finecare FIA Meter series"
    },
    "certifications": ["CE IVD", "NMPA"],
    "price": 3500,
    "b2bPrice": 3500,
    "mrpPerTest": 180,
    "distributorPricePerTest": 140,
    "currency": "BDT",
    "priceUnit": "per pack (25 tests)",
    "stock": 15,
    "minOrderQty": 1,
    "unit": "pack",
    "tags": ["T3", "thyroid", "finecare", "rapid test", "FIA"],
    "isActive": true,
    "isFeatured": false
  },
  {
    "name": "Finecare T4 Rapid Quantitative Test",
    "brand": "Finecare",
    "category": "Laboratory Reagents",
    "sku": "FC-T4-25T",
    "description": "Rapid fluorescence immunoassay for Thyroxine (T4) quantitative detection.",
    "specifications": {
      "Test Parameter": "T4 (Thyroxine)",
      "Panel": "Thyroid Function",
      "Pack Size": "25 Tests",
      "Sample Type": "Whole blood, serum, plasma",
      "Result Time": "15 minutes",
      "Storage": "2-8°C",
      "Analyzer Compatibility": "Finecare FIA Meter series"
    },
    "certifications": ["CE IVD", "NMPA"],
    "price": 3500,
    "b2bPrice": 3500,
    "mrpPerTest": 180,
    "distributorPricePerTest": 140,
    "currency": "BDT",
    "priceUnit": "per pack (25 tests)",
    "stock": 15,
    "minOrderQty": 1,
    "unit": "pack",
    "tags": ["T4", "thyroxine", "thyroid", "finecare"],
    "isActive": true,
    "isFeatured": false
  },
  {
    "name": "Finecare FT3 Rapid Quantitative Test",
    "brand": "Finecare",
    "category": "Laboratory Reagents",
    "sku": "FC-FT3-25T",
    "description": "Rapid fluorescence immunoassay for Free Triiodothyronine (FT3) quantitative detection.",
    "specifications": {
      "Test Parameter": "FT3 (Free T3)",
      "Panel": "Thyroid Function",
      "Pack Size": "25 Tests",
      "Sample Type": "Whole blood, serum, plasma",
      "Result Time": "15 minutes",
      "Storage": "2-8°C",
      "Analyzer Compatibility": "Finecare FIA Meter series"
    },
    "certifications": ["CE IVD", "NMPA"],
    "price": 4250,
    "b2bPrice": 4250,
    "mrpPerTest": 230,
    "distributorPricePerTest": 170,
    "currency": "BDT",
    "priceUnit": "per pack (25 tests)",
    "stock": 15,
    "minOrderQty": 1,
    "unit": "pack",
    "tags": ["FT3", "free T3", "thyroid", "finecare"],
    "isActive": true,
    "isFeatured": false
  },
  {
    "name": "Finecare Vitamin B12 Rapid Quantitative Test",
    "brand": "Finecare",
    "category": "Laboratory Reagents",
    "sku": "FC-VITB12-25T",
    "description": "Rapid quantitative Vitamin B12 (Cobalamin) test. Common deficiency in Bangladesh due to dietary patterns.",
    "specifications": {
      "Test Parameter": "Vitamin B12 (Cobalamin)",
      "Panel": "Others",
      "Pack Size": "25 Tests",
      "Sample Type": "Whole blood, serum, plasma",
      "Result Time": "15 minutes",
      "Clinical Use": "B12 deficiency, neurological symptoms, anemia",
      "Storage": "2-8°C",
      "Analyzer Compatibility": "Finecare FIA Meter series"
    },
    "certifications": ["CE IVD", "NMPA"],
    "price": 9000,
    "b2bPrice": 9000,
    "mrpPerTest": 380,
    "distributorPricePerTest": 360,
    "currency": "BDT",
    "priceUnit": "per pack (25 tests)",
    "stock": 15,
    "minOrderQty": 1,
    "unit": "pack",
    "tags": ["Vitamin B12", "cobalamin", "deficiency", "anemia", "finecare"],
    "isActive": true,
    "isFeatured": false
  }
];

// Statistics
let stats = {
  added: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Find or create manufacturer
 */
async function findOrCreateManufacturer(brandName) {
  try {
    let manufacturer = await Manufacturer.findOne({ 
      name: { $regex: new RegExp(`^${brandName}$`, 'i') } 
    });

    if (!manufacturer) {
      manufacturer = await Manufacturer.create({
        name: brandName,
        description: `${brandName} - Medical equipment and reagents manufacturer`,
        country: 'China',
        isActive: true
      });
      console.log(`   🏭 Created brand: ${brandName}`);
    }

    return manufacturer;
  } catch (error) {
    console.error(`   ❌ Error with brand ${brandName}:`, error.message);
    throw error;
  }
}

/**
 * Find or create category
 */
async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ 
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
    });

    if (!category) {
      // Create slug from category name
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      
      category = await Category.create({
        name: categoryName,
        slug: slug,
        description: `${categoryName} products and supplies`,
        isActive: true
      });
      console.log(`   📁 Created category: ${categoryName}`);
    }

    return category;
  } catch (error) {
    console.error(`   ❌ Error with category ${categoryName}:`, error.message);
    throw error;
  }
}

/**
 * Process and insert products
 */
async function seedProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     FINECARE BIOSYSTEMS - BANGLADESH DISTRIBUTOR PRICES    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📦 Processing ${finecareProducts.length} products...\n`);

    for (const productData of finecareProducts) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });

        if (existingProduct) {
          console.log(`⏭️  Skipped: ${productData.name} (SKU: ${productData.sku} already exists)`);
          stats.skipped++;
          continue;
        }

        // Find or create manufacturer
        const manufacturer = await findOrCreateManufacturer(productData.brand);

        // Find or create category
        const category = await findOrCreateCategory(productData.category);

        // Prepare product data
        const newProduct = {
          name: productData.name,
          sku: productData.sku,
          description: productData.description,
          brand: manufacturer._id,
          category: category._id,
          price: productData.price,
          b2bPrice: productData.b2bPrice || productData.price,
          stock: productData.stock,
          minOrderQty: productData.minOrderQty || 1,
          unit: productData.unit || 'pack',
          specifications: productData.specifications || {},
          certifications: productData.certifications || [],
          tags: productData.tags || [],
          isActive: productData.isActive !== false,
          isFeatured: productData.isFeatured || false,
          images: productData.images || []
        };

        // Add custom fields if present
        if (productData.mrpPerTest) newProduct.mrpPerTest = productData.mrpPerTest;
        if (productData.distributorPricePerTest) newProduct.distributorPricePerTest = productData.distributorPricePerTest;
        if (productData.currency) newProduct.currency = productData.currency;
        if (productData.priceUnit) newProduct.priceUnit = productData.priceUnit;

        // Create product
        await Product.create(newProduct);

        console.log(`✅ Added: ${productData.name}`);
        console.log(`   SKU: ${productData.sku}`);
        console.log(`   Price: ৳${productData.price} | B2B: ৳${productData.b2bPrice}`);
        if (productData.mrpPerTest) {
          console.log(`   Per Test - MRP: ৳${productData.mrpPerTest} | Distributor: ৳${productData.distributorPricePerTest}`);
        }
        console.log(`   Stock: ${productData.stock} ${productData.unit || 'pack'}(s)\n`);

        stats.added++;

      } catch (error) {
        console.error(`❌ Failed: ${productData.name}`);
        console.error(`   Error: ${error.message}\n`);
        stats.failed++;
        stats.errors.push({
          product: productData.name,
          sku: productData.sku,
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    IMPORT SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Added:   ${stats.added}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Failed:  ${stats.failed}`);
    console.log(`📊 Total:   ${finecareProducts.length}\n`);

    if (stats.failed > 0) {
      console.log('❌ Errors:');
      stats.errors.forEach(err => {
        console.log(`   • ${err.product} (${err.sku}): ${err.error}`);
      });
      console.log('');
    }

    // Print database stats
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalManufacturers = await Manufacturer.countDocuments();

    console.log('📊 Database Status:');
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Categories: ${totalCategories}`);
    console.log(`   Manufacturers: ${totalManufacturers}\n`);

    console.log('✅ Import completed successfully!\n');

  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed script
seedProducts();
