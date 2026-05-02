require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Turbilatex Reagent + eBcare Blood Glucose Monitoring + Brand Name Vacuum Blood Collection Tube
const productsData = [
  // Turbilatex Reagents (Page 1)
  {name:"Turbilatex CRP Turbilatex",brand:"Turbilatex",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"TLX000025-CRP-TURBILATEX",description:"CRP Turbilatex reagent for C-reactive protein detection.",specifications:{"Test Parameter":"CRP","Kit Size":"2x5 ML","Storage":"2-8°C","Origin":"Taiwan"},certifications:["CE IVD"],price:4000,stock:15,minOrderQty:1,tags:["CRP","turbilatex","inflammation"],isActive:true,isFeatured:false},
  {name:"Turbilatex CRP Turbilatex",brand:"Turbilatex",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"TLX000025-CRP-TURBILATEX-2",description:"CRP Turbilatex reagent.",specifications:{"Kit Size":"2x5 ML","Origin":"Taiwan"},certifications:["CE IVD"],price:4000,stock:15,minOrderQty:1,tags:["CRP","turbilatex"],isActive:true,isFeatured:false},
  {name:"Turbilatex Ferritin Turbilatex",brand:"Turbilatex",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"TLX000025-FERRITIN-TURBILATEX",description:"Ferritin Turbilatex reagent for iron storage assessment.",specifications:{"Test Parameter":"Ferritin","Kit Size":"2x5 ML","Storage":"2-8°C","Origin":"Taiwan"},certifications:["CE IVD"],price:4600,stock:12,minOrderQty:1,tags:["ferritin","iron","turbilatex"],isActive:true,isFeatured:false},
  {name:"Turbilatex Albumin Turbilatex",brand:"Turbilatex",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"TLX000025-ALBUMIN-TURBILATEX",description:"Albumin Turbilatex reagent with calibrator.",specifications:{"Test Parameter":"Albumin","Kit Size":"2x5 ML","Storage":"2-8°C","Origin":"Taiwan"},certifications:["CE IVD"],price:4000,stock:15,minOrderQty:1,tags:["albumin","protein","turbilatex"],isActive:true,isFeatured:false},
  {name:"Turbilatex Direct Bilirubin with Calibrator",brand:"Turbilatex",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"TLX070025-DIRECT-BILI",description:"Direct Bilirubin Turbilatex reagent with calibrator.",specifications:{"Test Parameter":"Direct Bilirubin","Kit Size":"2x5 ML","Storage":"2-8°C","Origin":"Taiwan"},certifications:["CE IVD"],price:4000,stock:15,minOrderQty:1,tags:["bilirubin","liver","turbilatex"],isActive:true,isFeatured:false},
  
  // eBcare Blood Glucose Monitoring System (Page 1)
  {name:"eBcare Diabetic Machine Test Strip",brand:"eBcare",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"EBCARE-DIABETIC-MACHINE-TEST-STRIP",description:"Blood glucose test strips for eBcare diabetic machine.",specifications:{"Pack Size":"1 x 50 Test Box","Compatibility":"eBcare Diabetic Machine","Origin":"Taiwan"},certifications:["CE IVD"],price:750,stock:50,minOrderQty:1,tags:["glucose strips","diabetes","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare Diabetic Machine Test Strip K3 EDTA",brand:"eBcare",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"EBCARE-DIABETIC-K3-EDTA",description:"K3 EDTA blood glucose test strips.",specifications:{"Anticoagulant":"K3 EDTA","Pack Size":"50 Test Box","Origin":"Taiwan"},certifications:["CE IVD"],price:1200,stock:40,minOrderQty:1,tags:["glucose","K3 EDTA","eBcare"],isActive:true,isFeatured:false},
  {name:"eBcare Blood Glucose Test Strips",brand:"eBcare",manufacturer:"Taiwan",category:"Laboratory Reagents",sku:"EBCARE-BLOOD-GLUCOSE-TEST-STRIPS",description:"Standard blood glucose test strips for eBcare meters.",specifications:{"Pack Size":"50 strips","Origin":"Taiwan"},certifications:["CE IVD"],price:1200,stock:50,minOrderQty:1,tags:["glucose strips","eBcare"],isActive:true,isFeatured:false},
  
  // Brand Name Vacuum Blood Collection Tube (Page 1)
  {name:"Brand Name EDTA K2 2ml Vacuum Blood Collection Tube",brand:"Generic",manufacturer:"China",category:"Diagnostic Equipment",sku:"BRAND-EDTA-K2-2ML-100PCS",description:"EDTA K2 vacuum blood collection tube 2ml for hematology.",specifications:{"Anticoagulant":"EDTA K2","Volume":"2 mL","Pack Size":"100 Pcs","Origin":"China"},certifications:["CE IVD"],price:600,stock:50,minOrderQty:1,tags:["EDTA","blood collection","vacuum tube"],isActive:true,isFeatured:false},
  {name:"Brand Name Clot Activator 4ml Vacuum Tube",brand:"Generic",manufacturer:"China",category:"Diagnostic Equipment",sku:"BRAND-CLOT-ACT-4ML-100PCS",description:"Clot activator vacuum tube for serum collection.",specifications:{"Additive":"Clot Activator","Volume":"4 mL","Pack Size":"100 Pcs","Origin":"China"},certifications:["CE IVD"],price:600,stock:50,minOrderQty:1,tags:["clot activator","serum tube"],isActive:true,isFeatured:false},
  {name:"Brand Name Glucose 3ml Vacuum Tube",brand:"Generic",manufacturer:"China",category:"Diagnostic Equipment",sku:"BRAND-GLUCOSE-3ML-100PCS",description:"Glucose vacuum tube with fluoride for blood glucose testing.",specifications:{"Additive":"Sodium Fluoride","Volume":"3 mL","Pack Size":"100 Pcs","Origin":"China"},certifications:["CE IVD"],price:650,stock:40,minOrderQty:1,tags:["glucose tube","fluoride"],isActive:true,isFeatured:false},
  {name:"Brand Name ESR Tube Glass",brand:"Generic",manufacturer:"China",category:"Diagnostic Equipment",sku:"BRAND-ESR-GLASS-100PCS",description:"ESR glass tube for sedimentation rate testing.",specifications:{"Type":"ESR Westergren","Material":"Glass","Pack Size":"100 Pcs","Origin":"China"},certifications:["CE IVD"],price:650,stock:30,minOrderQty:1,tags:["ESR","glass tube"],isActive:true,isFeatured:false},
  {name:"Disposable Blood Collection Needle 23G",brand:"Generic",manufacturer:"China",category:"PPE & Safety",sku:"BRAND-NEEDLE-23G-100PCS",description:"Disposable blood collection needle 23G.",specifications:{"Gauge":"23G","Pack Size":"100 Pcs","Origin":"China"},certifications:["CE IVD"],price:700,stock:50,minOrderQty:1,tags:["needle","23G","blood collection"],isActive:true,isFeatured:false}
];

// Helper functions
async function findOrCreateManufacturer(brandName, country = '') {
  try {
    let manufacturer = await Manufacturer.findOne({ name: brandName });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({ name: brandName, country: country, isActive: true });
      logger.info(`✨ Created manufacturer: ${brandName}`);
    }
    return manufacturer;
  } catch (error) {
    logger.error(`Error finding/creating manufacturer ${brandName}: ${error.message}`);
    throw error;
  }
}

