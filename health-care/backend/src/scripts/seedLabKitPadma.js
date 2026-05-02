require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// LABKIT BRAND Products from Padma Medical Co. (Page 5)
const productsData = [
  // Albumin Products
  {name:"Albumin 1x125ml (125 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-ALBUMIN-125ML-125T",description:"Albumin reagent 1x125ml for 125 tests.",specifications:{"Test Parameter":"Albumin","Pack Size":"1 X 125 ml","Number of Tests":"125","Storage":"2-8°C"},certifications:["CE IVD"],price:450,stock:20,minOrderQty:1,tags:["albumin","protein","LABKIT","Padma"],isActive:true,isFeatured:false},
  {name:"Albumin 1x50ml (50 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-ALBUMIN-50ML-50T",description:"Albumin reagent 1x50ml for 50 tests.",specifications:{"Test Parameter":"Albumin","Pack Size":"1 X 50 ml","Number of Tests":"50","Storage":"2-8°C"},certifications:["CE IVD"],price:300,stock:25,minOrderQty:1,tags:["albumin","protein","LABKIT","Padma"],isActive:true,isFeatured:false},
  {name:"Albumin CAL 1x5ml",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-ALBUMIN-CAL-5ML",description:"Albumin calibrator 1x5ml.",specifications:{"Test Parameter":"Albumin Calibrator","Pack Size":"1 X 5ml","Storage":"2-8°C"},certifications:["CE IVD"],price:350,stock:15,minOrderQty:1,tags:["albumin","calibrator","LABKIT","Padma"],isActive:true,isFeatured:false},
  
  // Bilirubin Products
  {name:"Bilirubin D-DMSO 2x125ml (250 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-BILI-D-DMSO-250T",description:"Bilirubin Direct DMSO method 2x125ml for 250 tests.",specifications:{"Test Parameter":"Bilirubin Direct","Method":"DMSO","Pack Size":"2 X 125ml","Number of Tests":"250","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:18,minOrderQty:1,tags:["bilirubin","direct","DMSO","LABKIT"],isActive:true,isFeatured:true},
  {name:"Bilirubin T-DMSO 2x125 R1 (250 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-BILI-T-DMSO-250T",description:"Bilirubin Total DMSO method 2x125ml R1 for 250 tests.",specifications:{"Test Parameter":"Bilirubin Total","Method":"DMSO","Pack Size":"2 X125 R1","Number of Tests":"250","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:18,minOrderQty:1,tags:["bilirubin","total","DMSO","LABKIT"],isActive:true,isFeatured:true},
  {name:"Bilirubin T-DMSO 1x125 R1 (125 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-BILI-T-DMSO-125T",description:"Bilirubin Total DMSO method 1x125ml R1 for 125 tests.",specifications:{"Test Parameter":"Bilirubin Total","Method":"DMSO","Pack Size":"1 X 125 R1","Number of Tests":"125","Storage":"2-8°C"},certifications:["CE IVD"],price:800,stock:20,minOrderQty:1,tags:["bilirubin","total","DMSO","LABKIT"],isActive:true,isFeatured:false},
  {name:"Bilirubin T&D-DMSO 2x125 R1 (250 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-BILI-TD-DMSO-250T",description:"Bilirubin Total & Direct DMSO method 2x125ml R1 for 250 tests.",specifications:{"Test Parameter":"Bilirubin Total & Direct","Method":"DMSO","Pack Size":"2 X 125 R1","Number of Tests":"250","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:18,minOrderQty:1,tags:["bilirubin","total","direct","DMSO","LABKIT"],isActive:true,isFeatured:true},
  {name:"Bilirubin T&D-DMSO 2x50 R1 (100 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-BILI-TD-DMSO-100T",description:"Bilirubin Total & Direct DMSO method 2x50ml R1 for 100 tests.",specifications:{"Test Parameter":"Bilirubin Total & Direct","Method":"DMSO","Pack Size":"2 X 50 R1","Number of Tests":"100","Storage":"2-8°C"},certifications:["CE IVD"],price:870,stock:20,minOrderQty:1,tags:["bilirubin","total","direct","DMSO","LABKIT"],isActive:true,isFeatured:false},
  
  // Calcium Products
  {name:"Calcium-AIII 1x125ml (125 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CALCIUM-AIII-125T",description:"Calcium Arsenazo III method 1x125ml for 125 tests.",specifications:{"Test Parameter":"Calcium","Method":"Arsenazo III","Pack Size":"1 X 125 ml","Number of Tests":"125","Storage":"2-8°C"},certifications:["CE IVD"],price:1150,stock:20,minOrderQty:1,tags:["calcium","arsenazo","electrolyte","LABKIT"],isActive:true,isFeatured:true},
  {name:"Calcium-AIII 1x50ml (50 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CALCIUM-AIII-50T",description:"Calcium Arsenazo III method 1x50ml for 50 tests.",specifications:{"Test Parameter":"Calcium","Method":"Arsenazo III","Pack Size":"1 X 50 ml","Number of Tests":"50","Storage":"2-8°C"},certifications:["CE IVD"],price:650,stock:25,minOrderQty:1,tags:["calcium","arsenazo","electrolyte","LABKIT"],isActive:true,isFeatured:false},
  {name:"Calcium-CAL 1x5 R1",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CALCIUM-CAL-5R1",description:"Calcium calibrator 1x5ml R1.",specifications:{"Test Parameter":"Calcium Calibrator","Pack Size":"1 X 5 R1","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:15,minOrderQty:1,tags:["calcium","calibrator","LABKIT"],isActive:true,isFeatured:false},
  
  // Cholesterol Products
  {name:"Cholesterol LS 1x125ml (125 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CHOL-LS-125T",description:"Cholesterol LS reagent 1x125ml for 125 tests.",specifications:{"Test Parameter":"Cholesterol","Method":"Enzymatic","Pack Size":"1 X125ml","Number of Tests":"125","Storage":"2-8°C"},certifications:["CE IVD"],price:1000,stock:20,minOrderQty:1,tags:["cholesterol","lipid","LABKIT"],isActive:true,isFeatured:true},
  {name:"Cholesterol LS 1x50ml (50 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CHOL-LS-50T",description:"Cholesterol LS reagent 1x50ml for 50 tests.",specifications:{"Test Parameter":"Cholesterol","Method":"Enzymatic","Pack Size":"1 X 50 ml","Number of Tests":"50","Storage":"2-8°C"},certifications:["CE IVD"],price:580,stock:25,minOrderQty:1,tags:["cholesterol","lipid","LABKIT"],isActive:true,isFeatured:false},
  {name:"Cholesterol CAL",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CHOL-CAL",description:"Cholesterol calibrator.",specifications:{"Test Parameter":"Cholesterol Calibrator","Storage":"2-8°C"},certifications:["CE IVD"],price:450,stock:15,minOrderQty:1,tags:["cholesterol","calibrator","LABKIT"],isActive:true,isFeatured:false},
  
  // Creatinine Products
  {name:"Creatinine-J 2x125ml (250 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CREAT-J-250T",description:"Creatinine Jaffe method 2x125ml for 250 tests.",specifications:{"Test Parameter":"Creatinine","Method":"Jaffe","Pack Size":"2 X125 ml","Number of Tests":"250","Storage":"2-8°C"},certifications:["CE IVD"],price:1050,stock:20,minOrderQty:1,tags:["creatinine","jaffe","kidney","LABKIT"],isActive:true,isFeatured:true},
  {name:"Creatinine-J 2x50ml (125 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CREAT-J-125T",description:"Creatinine Jaffe method 2x50ml for 125 tests.",specifications:{"Test Parameter":"Creatinine","Method":"Jaffe","Pack Size":"2 X 50 ml","Number of Tests":"125","Storage":"2-8°C"},certifications:["CE IVD"],price:610,stock:25,minOrderQty:1,tags:["creatinine","jaffe","kidney","LABKIT"],isActive:true,isFeatured:false},
  {name:"Creatinine-CAL 1x5 R1",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-CREAT-CAL-5R1",description:"Creatinine calibrator 1x5ml R1.",specifications:{"Test Parameter":"Creatinine Calibrator","Pack Size":"1 X 5 R1","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:15,minOrderQty:1,tags:["creatinine","calibrator","LABKIT"],isActive:true,isFeatured:false},
  
  // Glucose Products
  {name:"Glucose LS 1x1000ml (1000 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-GLUC-LS-1000T",description:"Glucose LS reagent 1x1000ml for 1000 tests.",specifications:{"Test Parameter":"Glucose","Method":"GOD-PAP","Pack Size":"1 X 1000 ml","Number of Tests":"1000","Storage":"2-8°C"},certifications:["CE IVD"],price:1700,stock:15,minOrderQty:1,tags:["glucose","GOD-PAP","blood sugar","LABKIT"],isActive:true,isFeatured:true},
  {name:"Glucose LS 4x250ml (1000 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-GLUC-LS-4X250-1000T",description:"Glucose LS reagent 4x250ml for 1000 tests.",specifications:{"Test Parameter":"Glucose","Method":"GOD-PAP","Pack Size":"4 X 250 ml","Number of Tests":"1000","Storage":"2-8°C"},certifications:["CE IVD"],price:1950,stock:15,minOrderQty:1,tags:["glucose","GOD-PAP","blood sugar","LABKIT"],isActive:true,isFeatured:true},
  {name:"Glucose LS 1x250ml (250 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-GLUC-LS-250T",description:"Glucose LS reagent 1x250ml for 250 tests.",specifications:{"Test Parameter":"Glucose","Method":"GOD-PAP","Pack Size":"1 X 250 ml","Number of Tests":"250","Storage":"2-8°C"},certifications:["CE IVD"],price:520,stock:20,minOrderQty:1,tags:["glucose","GOD-PAP","blood sugar","LABKIT"],isActive:true,isFeatured:false},
  {name:"Glucose CAL 1x5ml",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-GLUC-CAL-5ML",description:"Glucose calibrator 1x5ml.",specifications:{"Test Parameter":"Glucose Calibrator","Pack Size":"1 X 5 ml","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:15,minOrderQty:1,tags:["glucose","calibrator","LABKIT"],isActive:true,isFeatured:false},
  
  // Hemoglobin Products
  {name:"Hemoglobin 4x5ml (50X10) 500 Test",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-HB-4X5ML-500T",description:"Hemoglobin reagent 4x5ml (50X10) for 500 tests.",specifications:{"Test Parameter":"Hemoglobin","Pack Size":"4X5 ml (50X10)","Number of Tests":"500","Storage":"2-8°C"},certifications:["CE IVD"],price:850,stock:20,minOrderQty:1,tags:["hemoglobin","CBC","anemia","LABKIT"],isActive:true,isFeatured:false},
  {name:"Hemoglobin 4x50ml",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-HB-4X50ML",description:"Hemoglobin reagent 4x50ml.",specifications:{"Test Parameter":"Hemoglobin","Pack Size":"4 X50 ml","Storage":"2-8°C"},certifications:["CE IVD"],price:900,stock:20,minOrderQty:1,tags:["hemoglobin","CBC","anemia","LABKIT"],isActive:true,isFeatured:false},
  
  // Iron FZ
  {name:"Iron FZ 4x50ml (200 Test)",brand:"LABKIT",manufacturer:"Spain",category:"Laboratory Reagents",sku:"LABKIT-IRON-FZ-200T",description:"Iron FZ reagent 4x50ml for 200 tests.",specifications:{"Test Parameter":"Iron","Method":"FZ","Pack Size":"4X50 ml","Number of Tests":"200","Storage":"2-8°C"},certifications:["CE IVD"],price:7000,stock:12,minOrderQty:1,tags:["iron","FZ","anemia","LABKIT"],isActive:true,isFeatured:false}
];

// Helper functions
async function findOrCreateManufacturer(brandName, country = '') {
  try {
    // Try to find by name (case-insensitive)
    let manufacturer = await Manufacturer.findOne({ name: { $regex: new RegExp(`^${brandName}$`, 'i') } });
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
        console.log(`⏭️  Skipped: ${result.name} (${result.sku}) - Already exists`);
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
  seedProducts().then(() => { console.log('✓ Script completed successfully'); process.exit(0); }).catch((error) => { console.error('✗ Failed:', error); process.exit(1); });
}

module.exports = { seedProducts };
