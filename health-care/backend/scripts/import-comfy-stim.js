/**
 * Import Script: Comfy Stim 806 Plus Digital TENS Machine
 * 
 * This script imports the Comfy Stim TENS machine product from GoWell BD
 * into the MediportBD database with complete product information.
 * 
 * Usage: node scripts/import-comfy-stim.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');

async function importComfyStim() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Find or Create "Go Well" Brand
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📦 Step 1: Setting up Go Well brand...');
    let goWell = await Manufacturer.findOne({ name: "Go Well" });
    
    if (!goWell) {
      goWell = await Manufacturer.create({
        name: "Go Well",
        description: "Go Well BD is a leading medical equipment supplier in Bangladesh, specializing in physiotherapy equipment, diagnostic devices, and home healthcare products.",
        country: "Bangladesh",
        website: "https://gowellbd.com",
        isActive: true
      });
      console.log('   ✅ Created new Go Well brand');
      console.log('   Brand ID:', goWell._id);
    } else {
      console.log('   ✓ Go Well brand already exists');
      console.log('   Brand ID:', goWell._id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Find or Create "Physiotherapy Equipment" Category
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📁 Step 2: Setting up Physiotherapy Equipment category...');
    let physioCategory = await Category.findOne({ name: "Physiotherapy Equipment" });
    
    if (!physioCategory) {
      physioCategory = await Category.create({
        name: "Physiotherapy Equipment",
        description: "Professional physiotherapy equipment for pain relief, muscle recovery, and rehabilitation therapy. Includes TENS machines, EMS devices, and therapeutic equipment.",
        isActive: true,
        displayOrder: 50,
        b2bDiscountEnabled: true,
        b2bDiscountPct: 10,
        seo: {
          metaTitle: "Physiotherapy Equipment Bangladesh — Buy Online | MediportBD",
          metaDescription: "Buy professional physiotherapy equipment in Bangladesh. TENS machines, EMS devices, rehabilitation tools. Authentic products, best prices. Free delivery in Dhaka.",
          keywords: ["physiotherapy equipment Bangladesh", "TENS machine BD", "EMS device Bangladesh", "rehabilitation equipment"]
        }
      });
      console.log('   ✅ Created new Physiotherapy Equipment category');
      console.log('   Category ID:', physioCategory._id);
    } else {
      console.log('   ✓ Physiotherapy Equipment category already exists');
      console.log('   Category ID:', physioCategory._id);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Check if Product Already Exists
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🔍 Step 3: Checking if product already exists...');
    const existingProduct = await Product.findOne({ sku: "COMFY-STIM-806-PLUS" });
    
    if (existingProduct) {
      console.log('   ⚠️  Product already exists!');
      console.log('   Product ID:', existingProduct._id);
      console.log('   Product Name:', existingProduct.name);
      console.log('   Slug:', existingProduct.slug);
      console.log('\n   Skipping import to avoid duplicates.');
      console.log('   If you want to update, delete the existing product first.');
      process.exit(0);
    } else {
      console.log('   ✓ Product does not exist, proceeding with import...');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Create Product with Complete Data
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🛍️  Step 4: Creating Comfy Stim product...');
    
    const productData = {
      // Basic Information
      sku: "COMFY-STIM-806-PLUS",
      name: "Comfy Stim 806 Plus Digital TENS Machine & Electro-Stimulator",
      
      // Description
      description: `The Comfy Stim Plus Digital TENS Machine & Electro-Stimulator by Go Well is an advanced device designed to offer safe, non-invasive pain relief and effective muscle stimulation. Combining both TENS (Transcutaneous Electrical Nerve Stimulation) and EMS (Electrical Muscle Stimulation) technology, this device is ideal for individuals experiencing chronic pain, muscle soreness, or those looking for improved muscle strength and recovery.

Key Features:
• Dual Functionality – TENS mode blocks pain signals for chronic pain management (back pain, arthritis, sciatica), while EMS mode stimulates muscle contraction for strength and recovery
• Multiple Modes and Adjustable Intensities – Pre-set therapy modes with customizable intensity settings for different pain types and comfort levels
• Portable and Compact Design – Lightweight, travel-friendly device for use at home, office, or on the go
• Digital Display and User-Friendly Controls – Clear LCD screen showing current mode, intensity, and timer with easy-to-use buttons
• Safety Features – Automatic shut-off to prevent overstimulation, durable skin-safe materials

Perfect for athletes, office workers with muscle tension, individuals with chronic pain, physical rehabilitation patients, and elderly with arthritis.`,
      
      // References
      brand: goWell._id,
      category: physioCategory._id,
      subcategory: "TENS Machine",
      
      // Pricing
      price: 5860,
      oldPrice: null,
      discountPct: 0,
      
      // Inventory
      stock: 50,
      lowStockThreshold: 10,
      unit: "piece",
      minOrderQty: 1,
      
      // Images (using direct URLs from GoWell BD)
      images: [
        {
          url: "https://gowellbd.com/wp-content/uploads/2026/04/311-scaled.jpg",
          publicId: "",
          isPrimary: true,
          alt: "Comfy Stim 806 Plus Digital TENS Machine front view — pain relief device Bangladesh"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1589-scaled.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim 806 Plus display screen showing therapy settings and controls"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1586-rotated.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim TENS machine with electrode pads attached for muscle stimulation"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1583-rotated.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim controls and interface detailed view Bangladesh"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1578-rotated.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim complete package with all accessories included"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1572-scaled.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim device packaging and product shot Bangladesh"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1571-scaled.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim electro-stimulator side angle view"
        },
        {
          url: "https://gowellbd.com/wp-content/uploads/2024/09/IMG_1555-scaled.jpg",
          publicId: "",
          isPrimary: false,
          alt: "Comfy Stim TENS EMS machine professional product photography Bangladesh"
        }
      ],
      
      // Technical Specifications
      specifications: new Map([
        ["Product Name", "Comfy Stim Plus Digital TENS Machine & Electro-Stimulator"],
        ["Model Number", "806 Plus"],
        ["Technology", "TENS (Transcutaneous Electrical Nerve Stimulation) and EMS (Electrical Muscle Stimulation)"],
        ["Display Type", "Digital LCD Screen"],
        ["Power Source", "9-Volt Battery"],
        ["Therapy Modes", "Multiple pre-set modes with adjustable intensity"],
        ["Intensity Levels", "Adjustable"],
        ["Timer Function", "Yes, programmable"],
        ["Safety Features", "Automatic shut-off to prevent overstimulation"],
        ["Design", "Portable and compact"],
        ["Usage", "Home or clinical use"],
        ["Materials", "Durable, skin-safe materials"],
        ["Weight", "Lightweight (approximately 150-200g)"],
        ["Dimensions", "Compact handheld size"],
        ["Warranty", "Manufacturer warranty available"],
        ["Country of Origin", "China"],
        ["Certifications", "CE Certified"]
      ]),
      
      // Certifications
      certifications: ["CE Certified"],
      
      // Storage & Safety
      storageTemp: "room",
      hazardClass: "safe",
      
      // SEO Tags
      tags: [
        "TENS Machine",
        "EMS Device",
        "Pain Relief",
        "Muscle Stimulation",
        "Digital Display",
        "Portable",
        "Home Use",
        "Clinical Use",
        "Adjustable Intensity",
        "9V Battery",
        "Auto Shutoff",
        "Physiotherapy",
        "Chronic Pain Relief",
        "Muscle Recovery",
        "Bangladesh",
        "Go Well",
        "Electro Stimulator",
        "Back Pain Relief",
        "Arthritis Treatment",
        "Sciatica Relief",
        "Physical Therapy",
        "Rehabilitation",
        "Sports Recovery",
        "Therapeutic Device"
      ],
      
      // Compatible With / Target Audience
      compatibleWith: [
        "Athletes and Fitness Enthusiasts",
        "Office Workers with Muscle Tension",
        "Individuals with Chronic Pain",
        "Physical Rehabilitation Patients",
        "Elderly with Arthritis",
        "Physiotherapy Clinics",
        "Home Healthcare Users",
        "Sports Medicine Facilities"
      ],
      
      // Product Status
      isActive: true,
      isFeatured: false,
      badge: null,
      
      // Initial Stats
      soldCount: 0,
      viewCount: 0,
      rating: {
        average: 0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    };

    const product = await Product.create(productData);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: Success Summary
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(70));
    console.log('✅ PRODUCT IMPORTED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log('\n📊 Product Details:');
    console.log('   Product ID:', product._id);
    console.log('   SKU:', product.sku);
    console.log('   Name:', product.name);
    console.log('   Slug:', product.slug);
    console.log('   Price: ৳' + product.price.toLocaleString());
    console.log('   Stock:', product.stock, 'units');
    console.log('   Brand:', goWell.name, `(${goWell._id})`);
    console.log('   Category:', physioCategory.name, `(${physioCategory._id})`);
    console.log('   Images:', product.images.length, 'images uploaded');
    console.log('   Specifications:', product.specifications.size, 'specifications');
    console.log('   Tags:', product.tags.length, 'tags');
    
    console.log('\n🌐 View Product:');
    console.log('   Frontend URL: https://www.mediportbd.com/products/' + product.slug);
    console.log('   Admin URL: https://www.mediportbd.com/admin/products/' + product._id);
    
    console.log('\n✅ Next Steps:');
    console.log('   1. Visit the product page to verify all details');
    console.log('   2. Test "Add to Cart" functionality');
    console.log('   3. Check product appears in Physiotherapy Equipment category');
    console.log('   4. Verify all 8 images load correctly');
    console.log('   5. Consider featuring this product on homepage');
    console.log('   6. Update stock quantity if needed via admin panel');
    console.log('   7. Add to featured products if desired');
    
    console.log('\n' + '═'.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR IMPORTING PRODUCT:', error.message);
    
    if (error.code === 11000) {
      console.error('\n   Duplicate key error. The product might already exist.');
      console.error('   Check for existing products with the same SKU or slug.');
    } else if (error.name === 'ValidationError') {
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
    console.log('\n🔌 Database connection closed');
  }
}

// Run the import
importComfyStim();
