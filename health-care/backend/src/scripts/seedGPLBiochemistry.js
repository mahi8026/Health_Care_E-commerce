require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// GPL Biochemistry Reagents + Missing JEVE Products
const productsData = [
  // GPL Biochemistry Reagents - Page 3
  {name:"GPL Creatinine Jaffe Reagent",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CREATININE-JAFFE-S1015-SP",description:"Creatinine Jaffe reagent for serum/plasma creatinine determination. Kinetic colorimetric method.",specifications:{"Test Parameter":"Creatinine","Method":"Jaffe Kinetic","Kit Size":"2x125 ML","Storage":"2-8°C","Origin":"Spain"},certifications:["CE IVD","ISO 13485"],price:1500,stock:20,minOrderQty:1,tags:["creatinine","jaffe","biochemistry","GPL","clinical chemistry"],isActive:true,isFeatured:false},
  {name:"GPL GPT/ALT LQ Reagent",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-GPT-ALT-LQ-E2016LQ-SP",description:"GPT/ALT (Alanine Aminotransferase) liquid stable reagent for liver function testing.",specifications:{"Test Parameter":"GPT/ALT","Method":"IFCC kinetic","Kit Size":"4x100 ML","Storage":"2-8°C","Origin":"Spain"},certifications:["CE IVD"],price:1200,stock:15,minOrderQty:1,tags:["GPT","ALT","liver function","GPL","biochemistry"],isActive:true,isFeatured:false},
  {name:"GPL GOT/AST LQ Reagent",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-GOT-AST-LQ-E2016LQ",description:"GOT/AST (Aspartate Aminotransferase) liquid stable reagent for liver function assessment.",specifications:{"Test Parameter":"GOT/AST","Method":"IFCC kinetic","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2200,stock:15,minOrderQty:1,tags:["GOT","AST","liver function","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Uric Acid Liquid Stable Reagent",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-URIC-ACID-LIQUID-E2021Q-SP",description:"Uric acid liquid stable reagent for gout and kidney function assessment.",specifications:{"Test Parameter":"Uric Acid","Method":"Enzymatic colorimetric","Kit Size":"2x400 ML + 2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4000,stock:12,minOrderQty:1,tags:["uric acid","gout","kidney function","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Cholesterol Liquid Stable Reagent 4x100ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CHOLESTEROL-LQ-E2021Q",description:"Cholesterol liquid stable reagent for lipid profile testing.",specifications:{"Test Parameter":"Cholesterol","Method":"Enzymatic CHOD-PAP","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1200,stock:20,minOrderQty:1,tags:["cholesterol","lipid profile","GPL"],isActive:true,isFeatured:true},
  {name:"GPL Triglyceride Liquid Stable Reagent 4x100ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-TRIGLYCERIDE-LQ-S1003",description:"Triglyceride liquid stable reagent for lipid metabolism assessment.",specifications:{"Test Parameter":"Triglyceride","Method":"Enzymatic GPO-PAP","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2200,stock:18,minOrderQty:1,tags:["triglyceride","lipid profile","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Calcium OCC-VJ Reagent",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CALCIUM-OCC-VJ-S1008",description:"Calcium OCC-VJ reagent for serum calcium determination.",specifications:{"Test Parameter":"Calcium","Method":"O-Cresolphthalein","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1750,stock:15,minOrderQty:1,tags:["calcium","electrolyte","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Cholesterol Liquid Stable 2x250ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CHOLESTEROL-2X250-S1011",description:"Cholesterol liquid stable reagent - larger pack size for high volume labs.",specifications:{"Test Parameter":"Cholesterol","Kit Size":"2x250 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4700,stock:10,minOrderQty:1,tags:["cholesterol","lipid profile","GPL","bulk"],isActive:true,isFeatured:false},
  {name:"GPL Cholesterol Liquid Stable 2x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CHOLESTEROL-2X125-S1012",description:"Cholesterol liquid stable reagent - medium pack size.",specifications:{"Test Parameter":"Cholesterol","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1750,stock:15,minOrderQty:1,tags:["cholesterol","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Triglyceride Liquid Stable 2x250ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-TRIGLYCERIDE-2X250-S1013",description:"Triglyceride liquid stable - larger pack for high throughput.",specifications:{"Test Parameter":"Triglyceride","Kit Size":"2x250 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4000,stock:10,minOrderQty:1,tags:["triglyceride","GPL","bulk"],isActive:true,isFeatured:false},
  {name:"GPL Triglyceride Liquid Stable 2x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-TRIGLYCERIDE-2X125-S1014",description:"Triglyceride liquid stable - medium pack size.",specifications:{"Test Parameter":"Triglyceride","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2700,stock:12,minOrderQty:1,tags:["triglyceride","GPL"],isActive:true,isFeatured:false},
  {name:"GPL HDL Cholesterol (Precipitating Reagent Only)",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-HDL-CHOL-PRECIP-S1014",description:"HDL Cholesterol precipitating reagent for direct HDL measurement.",specifications:{"Test Parameter":"HDL Cholesterol","Method":"Precipitation","Kit Size":"1x100 ML (0.001)","Storage":"2-8°C"},certifications:["CE IVD"],price:2700,stock:10,minOrderQty:1,tags:["HDL","cholesterol","lipid profile","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Albumin Phosphatase/ALQ LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ALBUMIN-PHOS-S1014",description:"Albumin reagent with alkaline phosphatase method.",specifications:{"Test Parameter":"Albumin","Kit Size":"3x100 ML (Precipitating reagent only)","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:12,minOrderQty:1,tags:["albumin","protein","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Alkaline Phosphatase/ALQ LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ALP-ALQ-LQ-S1004-SP",description:"Alkaline phosphatase liquid reagent for bone and liver assessment.",specifications:{"Test Parameter":"Alkaline Phosphatase (ALP)","Method":"IFCC kinetic","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2700,stock:10,minOrderQty:1,tags:["ALP","alkaline phosphatase","liver","bone","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Bilirubin Total & Direct DMSO",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-BILIRUBIN-DMSO-S1005-SP",description:"Bilirubin total and direct reagent using DMSO method for liver function.",specifications:{"Test Parameter":"Bilirubin Total & Direct","Method":"Diazo DMSO","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:12,minOrderQty:1,tags:["bilirubin","liver function","jaundice","GPL"],isActive:true,isFeatured:true},
  {name:"GPL Alkaline Phosphatase/ALQ LQ 2x50ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ALP-2X50-S1009",description:"Alkaline phosphatase reagent - standard pack.",specifications:{"Test Parameter":"ALP","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2700,stock:10,minOrderQty:1,tags:["ALP","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Amylase Liquid Stable",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-AMYLASE-LIQUID-S1001",description:"Amylase liquid stable reagent for pancreatic function assessment.",specifications:{"Test Parameter":"Amylase","Method":"Enzymatic","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:10,minOrderQty:1,tags:["amylase","pancreas","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Albumin 2x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ALBUMIN-2X125-S1001",description:"Albumin reagent for serum protein assessment.",specifications:{"Test Parameter":"Albumin","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:15,minOrderQty:1,tags:["albumin","protein","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Total Protein 2x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-TOTAL-PROTEIN-2X125-S1002",description:"Total protein reagent for nutritional and liver assessment.",specifications:{"Test Parameter":"Total Protein","Method":"Biuret","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1000,stock:15,minOrderQty:1,tags:["total protein","protein","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Albumin 4x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ALBUMIN-4X125-S1009",description:"Albumin reagent - larger pack for high volume.",specifications:{"Test Parameter":"Albumin","Kit Size":"4x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:10,minOrderQty:1,tags:["albumin","GPL","bulk"],isActive:true,isFeatured:false},
  {name:"GPL Total Protein 4x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-TOTAL-PROTEIN-4X125-S1009",description:"Total protein reagent - bulk pack.",specifications:{"Test Parameter":"Total Protein","Kit Size":"4x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:10,minOrderQty:1,tags:["total protein","GPL","bulk"],isActive:true,isFeatured:false},
  {name:"GPL Urea UV LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-UREA-UV-LQ-S1029",description:"Urea UV liquid reagent for kidney function assessment.",specifications:{"Test Parameter":"Urea","Method":"Urease UV","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1300,stock:15,minOrderQty:1,tags:["urea","kidney function","BUN","GPL"],isActive:true,isFeatured:true},
  {name:"GPL Magnesium",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-MAGNESIUM-S1029",description:"Magnesium reagent for electrolyte panel.",specifications:{"Test Parameter":"Magnesium","Method":"Xylidyl Blue","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:7000,stock:8,minOrderQty:1,tags:["magnesium","electrolyte","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Microalbumin",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-MICROALBUMIN-S1025",description:"Microalbumin reagent for early diabetic nephropathy detection.",specifications:{"Test Parameter":"Microalbumin","Method":"Immunoturbidimetric","Kit Size":"2x25 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:3500,stock:10,minOrderQty:1,tags:["microalbumin","diabetes","kidney","GPL"],isActive:true,isFeatured:true},
  {name:"GPL Phosphorus UV",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-PHOSPHORUS-UV-S1027",description:"Phosphorus UV reagent for bone and kidney assessment.",specifications:{"Test Parameter":"Phosphorus","Method":"UV molybdate","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:12,minOrderQty:1,tags:["phosphorus","electrolyte","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Urine CSF Protein",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-URINE-CSF-PROTEIN-S1027",description:"Urine and CSF protein reagent for proteinuria and CNS assessment.",specifications:{"Test Parameter":"Urine/CSF Protein","Method":"Pyrogallol Red","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:9000,stock:6,minOrderQty:1,tags:["urine protein","CSF protein","proteinuria","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Zinc LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-ZINC-LQ-S1031",description:"Zinc liquid reagent for trace element analysis.",specifications:{"Test Parameter":"Zinc","Method":"Colorimetric","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:10000,stock:5,minOrderQty:1,tags:["zinc","trace element","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Gamma GT LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-GAMMA-GT-LQ-S1048",description:"Gamma-glutamyl transferase liquid reagent for liver function.",specifications:{"Test Parameter":"Gamma GT (GGT)","Method":"IFCC kinetic","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:10000,stock:8,minOrderQty:1,tags:["gamma GT","GGT","liver function","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Creatinine Jaffe 2x600ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CREATININE-2X600-E2008-SP",description:"Creatinine Jaffe reagent - bulk pack for high volume labs.",specifications:{"Test Parameter":"Creatinine","Kit Size":"2x600 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2600,stock:10,minOrderQty:1,tags:["creatinine","kidney function","GPL","bulk"],isActive:true,isFeatured:false},
  {name:"GPL Calcium LQ",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CALCIUM-LQ-E2009-SP",description:"Calcium liquid reagent for bone and parathyroid assessment.",specifications:{"Test Parameter":"Calcium","Method":"Arsenazo III","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4500,stock:10,minOrderQty:1,tags:["calcium","electrolyte","GPL"],isActive:true,isFeatured:false},
  {name:"GPL Calcium 2x125ML",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CALCIUM-2X125-E2007SP",description:"Calcium reagent - standard pack size.",specifications:{"Test Parameter":"Calcium","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:3600,stock:12,minOrderQty:1,tags:["calcium","GPL"],isActive:true,isFeatured:false},
  {name:"GPL CPK Phosphokinase",brand:"GPL",manufacturer:"GPL, Barcelona, Spain",category:"Laboratory Reagents",sku:"GPL-CPK-E2008SP",description:"Creatine phosphokinase reagent for cardiac and muscle assessment.",specifications:{"Test Parameter":"CPK (Creatine Phosphokinase)","Method":"IFCC kinetic","Kit Size":"2x125 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:14000,stock:6,minOrderQty:1,tags:["CPK","cardiac","muscle","heart attack","GPL"],isActive:true,isFeatured:true},
  
  // Additional JEVE Thermometers
  {name:"JEVE Toshiba Thermometer",brand:"JEVE",manufacturer:"China",category:"Diagnostic Equipment",sku:"JEVE-TOSHIBA-THERM-75",description:"Toshiba branded digital thermometer by JEVE. Basic clinical thermometer.",specifications:{"Range":"32-43°C","Brand":"Toshiba (JEVE)","Origin":"China"},certifications:["CE"],price:75,stock:50,minOrderQty:5,tags:["thermometer","Toshiba","JEVE","clinical"],isActive:true,isFeatured:false},
  {name:"JEVE Clinical Thermometer",brand:"JEVE",manufacturer:"China",category:"Diagnostic Equipment",sku:"JEVE-CLINICAL-THERM-55",description:"Basic clinical digital thermometer for general use.",specifications:{"Range":"32-43°C","Type":"Clinical digital","Origin":"China"},certifications:["CE"],price:55,stock:100,minOrderQty:10,tags:["thermometer","clinical","JEVE","basic"],isActive:true,isFeatured:false}
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

if (require.main === module) {
  seedProducts().then(() => { console.log('✓ Script completed successfully'); process.exit(0); }).catch((error) => { console.error('✗ Script failed:', error); process.exit(1); });
}

module.exports = { seedProducts, insertProduct, findOrCreateManufacturer, findOrCreateCategory };
