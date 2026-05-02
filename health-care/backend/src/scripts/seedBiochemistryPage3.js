require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Page 3 - Biochemistry Reagents (50+ products)
const productsData = [
  {name:"Creatinine Kinetic Jaffe Reaction",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-CREATININE-JAFFE",description:"Creatinine kinetic Jaffe reaction reagent for kidney function.",specifications:{"Test Parameter":"Creatinine","Method":"Jaffe Kinetic","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1200,stock:20,minOrderQty:1,tags:["creatinine","kidney","jaffe"],isActive:true,isFeatured:false},
  {name:"Lipase Enzymatic Colorimetric",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-LIPASE-ENZYMATIC",description:"Lipase enzymatic colorimetric reagent for pancreatic function.",specifications:{"Test Parameter":"Lipase","Method":"Enzymatic Colorimetric","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4600,stock:12,minOrderQty:1,tags:["lipase","pancreas","enzymatic"],isActive:true,isFeatured:false},
  {name:"Cholesterol GOD-PAP",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-CHOLESTEROL-GOD-PAP",description:"Cholesterol GOD-PAP reagent for lipid profile.",specifications:{"Test Parameter":"Cholesterol","Method":"GOD-PAP","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:20,minOrderQty:1,tags:["cholesterol","lipid","GOD-PAP"],isActive:true,isFeatured:true},
  {name:"Triglyceride GPO-PAP",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-TRIGLYCERIDE-GPO-PAP",description:"Triglyceride GPO-PAP reagent for lipid metabolism.",specifications:{"Test Parameter":"Triglyceride","Method":"GPO-PAP","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1400,stock:18,minOrderQty:1,tags:["triglyceride","lipid","GPO-PAP"],isActive:true,isFeatured:false},
  {name:"HDL Cholesterol Direct Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-HDL-DIRECT",description:"HDL cholesterol direct method reagent.",specifications:{"Test Parameter":"HDL Cholesterol","Method":"Direct","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2400,stock:15,minOrderQty:1,tags:["HDL","cholesterol","direct method"],isActive:true,isFeatured:false},
  {name:"LDL Cholesterol Direct Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-LDL-DIRECT",description:"LDL cholesterol direct method reagent.",specifications:{"Test Parameter":"LDL Cholesterol","Method":"Direct","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2600,stock:15,minOrderQty:1,tags:["LDL","cholesterol","direct method"],isActive:true,isFeatured:false},
  {name:"Glucose GOD-PAP Liquid Stable",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-GLUCOSE-GOD-PAP",description:"Glucose GOD-PAP liquid stable reagent.",specifications:{"Test Parameter":"Glucose","Method":"GOD-PAP","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1100,stock:25,minOrderQty:1,tags:["glucose","GOD-PAP","blood sugar"],isActive:true,isFeatured:true},
  {name:"Uric Acid Uricase PAP Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-URIC-ACID-URICASE",description:"Uric acid uricase PAP method reagent.",specifications:{"Test Parameter":"Uric Acid","Method":"Uricase PAP","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1750,stock:18,minOrderQty:1,tags:["uric acid","gout","uricase"],isActive:true,isFeatured:false},
  {name:"Total Protein Biuret Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-TOTAL-PROTEIN-BIURET",description:"Total protein biuret method reagent.",specifications:{"Test Parameter":"Total Protein","Method":"Biuret","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4000,stock:20,minOrderQty:1,tags:["total protein","biuret","protein"],isActive:true,isFeatured:false},
  {name:"Albumin BCG Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-ALBUMIN-BCG",description:"Albumin BCG (Bromocresol Green) method reagent.",specifications:{"Test Parameter":"Albumin","Method":"BCG","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2000,stock:20,minOrderQty:1,tags:["albumin","BCG","protein"],isActive:true,isFeatured:false},
  {name:"Calcium Arsenazo III Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-CALCIUM-ARSENAZO",description:"Calcium arsenazo III method reagent.",specifications:{"Test Parameter":"Calcium","Method":"Arsenazo III","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2100,stock:18,minOrderQty:1,tags:["calcium","arsenazo","electrolyte"],isActive:true,isFeatured:false},
  {name:"Phosphorus Molybdate UV Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-PHOSPHORUS-UV",description:"Phosphorus molybdate UV method reagent.",specifications:{"Test Parameter":"Phosphorus","Method":"Molybdate UV","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:7700,stock:10,minOrderQty:1,tags:["phosphorus","molybdate","electrolyte"],isActive:true,isFeatured:false},
  {name:"Magnesium Xylidyl Blue Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-MAGNESIUM-XYLIDYL",description:"Magnesium xylidyl blue method reagent.",specifications:{"Test Parameter":"Magnesium","Method":"Xylidyl Blue","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:15,minOrderQty:1,tags:["magnesium","xylidyl blue","electrolyte"],isActive:true,isFeatured:false},
  {name:"Iron TPTZ Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-IRON-TPTZ",description:"Iron TPTZ method reagent for anemia assessment.",specifications:{"Test Parameter":"Iron","Method":"TPTZ","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1500,stock:15,minOrderQty:1,tags:["iron","TPTZ","anemia"],isActive:true,isFeatured:false},
  {name:"TIBC (Total Iron Binding Capacity)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-TIBC",description:"TIBC reagent for iron metabolism assessment.",specifications:{"Test Parameter":"TIBC","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:12,minOrderQty:1,tags:["TIBC","iron binding","anemia"],isActive:true,isFeatured:false},
  {name:"Bilirubin Total & Direct DMSO Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-BILIRUBIN-DMSO",description:"Bilirubin total and direct DMSO method.",specifications:{"Test Parameter":"Bilirubin Total & Direct","Method":"DMSO","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2900,stock:18,minOrderQty:1,tags:["bilirubin","liver","DMSO"],isActive:true,isFeatured:true},
  {name:"Alkaline Phosphatase (ALP) IFCC Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-ALP-IFCC",description:"Alkaline phosphatase IFCC kinetic method.",specifications:{"Test Parameter":"ALP","Method":"IFCC Kinetic","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:15,minOrderQty:1,tags:["ALP","alkaline phosphatase","liver","bone"],isActive:true,isFeatured:false},
  {name:"Amylase CNPG3 Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-AMYLASE-CNPG3",description:"Amylase CNPG3 method for pancreatic function.",specifications:{"Test Parameter":"Amylase","Method":"CNPG3","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1000,stock:15,minOrderQty:1,tags:["amylase","pancreas","CNPG3"],isActive:true,isFeatured:false},
  {name:"GGT (Gamma GT) IFCC Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-GGT-IFCC",description:"Gamma-glutamyl transferase IFCC method.",specifications:{"Test Parameter":"GGT","Method":"IFCC","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:4600,stock:12,minOrderQty:1,tags:["GGT","gamma GT","liver"],isActive:true,isFeatured:false},
  {name:"LDH (Lactate Dehydrogenase) IFCC",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-LDH-IFCC",description:"Lactate dehydrogenase IFCC method.",specifications:{"Test Parameter":"LDH","Method":"IFCC","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2400,stock:15,minOrderQty:1,tags:["LDH","lactate dehydrogenase","cardiac"],isActive:true,isFeatured:false},
  {name:"CK (Creatine Kinase) NAC Activated",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-CK-NAC",description:"Creatine kinase NAC activated method.",specifications:{"Test Parameter":"CK","Method":"NAC Activated","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2500,stock:15,minOrderQty:1,tags:["CK","creatine kinase","cardiac","muscle"],isActive:true,isFeatured:false},
  {name:"CK-MB (Creatine Kinase MB)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-CK-MB",description:"Creatine kinase MB isoenzyme for cardiac assessment.",specifications:{"Test Parameter":"CK-MB","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:5500,stock:10,minOrderQty:1,tags:["CK-MB","cardiac","heart attack"],isActive:true,isFeatured:true},
  {name:"Urea Urease UV Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS006200-UREA-UREASE-UV",description:"Urea urease UV method for kidney function.",specifications:{"Test Parameter":"Urea","Method":"Urease UV","Kit Size":"4x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:950,stock:20,minOrderQty:1,tags:["urea","BUN","kidney","urease"],isActive:true,isFeatured:true},
  {name:"Total Protein Biuret",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS013200-TOTAL-PROTEIN",description:"Total protein biuret reagent.",specifications:{"Test Parameter":"Total Protein","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:18,minOrderQty:1,tags:["total protein","biuret"],isActive:true,isFeatured:false},
  {name:"Urea (Urease) Berthelot",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS017200-UREA-BERTHELOT",description:"Urea urease Berthelot method.",specifications:{"Test Parameter":"Urea","Method":"Berthelot","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2400,stock:15,minOrderQty:1,tags:["urea","Berthelot","kidney"],isActive:true,isFeatured:false},
  {name:"Hemoglobin Drabkin's Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS017200-HEMOGLOBIN-DRABKIN",description:"Hemoglobin Drabkin's reagent for anemia assessment.",specifications:{"Test Parameter":"Hemoglobin","Method":"Drabkin's","Kit Size":"1x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:20,minOrderQty:1,tags:["hemoglobin","Drabkin","anemia"],isActive:true,isFeatured:false},
  {name:"Hemoglobin Drabkin's Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS010050-HEMOGLOBIN",description:"Hemoglobin reagent for CBC.",specifications:{"Test Parameter":"Hemoglobin","Kit Size":"1x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:900,stock:25,minOrderQty:1,tags:["hemoglobin","CBC"],isActive:true,isFeatured:false},
  {name:"Bilirubin Total DMSO Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS062100-BILIRUBIN-TOTAL",description:"Bilirubin total DMSO method.",specifications:{"Test Parameter":"Bilirubin Total","Method":"DMSO","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1950,stock:18,minOrderQty:1,tags:["bilirubin","liver"],isActive:true,isFeatured:false},
  {name:"Bilirubin Direct DMSO Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS062100-BILIRUBIN-DIRECT",description:"Bilirubin direct DMSO method.",specifications:{"Test Parameter":"Bilirubin Direct","Method":"DMSO","Kit Size":"2x100 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1000,stock:18,minOrderQty:1,tags:["bilirubin direct","liver"],isActive:true,isFeatured:false},
  {name:"CK-NAC (Creatine Kinase)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS070050-CK-NAC",description:"Creatine kinase NAC method.",specifications:{"Test Parameter":"CK","Method":"NAC","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:3000,stock:15,minOrderQty:1,tags:["CK","creatine kinase"],isActive:true,isFeatured:false},
  {name:"CK-MB (Creatine Kinase MB)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS070050-CK-MB-2",description:"CK-MB isoenzyme reagent.",specifications:{"Test Parameter":"CK-MB","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:5500,stock:10,minOrderQty:1,tags:["CK-MB","cardiac"],isActive:true,isFeatured:false},
  {name:"Calcium Arsenazo III",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS070050-CALCIUM",description:"Calcium arsenazo III reagent.",specifications:{"Test Parameter":"Calcium","Method":"Arsenazo III","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:1250,stock:18,minOrderQty:1,tags:["calcium","arsenazo"],isActive:true,isFeatured:false},
  {name:"Phosphorus UV Method",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS070050-PHOSPHORUS",description:"Phosphorus UV method reagent.",specifications:{"Test Parameter":"Phosphorus","Method":"UV","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2200,stock:15,minOrderQty:1,tags:["phosphorus","UV"],isActive:true,isFeatured:false},
  {name:"Magnesium Xylidyl Blue",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CS070050-MAGNESIUM",description:"Magnesium xylidyl blue reagent.",specifications:{"Test Parameter":"Magnesium","Method":"Xylidyl Blue","Kit Size":"2x50 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:2800,stock:12,minOrderQty:1,tags:["magnesium","xylidyl blue"],isActive:true,isFeatured:false}
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
