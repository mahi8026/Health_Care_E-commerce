/**
 * Script to add Secure brand blood collection tubes to the database
 * Run with: node src/scripts/addSecureBloodTubes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Manufacturer = require('../models/Manufacturer');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product data for Secure blood collection tubes
const secureBloodTubes = [
  // 1. PT Tube (Prothrombin Time / Coagulation Tube)
  {
    sku: 'SEC-PT-2.7ML',
    name: 'Secure Sodium Citrate Vacuum Blood Collection Tube (PT Tube) - 2.7mL',
    description: 'Secure PT tube with light blue cap for prothrombin time (PT), APTT, INR, and coagulation studies. Contains 3.2% sodium citrate with precise 9:1 blood-to-anticoagulant ratio. ISO 13485 certified, DGDA registered. Compatible with automated coagulation analyzers.',
    subcategory: 'Blood Collection Tubes',
    price: 14, // Placeholder price - to be updated
    b2bPrice: 11,
    b2bPriceEnabled: true,
    stock: 1000,
    lowStockThreshold: 100,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-pt-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure PT Tube 2.7mL - Light Blue Cap - Coagulation Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '2.7 mL',
      'Additive': '3.2% (0.109M) Sodium Citrate',
      'Blood to Additive Ratio': '9:1',
      'Cap Color': 'Light Blue',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['PT tube', 'coagulation', 'sodium citrate', 'INR', 'APTT', 'blood test'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 2. K3EDTA Tube - 3mL
  {
    sku: 'SEC-K3EDTA-3ML',
    name: 'Secure K3EDTA Vacuum Blood Collection Tube - 3mL',
    description: 'Secure K3EDTA tube with purple/lavender cap for complete blood count (CBC), hemoglobin, WBC, RBC, platelet count, and hematology testing. Contains tripotassium EDTA spray-dried coating. ISO 13485 certified, DGDA registered. Compatible with automated hematology analyzers.',
    subcategory: 'Blood Collection Tubes',
    price: 10, // Placeholder price
    b2bPrice: 8,
    b2bPriceEnabled: true,
    stock: 2000,
    lowStockThreshold: 200,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-k3edta-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure K3EDTA Tube 3mL - Purple Cap - CBC Hematology Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '3 mL',
      'Additive': 'K3EDTA (1.5-2.2 mg/mL)',
      'Cap Color': 'Purple / Lavender',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C',
      'Mixing': 'Invert 8-10 times after collection'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['K3EDTA', 'CBC', 'hematology', 'purple top', 'blood count', 'WBC', 'RBC'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 3. K3EDTA Tube - 5mL
  {
    sku: 'SEC-K3EDTA-5ML',
    name: 'Secure K3EDTA Vacuum Blood Collection Tube - 5mL',
    description: 'Secure K3EDTA tube 5mL with purple/lavender cap for complete blood count (CBC) and hematology testing. Larger volume for multiple tests. Contains tripotassium EDTA. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 12, // Placeholder price
    b2bPrice: 9.5,
    b2bPriceEnabled: true,
    stock: 1500,
    lowStockThreshold: 150,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-k3edta-5ml-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure K3EDTA Tube 5mL - Purple Cap - CBC Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '5 mL',
      'Additive': 'K3EDTA (1.5-2.2 mg/mL)',
      'Cap Color': 'Purple / Lavender',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['K3EDTA', 'CBC', 'hematology', 'purple top', '5ml'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 4. ESR Tube Short - 2mL
  {
    sku: 'SEC-ESR-SHORT-2ML',
    name: 'Secure ESR Vacuum Blood Collection Tube (Short) - 2mL',
    description: 'Secure ESR short tube with black cap for Erythrocyte Sedimentation Rate testing. Contains 3.2% sodium citrate with 4:1 blood-to-anticoagulant ratio. Suitable for automated ESR analyzers. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 12, // Placeholder price
    b2bPrice: 9.5,
    b2bPriceEnabled: true,
    stock: 800,
    lowStockThreshold: 80,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-esr-short-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure ESR Short Tube 2mL - Black Cap - ESR Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '2 mL',
      'Additive': '3.2% (0.109M) Sodium Citrate',
      'Blood to Additive Ratio': '4:1',
      'Cap Color': 'Black',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C',
      'Test Method': 'Westergren method'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['ESR', 'sedimentation rate', 'black top', 'Westergren'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 5. ESR Tube Long - 5mL
  {
    sku: 'SEC-ESR-LONG-5ML',
    name: 'Secure ESR Vacuum Blood Collection Tube (Long) - 5mL',
    description: 'Secure ESR long tube with black cap for standard Erythrocyte Sedimentation Rate testing using Westergren method. Contains 3.2% sodium citrate. Graduated markings for manual reading. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 14, // Placeholder price
    b2bPrice: 11,
    b2bPriceEnabled: true,
    stock: 800,
    lowStockThreshold: 80,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-esr-long-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure ESR Long Tube 5mL - Black Cap - Westergren ESR Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '5 mL',
      'Additive': '3.2% (0.109M) Sodium Citrate',
      'Blood to Additive Ratio': '4:1',
      'Cap Color': 'Black',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C',
      'Test Method': 'Westergren method (standard)'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['ESR', 'sedimentation rate', 'black top', 'Westergren', '5ml', 'long tube'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 6. Gel & Clot Activator Tube - 5mL
  {
    sku: 'SEC-GEL-CLOT-5ML',
    name: 'Secure Gel & Clot Activator Vacuum Blood Collection Tube (SST) - 5mL',
    description: 'Secure SST tube with gold cap for clinical chemistry, biochemistry, liver function, renal function, lipid profile, and hormone assays. Contains silica clot activator and inert polymer gel separator. Fast clotting (5-30 min). ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 18, // Placeholder price
    b2bPrice: 14.5,
    b2bPriceEnabled: true,
    stock: 1500,
    lowStockThreshold: 150,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-gel-clot-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure Gel Clot Activator Tube 5mL - Gold Cap - Biochemistry Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '5 mL',
      'Additive': 'Silica Clot Activator + Gel Separator',
      'Cap Color': 'Gold / Yellow-Red',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C',
      'Clotting Time': '5-30 minutes',
      'Centrifuge': '1000-1300g for 10 minutes'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['SST', 'serum separator', 'gel tube', 'gold top', 'biochemistry', 'LFT', 'RFT'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 7. Gel & Clot Activator Tube - 3mL
  {
    sku: 'SEC-GEL-CLOT-3ML',
    name: 'Secure Gel & Clot Activator Vacuum Blood Collection Tube (SST) - 3mL',
    description: 'Secure SST tube 3mL with gold cap for clinical chemistry and biochemistry tests. Contains silica clot activator and gel separator. Smaller volume for pediatric or limited sample collection. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 16, // Placeholder price
    b2bPrice: 13,
    b2bPriceEnabled: true,
    stock: 1200,
    lowStockThreshold: 120,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-gel-clot-3ml-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure Gel Clot Activator Tube 3mL - Gold Cap - Chemistry Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '3 mL',
      'Additive': 'Silica Clot Activator + Gel Separator',
      'Cap Color': 'Gold / Yellow-Red',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['SST', 'serum separator', 'gel tube', 'gold top', '3ml', 'pediatric'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 8. Red Clot Activator Tube - 5mL
  {
    sku: 'SEC-RED-CLOT-5ML',
    name: 'Secure Clot Activator Vacuum Blood Collection Tube (Plain) - 5mL',
    description: 'Secure plain red tube with red cap for serology, immunology, blood bank, and therapeutic drug monitoring. Contains silica clot activator without gel separator. Suitable for tests where gel may interfere. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 12, // Placeholder price
    b2bPrice: 9.5,
    b2bPriceEnabled: true,
    stock: 1000,
    lowStockThreshold: 100,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-red-clot-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure Red Clot Activator Tube 5mL - Red Cap - Serology Testing Bangladesh'
      }
    ],
    specifications: {
      'Volume': '5 mL',
      'Additive': 'Silica Clot Activator (No Gel)',
      'Cap Color': 'Red',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C',
      'Clotting Time': '30 minutes at room temperature'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['red top', 'clot activator', 'plain tube', 'serology', 'blood bank', 'no gel'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  },

  // 9. Red Clot Activator Tube - 3mL
  {
    sku: 'SEC-RED-CLOT-3ML',
    name: 'Secure Clot Activator Vacuum Blood Collection Tube (Plain) - 3mL',
    description: 'Secure plain red tube 3mL with red cap for serology and immunology tests. Contains silica clot activator without gel separator. Smaller volume option. ISO 13485 certified, DGDA registered.',
    subcategory: 'Blood Collection Tubes',
    price: 11, // Placeholder price
    b2bPrice: 8.5,
    b2bPriceEnabled: true,
    stock: 900,
    lowStockThreshold: 90,
    unit: 'piece',
    minOrderQty: 1,
    images: [
      {
        url: '/images/products/secure-red-clot-3ml-tube-placeholder.jpg',
        publicId: '',
        isPrimary: true,
        alt: 'Secure Red Clot Activator Tube 3mL - Red Cap - Serology Bangladesh'
      }
    ],
    specifications: {
      'Volume': '3 mL',
      'Additive': 'Silica Clot Activator (No Gel)',
      'Cap Color': 'Red',
      'Material': 'PET Plastic',
      'Sterile': 'Yes',
      'Packaging': '100 tubes per box',
      'Shelf Life': '18 months',
      'Storage': '4-25°C'
    },
    certifications: ['ISO 13485', 'CE', 'DGDA'],
    storageTemp: 'room',
    hazardClass: 'safe',
    tags: ['red top', 'clot activator', 'plain tube', 'serology', '3ml'],
    badge: 'new',
    isActive: true,
    isFeatured: false
  }
];

// Main execution function
const addProducts = async () => {
  try {
    await connectDB();

    // 1. Find or create "Secure" manufacturer
    let secureBrand = await Manufacturer.findOne({ name: 'Secure' });
    if (!secureBrand) {
      console.log('📦 Creating Secure brand...');
      secureBrand = await Manufacturer.create({
        name: 'Secure',
        description: 'Secure brand offers high-quality vacuum blood collection tubes for clinical laboratories, diagnostic centers, and hospitals. ISO 13485 certified, DGDA registered products.',
        country: 'To be updated',
        isActive: true,
        seo: {
          metaTitle: 'Secure Blood Collection Tubes - Medical Laboratory Supplies',
          metaDescription: 'Secure brand vacuum blood collection tubes - PT, K3EDTA, ESR, gel tubes. ISO certified, DGDA registered. Available in Bangladesh.',
          keywords: ['Secure tubes', 'blood collection tubes', 'vacuum tubes', 'laboratory supplies']
        }
      });
      console.log('✅ Secure brand created');
    } else {
      console.log('✅ Secure brand found');
    }

    // 2. Find or create "Laboratory Reagents" category
    let labReagentsCategory = await Category.findOne({ name: 'Laboratory Reagents' });
    if (!labReagentsCategory) {
      console.log('📁 Creating Laboratory Reagents category...');
      labReagentsCategory = await Category.create({
        name: 'Laboratory Reagents',
        description: 'Laboratory reagents, blood collection tubes, test kits, and consumables for clinical diagnostics.',
        isActive: true,
        displayOrder: 3,
        b2bDiscountEnabled: true,
        b2bDiscountPct: 15,
        seo: {
          metaTitle: 'Laboratory Reagents Bangladesh | Buy Lab Supplies Online - MediportBD',
          metaDescription: 'Buy laboratory reagents, blood collection tubes, test kits in Bangladesh. ISO certified products. Free delivery Dhaka. Order online.',
          keywords: ['laboratory reagents', 'blood tubes', 'test kits', 'lab supplies', 'Bangladesh']
        }
      });
      console.log('✅ Laboratory Reagents category created');
    } else {
      console.log('✅ Laboratory Reagents category found');
    }

    // 3. Add all products
    console.log('\n🔄 Adding Secure blood collection tubes...\n');
    
    for (const productData of secureBloodTubes) {
      // Check if product already exists
      const existingProduct = await Product.findOne({ sku: productData.sku });
      
      if (existingProduct) {
        console.log(`⚠️  Product ${productData.sku} already exists - Skipping`);
        continue;
      }

      // Add brand and category IDs
      productData.brand = secureBrand._id;
      productData.category = labReagentsCategory._id;

      // Create product
      const product = await Product.create(productData);
      console.log(`✅ Added: ${product.name} (${product.sku})`);
    }

    console.log('\n✅ All Secure blood collection tubes added successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update product images in /health-care/public/images/products/');
    console.log('2. Update prices as needed');
    console.log('3. Update Secure brand country and website information');
    console.log('4. Verify products on website at /products or /reagent-store');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding products:', error);
    process.exit(1);
  }
};

// Run the script
addProducts();
