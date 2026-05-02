require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Gp-1100 Device Products from Page 6
const productsData = [
  {name:"TSH Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-TSH-DEVICE",description:"TSH (Thyroid Stimulating Hormone) rapid test device.",specifications:{"Test Parameter":"TSH","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:150,stock:50,minOrderQty:10,tags:["TSH","thyroid","rapid test","Gp-1100"],isActive:true,isFeatured:false},
  {name:"T3 Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-T3-DEVICE",description:"T3 (Triiodothyronine) rapid test device.",specifications:{"Test Parameter":"T3","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:160,stock:50,minOrderQty:10,tags:["T3","thyroid","rapid test","Gp-1100"],isActive:true,isFeatured:false},
  {name:"T4 Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-T4-DEVICE",description:"T4 (Thyroxine) rapid test device.",specifications:{"Test Parameter":"T4","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:160,stock:50,minOrderQty:10,tags:["T4","thyroid","rapid test","Gp-1100"],isActive:true,isFeatured:false},
  {name:"CRP Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-CRP-DEVICE",description:"CRP (C-Reactive Protein) rapid test device.",specifications:{"Test Parameter":"CRP","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:150,stock:60,minOrderQty:10,tags:["CRP","inflammation","rapid test","Gp-1100"],isActive:true,isFeatured:true},
  {name:"Hba1c Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-HBA1C-DEVICE",description:"Hba1c (Glycated Hemoglobin) rapid test device for diabetes monitoring.",specifications:{"Test Parameter":"Hba1c","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:150,stock:50,minOrderQty:10,tags:["Hba1c","diabetes","rapid test","Gp-1100"],isActive:true,isFeatured:true},
  {name:"Troponin I Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-TROP-I-DEVICE",description:"Troponin I rapid test device for cardiac assessment.",specifications:{"Test Parameter":"Troponin I","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:40,minOrderQty:10,tags:["troponin","cardiac","heart attack","Gp-1100"],isActive:true,isFeatured:true},
  {name:"D-Dimer Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-D-DIMER-DEVICE",description:"D-Dimer rapid test device for blood clot detection.",specifications:{"Test Parameter":"D-Dimer","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:260,stock:35,minOrderQty:10,tags:["D-Dimer","blood clot","thrombosis","Gp-1100"],isActive:true,isFeatured:true},
  {name:"NT Pro BNP Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-NT-PRO-BNP",description:"NT Pro BNP rapid test device for heart failure assessment.",specifications:{"Test Parameter":"NT Pro BNP","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:500,stock:25,minOrderQty:5,tags:["NT Pro BNP","heart failure","cardiac","Gp-1100"],isActive:true,isFeatured:false},
  {name:"ANT CCP Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-ANT-CCP-DEVICE",description:"Anti-CCP rapid test device for rheumatoid arthritis detection.",specifications:{"Test Parameter":"Anti-CCP","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:450,stock:30,minOrderQty:5,tags:["Anti-CCP","rheumatoid arthritis","autoimmune","Gp-1100"],isActive:true,isFeatured:false},
  {name:"AMH Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-AMH-DEVICE",description:"AMH (Anti-Müllerian Hormone) rapid test device for fertility assessment.",specifications:{"Test Parameter":"AMH","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:400,stock:30,minOrderQty:5,tags:["AMH","fertility","hormone","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Testosterone Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-TESTOSTERONE",description:"Testosterone rapid test device.",specifications:{"Test Parameter":"Testosterone","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:280,stock:40,minOrderQty:10,tags:["testosterone","hormone","Gp-1100"],isActive:true,isFeatured:false},
  {name:"IGE Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-IGE-DEVICE",description:"IgE rapid test device for allergy detection.",specifications:{"Test Parameter":"IgE","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:270,stock:40,minOrderQty:10,tags:["IgE","allergy","immunology","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Ferritin Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-FERRITIN-DEVICE",description:"Ferritin rapid test device for iron storage assessment.",specifications:{"Test Parameter":"Ferritin","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:280,stock:40,minOrderQty:10,tags:["ferritin","iron","anemia","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Ft4 Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-FT4-DEVICE",description:"Free T4 rapid test device for thyroid function.",specifications:{"Test Parameter":"Free T4","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:190,stock:45,minOrderQty:10,tags:["FT4","thyroid","hormone","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Ft3 Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-FT3-DEVICE",description:"Free T3 rapid test device for thyroid function.",specifications:{"Test Parameter":"Free T3","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:190,stock:45,minOrderQty:10,tags:["FT3","thyroid","hormone","Gp-1100"],isActive:true,isFeatured:false},
  {name:"LH Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-LH-DEVICE",description:"LH (Luteinizing Hormone) rapid test device for ovulation detection.",specifications:{"Test Parameter":"LH","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:190,stock:50,minOrderQty:10,tags:["LH","ovulation","fertility","Gp-1100"],isActive:true,isFeatured:false},
  {name:"FSH Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-FSH-DEVICE",description:"FSH (Follicle Stimulating Hormone) rapid test device.",specifications:{"Test Parameter":"FSH","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:190,stock:50,minOrderQty:10,tags:["FSH","hormone","fertility","Gp-1100"],isActive:true,isFeatured:false},
  {name:"PRL Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-PRL-DEVICE",description:"PRL (Prolactin) rapid test device.",specifications:{"Test Parameter":"Prolactin","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:195,stock:45,minOrderQty:10,tags:["prolactin","hormone","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Beta HCG Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-BETA-HCG",description:"Beta HCG rapid test device for pregnancy detection.",specifications:{"Test Parameter":"Beta HCG","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:190,stock:60,minOrderQty:10,tags:["HCG","pregnancy","Gp-1100"],isActive:true,isFeatured:true},
  {name:"Vitamin-D Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-VITAMIN-D",description:"Vitamin D rapid test device for deficiency detection.",specifications:{"Test Parameter":"Vitamin D","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:450,stock:30,minOrderQty:5,tags:["vitamin D","deficiency","Gp-1100"],isActive:true,isFeatured:false},
  {name:"CAE Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-CAE-DEVICE",description:"CAE rapid test device.",specifications:{"Test Parameter":"CAE","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:40,minOrderQty:10,tags:["CAE","rapid test","Gp-1100"],isActive:true,isFeatured:false},
  {name:"AFP Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-AFP-DEVICE",description:"AFP (Alpha-Fetoprotein) rapid test device for cancer screening.",specifications:{"Test Parameter":"AFP","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:40,minOrderQty:10,tags:["AFP","cancer","tumor marker","Gp-1100"],isActive:true,isFeatured:false},
  {name:"RF Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-RF-DEVICE",description:"RF (Rheumatoid Factor) rapid test device.",specifications:{"Test Parameter":"RF","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:45,minOrderQty:10,tags:["RF","rheumatoid","arthritis","Gp-1100"],isActive:true,isFeatured:false},
  {name:"ASO Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-ASO-DEVICE",description:"ASO (Anti-Streptolysin O) rapid test device.",specifications:{"Test Parameter":"ASO","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:45,minOrderQty:10,tags:["ASO","streptococcus","infection","Gp-1100"],isActive:true,isFeatured:false},
  {name:"HBSAG Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-HBSAG-DEVICE",description:"HBsAg rapid test device for Hepatitis B detection.",specifications:{"Test Parameter":"HBsAg","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:50,minOrderQty:10,tags:["HBsAg","hepatitis B","infectious disease","Gp-1100"],isActive:true,isFeatured:true},
  {name:"MI-ALBUMIN Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-MI-ALBUMIN",description:"Microalbumin rapid test device for kidney function.",specifications:{"Test Parameter":"Microalbumin","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:200,stock:40,minOrderQty:10,tags:["microalbumin","kidney","nephropathy","Gp-1100"],isActive:true,isFeatured:false},
  {name:"ANTI HCV Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-ANTI-HCV",description:"Anti-HCV rapid test device for Hepatitis C detection.",specifications:{"Test Parameter":"Anti-HCV","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:230,stock:45,minOrderQty:10,tags:["HCV","hepatitis C","infectious disease","Gp-1100"],isActive:true,isFeatured:true},
  {name:"H.PYLORI Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-H-PYLORI",description:"H.Pylori rapid test device for gastric infection detection.",specifications:{"Test Parameter":"H.Pylori","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:300,stock:40,minOrderQty:10,tags:["H.Pylori","gastric","infection","Gp-1100"],isActive:true,isFeatured:false},
  {name:"CK-MB/CTNI Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-CK-MB-CTNI",description:"CK-MB/cTnI combo rapid test device for cardiac assessment.",specifications:{"Test Parameter":"CK-MB/cTnI","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:500,stock:30,minOrderQty:5,tags:["CK-MB","troponin","cardiac","Gp-1100"],isActive:true,isFeatured:true},
  {name:"PCT PROCALCITONIN Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-PCT-PROCALCITONIN",description:"PCT (Procalcitonin) rapid test device for sepsis detection.",specifications:{"Test Parameter":"Procalcitonin","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:500,stock:25,minOrderQty:5,tags:["PCT","procalcitonin","sepsis","Gp-1100"],isActive:true,isFeatured:true},
  {name:"TPSA Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-TPSA-DEVICE",description:"Total PSA rapid test device for prostate cancer screening.",specifications:{"Test Parameter":"Total PSA","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:300,stock:35,minOrderQty:10,tags:["PSA","prostate","cancer screening","Gp-1100"],isActive:true,isFeatured:false},
  {name:"ANTI-TP Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-ANTI-TP",description:"Anti-TP (Syphilis) rapid test device.",specifications:{"Test Parameter":"Anti-TP","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:220,stock:45,minOrderQty:10,tags:["syphilis","TP","STD","Gp-1100"],isActive:true,isFeatured:false},
  {name:"CK-MB Device Test Kit",brand:"Gp-1100",manufacturer:"China",category:"Diagnostic Equipment",sku:"GP1100-CK-MB-DEVICE",description:"CK-MB rapid test device for cardiac assessment.",specifications:{"Test Parameter":"CK-MB","Type":"Rapid Test Device","Method":"Immunochromatography","Storage":"2-30°C"},certifications:["CE"],price:250,stock:40,minOrderQty:10,tags:["CK-MB","cardiac","heart attack","Gp-1100"],isActive:true,isFeatured:false},
  {name:"Gp Machine Analyzer",brand:"Gp-1100",manufacturer:"China",category:"Hospital Machines",sku:"GP1100-MACHINE",description:"Gp-1100 automated analyzer machine for rapid test devices.",specifications:{"Type":"Automated Analyzer","Compatible Tests":"All Gp-1100 devices","Display":"LCD Touchscreen","Power":"AC 220V","Throughput":"Up to 60 tests/hour"},certifications:["CE","ISO 13485"],price:43000,stock:5,minOrderQty:1,tags:["analyzer","machine","automated","Gp-1100"],isActive:true,isFeatured:true}
];

// Helper functions
async function findOrCreateManufacturer(brandName, country = '') {
  try {
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
