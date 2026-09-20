/**
 * Update Comfy Stim Brand - Change from Go Well to Comfy
 * 
 * This script updates the product brand from "Go Well" to "Comfy"
 * 
 * Usage: node scripts/update-comfy-stim-brand.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');

async function updateBrand() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Find or Create "Comfy" Brand
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📦 Step 1: Setting up Comfy brand...');
    let comfyBrand = await Manufacturer.findOne({ name: "Comfy" });
    
    if (!comfyBrand) {
      comfyBrand = await Manufacturer.create({
        name: "Comfy",
        description: "Comfy is a trusted brand for high-quality physiotherapy and rehabilitation equipment, specializing in TENS machines, EMS devices, and therapeutic products for pain relief and muscle recovery.",
        country: "China",
        isActive: true,
        seo: {
          metaTitle: "Comfy Medical Equipment — TENS & EMS Devices | MediportBD",
          metaDescription: "Shop Comfy brand physiotherapy equipment in Bangladesh. TENS machines, EMS devices for pain relief and muscle recovery. Authentic products at best prices.",
          keywords: ["Comfy TENS machine", "Comfy EMS device", "Comfy physiotherapy equipment Bangladesh"]
        }
      });
      console.log('   ✅ Created new Comfy brand');
      console.log('   Brand ID:', comfyBrand._id);
      console.log('   Slug:', comfyBrand.slug);
    } else {
      console.log('   ✓ Comfy brand already exists');
      console.log('   Brand ID:', comfyBrand._id);
      console.log('   Slug:', comfyBrand.slug);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Find the Product
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🔍 Step 2: Finding Comfy Stim product...');
    const product = await Product.findOne({ sku: "COMFY-STIM-806-PLUS" });
    
    if (!product) {
      console.error('   ❌ Product not found! SKU: COMFY-STIM-806-PLUS');
      console.log('   Make sure the product exists in the database.');
      process.exit(1);
    }
    
    console.log('   ✅ Found product:', product.name);
    console.log('   Product ID:', product._id);
    console.log('   Current Brand ID:', product.brand);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Update Product Brand
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n💾 Step 3: Updating product brand...');
    
    const oldBrandId = product.brand;
    product.brand = comfyBrand._id;
    await product.save();
    
    console.log('   ✅ Brand updated successfully!');
    console.log('   Old Brand ID:', oldBrandId);
    console.log('   New Brand ID:', comfyBrand._id);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Verify Update
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n✔️  Step 4: Verifying update...');
    const updatedProduct = await Product.findById(product._id).populate('brand');
    
    console.log('   Product:', updatedProduct.name);
    console.log('   Brand Name:', updatedProduct.brand.name);
    console.log('   Brand Slug:', updatedProduct.brand.slug);

    // ═══════════════════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(70));
    console.log('✅ BRAND UPDATE COMPLETED!');
    console.log('═'.repeat(70));
    console.log('\n📊 Summary:');
    console.log('   Product: Comfy Stim 806 Plus Digital TENS Machine');
    console.log('   Brand Changed: Go Well → Comfy');
    console.log('   Product ID:', updatedProduct._id);
    console.log('   Brand ID:', comfyBrand._id);
    
    console.log('\n🌐 View Product:');
    console.log('   Frontend: https://www.mediportbd.com/products/' + updatedProduct.slug);
    console.log('   Admin: https://www.mediportbd.com/admin/products/' + updatedProduct._id);
    console.log('   Brand Page: https://www.mediportbd.com/brands/' + comfyBrand.slug);
    
    console.log('\n✅ Next Steps:');
    console.log('   1. Refresh the product page');
    console.log('   2. Verify "Comfy" appears as manufacturer');
    console.log('   3. Check the brand page lists this product');
    console.log('   4. Clear browser cache if needed (Ctrl+F5)');
    
    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('\n   Validation error:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    } else {
      console.error('\n   Full error:', error);
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed\n');
  }
}

// Run the update
updateBrand();