async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
    if (!category) {
      category = await Category.create({ name: categoryName, isActive: true, displayOrder: 0 });
      logger.info(`✨ Created category: ${categoryName}`);
    }
    return category;
  } catch (error) {
    logger.error(`Error finding/creating category ${categoryName}: ${error.message}`);
    throw error;
  }
}

async function productExists(sku) {
  try {
    const product = await Product.findOne({ sku: sku.toUpperCase() });
    return !!product;
  } catch (error) {
    logger.error(`Error checking product existence for SKU ${sku}: ${error.message}`);
    throw error;
  }
}

async function insertProduct(productData) {
  try {
    if (await productExists(productData.sku)) {
      return { status: 'skipped', sku: productData.sku, name: productData.name };
    }
    const manufacturer = await findOrCreateManufacturer(productData.brand, productData.manufacturer || '');
    const category = await findOrCreateCategory(productData.category);
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
    const product = await Product.create(productDoc);
    return { status: 'added', sku: product.sku, name: product.name, id: product._id };
  } catch (error) {
    return { status: 'failed', sku: productData.sku, name: productData.name, error: error.message };
  }
}

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
    logger.info('✓ Connected to MongoDB');
    logger.info(`\n🌱 Starting seed process for ${productsData.length} products...\n`);
    const results = { added: [], skipped: [], failed: [] };
    for (const productData of productsData) {
      const result = await insertProduct(productData);
      if (result.status === 'added') {
        results.added.push(result);
        console.log(`✅ Added: ${result.name} (${result.sku})`);
      } else if (result.status === 'skipped') {
        results.skipped.push(result);
        console.log(`⏭️  Skipped: ${result.name} (${result.sku})`);
      } else if (result.status === 'failed') {
        results.failed.push(result);
        console.log(`❌ Failed: ${result.name} (${result.sku}) - ${result.error}`);
      }
    }
    console.log('\n' + '═'.repeat(70));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Added:   ${results.added.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed:  ${results.failed.length}`);
    console.log('═'.repeat(70) + '\n');
    if (results.failed.length > 0) {
      console.log('Failed products:');
      results.failed.forEach(item => console.log(`  - ${item.name} (${item.sku}): ${item.error}`));
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

if (require.main === module) {
  seedProducts().then(() => { console.log('✓ Script completed'); process.exit(0); }).catch((error) => { console.error('✗ Failed:', error); process.exit(1); });
}

module.exports = { seedProducts };
