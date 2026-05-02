require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// BSMI Products from Pages 7-8 (Cotton, Gauze, Stethoscopes, BP Machines, Nebulizers, etc.)
const productsData = [
  // Cotton Products
  {name:"Absorbent Cotton 400gm",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-COTTON-400GM",description:"High quality absorbent cotton 400gm pack for medical use.",specifications:{"Weight":"400gm","Type":"Absorbent Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:450,stock:50,minOrderQty:1,tags:["cotton","absorbent","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Absorbent Cotton 200gm",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-COTTON-200GM",description:"High quality absorbent cotton 200gm pack for medical use.",specifications:{"Weight":"200gm","Type":"Absorbent Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:250,stock:60,minOrderQty:1,tags:["cotton","absorbent","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Absorbent Cotton 100gm",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-COTTON-100GM",description:"High quality absorbent cotton 100gm pack for medical use.",specifications:{"Weight":"100gm","Type":"Absorbent Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:140,stock:80,minOrderQty:1,tags:["cotton","absorbent","medical supplies","BSMI"],isActive:true,isFeatured:true},
  {name:"Absorbent Cotton 50gm",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-COTTON-50GM",description:"High quality absorbent cotton 50gm pack for medical use.",specifications:{"Weight":"50gm","Type":"Absorbent Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:75,stock:100,minOrderQty:1,tags:["cotton","absorbent","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Absorbent Cotton 25gm",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-COTTON-25GM",description:"High quality absorbent cotton 25gm pack for medical use.",specifications:{"Weight":"25gm","Type":"Absorbent Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:40,stock:120,minOrderQty:1,tags:["cotton","absorbent","medical supplies","BSMI"],isActive:true,isFeatured:false},
  
  // Gauze Products
  {name:"Surgical Gauze Roll 90cm x 100m",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-GAUZE-90X100",description:"Surgical gauze roll 90cm x 100m for wound dressing.",specifications:{"Width":"90cm","Length":"100m","Type":"Surgical Gauze","Sterile":"No","Material":"Cotton"},certifications:["ISO 13485"],price:850,stock:40,minOrderQty:1,tags:["gauze","surgical","wound dressing","BSMI"],isActive:true,isFeatured:false},
  {name:"Surgical Gauze Swabs 10cm x 10cm (100 pcs)",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-GAUZE-SWAB-10X10",description:"Surgical gauze swabs 10cm x 10cm, pack of 100 pieces.",specifications:{"Size":"10cm x 10cm","Quantity":"100 pieces","Type":"Gauze Swabs","Sterile":"Optional","Material":"Cotton"},certifications:["ISO 13485"],price:320,stock:60,minOrderQty:1,tags:["gauze","swabs","surgical","BSMI"],isActive:true,isFeatured:true},
  
  // Stethoscopes
  {name:"Stethoscope Standard Black",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-STETHO-STD-BLACK",description:"Standard black stethoscope for general medical examination.",specifications:{"Type":"Dual Head","Color":"Black","Tube Length":"22 inches","Material":"Stainless Steel Chest Piece"},certifications:["CE"],price:650,stock:30,minOrderQty:1,tags:["stethoscope","diagnostic","medical equipment","BSMI"],isActive:true,isFeatured:true},
  {name:"Stethoscope Black Edition",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-STETHO-BLACK-ED",description:"Premium black edition stethoscope with enhanced acoustics.",specifications:{"Type":"Dual Head","Color":"Black","Tube Length":"22 inches","Material":"Stainless Steel","Features":"Enhanced Acoustics"},certifications:["CE"],price:850,stock:25,minOrderQty:1,tags:["stethoscope","premium","diagnostic","BSMI"],isActive:true,isFeatured:false},
  {name:"Stethoscope L/W Black Edition",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-STETHO-LW-BLACK",description:"Lightweight black edition stethoscope for comfortable use.",specifications:{"Type":"Dual Head","Color":"Black","Tube Length":"22 inches","Material":"Lightweight Aluminum","Weight":"120g"},certifications:["CE"],price:750,stock:28,minOrderQty:1,tags:["stethoscope","lightweight","diagnostic","BSMI"],isActive:true,isFeatured:false},
  
  // BP Machines
  {name:"BP Machine Aneroid Sphygmomanometer",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-BP-ANEROID",description:"Aneroid sphygmomanometer for accurate blood pressure measurement.",specifications:{"Type":"Aneroid","Cuff Size":"Adult","Accuracy":"±3 mmHg","Range":"0-300 mmHg"},certifications:["CE","ISO 13485"],price:1200,stock:35,minOrderQty:1,tags:["BP machine","aneroid","blood pressure","BSMI"],isActive:true,isFeatured:true},
  {name:"BP Machine Digital Automatic",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-BP-DIGITAL",description:"Digital automatic blood pressure monitor with LCD display.",specifications:{"Type":"Digital Automatic","Cuff Size":"Adult","Display":"LCD","Memory":"60 readings","Power":"4 AA Batteries"},certifications:["CE","ISO 13485"],price:1800,stock:30,minOrderQty:1,tags:["BP machine","digital","automatic","BSMI"],isActive:true,isFeatured:true},
  {name:"Finger Pulse Oximeter Plus",brand:"BSMI",manufacturer:"Bangladesh",category:"Diagnostic Equipment",sku:"BSMI-PULSEOX-FINGER",description:"Finger pulse oximeter for SpO2 and pulse rate measurement.",specifications:{"Type":"Finger Pulse Oximeter","Display":"LED","SpO2 Range":"70-100%","Pulse Rate":"30-250 bpm","Battery":"2 AAA"},certifications:["CE","FDA"],price:950,stock:45,minOrderQty:1,tags:["pulse oximeter","SpO2","diagnostic","BSMI"],isActive:true,isFeatured:true},
  
  // Medical Accessories
  {name:"Coronation Hot Water Bottle 2L",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-HWB-2L",description:"Coronation hot water bottle 2 liter capacity for heat therapy.",specifications:{"Capacity":"2 Liters","Material":"Natural Rubber","Color":"Red","Temperature":"Max 80°C"},certifications:["ISO 13485"],price:280,stock:50,minOrderQty:1,tags:["hot water bottle","heat therapy","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Oxygen Mask Adult",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-O2-MASK-ADULT",description:"Adult oxygen mask with adjustable strap and tubing.",specifications:{"Size":"Adult","Type":"Simple Oxygen Mask","Tube Length":"2 meters","Material":"Medical Grade PVC"},certifications:["CE","ISO 13485"],price:85,stock:100,minOrderQty:10,tags:["oxygen mask","respiratory","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Nebulizer Mask Adult",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-MASK-ADULT",description:"Adult nebulizer mask with tubing for aerosol therapy.",specifications:{"Size":"Adult","Type":"Nebulizer Mask","Tube Length":"2 meters","Material":"Medical Grade PVC"},certifications:["CE","ISO 13485"],price:95,stock:80,minOrderQty:10,tags:["nebulizer mask","respiratory","aerosol therapy","BSMI"],isActive:true,isFeatured:false},
  {name:"Nasal Cannula Adult",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NASAL-CANNULA",description:"Adult nasal cannula for oxygen therapy.",specifications:{"Size":"Adult","Type":"Nasal Cannula","Tube Length":"2 meters","Material":"Medical Grade PVC","Flow Rate":"1-6 L/min"},certifications:["CE","ISO 13485"],price:65,stock:120,minOrderQty:10,tags:["nasal cannula","oxygen therapy","respiratory","BSMI"],isActive:true,isFeatured:false},
  
  // Compressor Nebulizers
  {name:"Compressor Nebulizer CN-01WB",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-CN01WB",description:"Compressor nebulizer CN-01WB for effective aerosol therapy.",specifications:{"Model":"CN-01WB","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.2-0.5 mL/min","Noise Level":"<60 dB","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:2800,stock:20,minOrderQty:1,tags:["nebulizer","compressor","respiratory","BSMI"],isActive:true,isFeatured:true},
  {name:"Compressor Nebulizer CN-02MO",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-CN02MO",description:"Compressor nebulizer CN-02MO with advanced features.",specifications:{"Model":"CN-02MO","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.3-0.6 mL/min","Noise Level":"<58 dB","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:3200,stock:18,minOrderQty:1,tags:["nebulizer","compressor","respiratory","BSMI"],isActive:true,isFeatured:false},
  {name:"Compressor Nebulizer CN-02MD",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-CN02MD",description:"Compressor nebulizer CN-02MD medical grade device.",specifications:{"Model":"CN-02MD","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.3-0.6 mL/min","Noise Level":"<58 dB","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:3400,stock:15,minOrderQty:1,tags:["nebulizer","compressor","medical grade","BSMI"],isActive:true,isFeatured:false},
  {name:"Medel Easy Nebulizer",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-MEDEL-EASY",description:"Medel Easy nebulizer for home use.",specifications:{"Model":"Medel Easy","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.25 mL/min","Noise Level":"<60 dB","Power":"AC 220V"},certifications:["CE"],price:2600,stock:22,minOrderQty:1,tags:["nebulizer","Medel","home use","BSMI"],isActive:true,isFeatured:false},
  {name:"Medel Maxi Nebulizer",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-MEDEL-MAXI",description:"Medel Maxi nebulizer with larger capacity.",specifications:{"Model":"Medel Maxi","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.3 mL/min","Capacity":"10 mL","Noise Level":"<60 dB","Power":"AC 220V"},certifications:["CE"],price:2900,stock:20,minOrderQty:1,tags:["nebulizer","Medel","large capacity","BSMI"],isActive:true,isFeatured:false},
  {name:"AIRMIST Nebulizer",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-AIRMIST",description:"AIRMIST nebulizer for efficient aerosol delivery.",specifications:{"Model":"AIRMIST","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.3 mL/min","Noise Level":"<58 dB","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:3100,stock:18,minOrderQty:1,tags:["nebulizer","AIRMIST","aerosol","BSMI"],isActive:true,isFeatured:false},
  {name:"Hospyneb Professional Nebulizer",brand:"BSMI",manufacturer:"Bangladesh",category:"Respiratory Equipment",sku:"BSMI-NEB-HOSPYNEB",description:"Hospyneb professional nebulizer for clinical use.",specifications:{"Model":"Hospyneb Professional","Type":"Compressor Nebulizer","Particle Size":"0.5-10 μm","Nebulization Rate":"0.4 mL/min","Noise Level":"<55 dB","Power":"AC 220V","Duty Cycle":"Continuous"},certifications:["CE","ISO 13485"],price:3800,stock:12,minOrderQty:1,tags:["nebulizer","professional","clinical","BSMI"],isActive:true,isFeatured:true},
  
  // Medical Accessories
  {name:"Cervical Collar Soft",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-CERVICAL-COLLAR",description:"Soft cervical collar for neck support and immobilization.",specifications:{"Type":"Soft Cervical Collar","Size":"Adjustable","Material":"Foam with Cotton Cover","Height":"8-10 cm"},certifications:["CE"],price:450,stock:35,minOrderQty:1,tags:["cervical collar","neck support","orthopedic","BSMI"],isActive:true,isFeatured:false},
  {name:"Mucus Sucker Manual",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-MUCUS-SUCKER",description:"Manual mucus sucker for infant and pediatric use.",specifications:{"Type":"Manual Mucus Sucker","Material":"Medical Grade PVC","Capacity":"30 mL","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:120,stock:60,minOrderQty:5,tags:["mucus sucker","pediatric","medical supplies","BSMI"],isActive:true,isFeatured:false},
  {name:"Ball Cotton Pack (500g)",brand:"BSMI",manufacturer:"Bangladesh",category:"Medical Supplies",sku:"BSMI-BALL-COTTON-500G",description:"Ball cotton pack 500g for medical and cosmetic use.",specifications:{"Weight":"500g","Type":"Ball Cotton","Sterile":"No","Material":"100% Cotton"},certifications:["ISO 13485"],price:380,stock:45,minOrderQty:1,tags:["cotton","ball cotton","medical supplies","BSMI"],isActive:true,isFeatured:false}
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
