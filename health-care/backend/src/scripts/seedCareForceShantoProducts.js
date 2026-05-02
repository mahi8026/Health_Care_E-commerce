require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Care Force Medical + Shanto Enterprise Products from Pages 4-5
const productsData = [
  // Care Force Medical Products
  {name:"Disposable Syringe 1ml with Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-1ML",description:"Disposable syringe 1ml with needle for single use.",specifications:{"Volume":"1ml","Needle Size":"25G x 5/8\"","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:280,stock:100,minOrderQty:10,tags:["syringe","disposable","1ml","Care Force"],isActive:true,isFeatured:false},
  {name:"Disposable Syringe 2ml with Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-2ML",description:"Disposable syringe 2ml with needle for single use.",specifications:{"Volume":"2ml","Needle Size":"23G x 1\"","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:320,stock:100,minOrderQty:10,tags:["syringe","disposable","2ml","Care Force"],isActive:true,isFeatured:true},
  {name:"Disposable Syringe 3ml with Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-3ML",description:"Disposable syringe 3ml with needle for single use.",specifications:{"Volume":"3ml","Needle Size":"22G x 1.25\"","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:360,stock:100,minOrderQty:10,tags:["syringe","disposable","3ml","Care Force"],isActive:true,isFeatured:true},
  {name:"Disposable Syringe 5ml with Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-5ML",description:"Disposable syringe 5ml with needle for single use.",specifications:{"Volume":"5ml","Needle Size":"21G x 1.5\"","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:420,stock:100,minOrderQty:10,tags:["syringe","disposable","5ml","Care Force"],isActive:true,isFeatured:true},
  {name:"Disposable Syringe 10ml with Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-10ML",description:"Disposable syringe 10ml with needle for single use.",specifications:{"Volume":"10ml","Needle Size":"21G x 1.5\"","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:520,stock:80,minOrderQty:10,tags:["syringe","disposable","10ml","Care Force"],isActive:true,isFeatured:false},
  {name:"Disposable Syringe 20ml without Needle",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-SYRINGE-20ML",description:"Disposable syringe 20ml without needle for single use.",specifications:{"Volume":"20ml","Type":"Luer Slip","Sterile":"Yes","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:650,stock:60,minOrderQty:10,tags:["syringe","disposable","20ml","Care Force"],isActive:true,isFeatured:false},
  {name:"IV Cannula 18G",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-CANNULA-18G",description:"IV cannula 18G with injection port for intravenous access.",specifications:{"Size":"18G","Color":"Green","Type":"With Injection Port","Sterile":"Yes","Pack":"50 pcs"},certifications:["CE","ISO 13485"],price:850,stock:50,minOrderQty:5,tags:["IV cannula","18G","intravenous","Care Force"],isActive:true,isFeatured:false},
  {name:"IV Cannula 20G",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-CANNULA-20G",description:"IV cannula 20G with injection port for intravenous access.",specifications:{"Size":"20G","Color":"Pink","Type":"With Injection Port","Sterile":"Yes","Pack":"50 pcs"},certifications:["CE","ISO 13485"],price:800,stock:60,minOrderQty:5,tags:["IV cannula","20G","intravenous","Care Force"],isActive:true,isFeatured:true},
  {name:"IV Cannula 22G",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-CANNULA-22G",description:"IV cannula 22G with injection port for intravenous access.",specifications:{"Size":"22G","Color":"Blue","Type":"With Injection Port","Sterile":"Yes","Pack":"50 pcs"},certifications:["CE","ISO 13485"],price:750,stock:70,minOrderQty:5,tags:["IV cannula","22G","intravenous","Care Force"],isActive:true,isFeatured:true},
  {name:"IV Cannula 24G",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-CANNULA-24G",description:"IV cannula 24G with injection port for intravenous access.",specifications:{"Size":"24G","Color":"Yellow","Type":"With Injection Port","Sterile":"Yes","Pack":"50 pcs"},certifications:["CE","ISO 13485"],price:720,stock:70,minOrderQty:5,tags:["IV cannula","24G","pediatric","Care Force"],isActive:true,isFeatured:false},
  {name:"IV Set with Burette",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-SET-BURETTE",description:"IV set with burette for controlled fluid administration.",specifications:{"Type":"IV Set with Burette","Burette Volume":"150ml","Drop Factor":"60 drops/ml","Tube Length":"150cm","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:95,stock:100,minOrderQty:20,tags:["IV set","burette","infusion","Care Force"],isActive:true,isFeatured:false},
  {name:"IV Set without Burette",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-IV-SET-PLAIN",description:"IV set without burette for standard fluid administration.",specifications:{"Type":"IV Set","Drop Factor":"20 drops/ml","Tube Length":"150cm","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:45,stock:150,minOrderQty:20,tags:["IV set","infusion","Care Force"],isActive:true,isFeatured:true},
  {name:"Blood Transfusion Set",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-BLOOD-TRANSFUSION",description:"Blood transfusion set with filter for safe blood administration.",specifications:{"Type":"Blood Transfusion Set","Filter":"170 micron","Drop Factor":"20 drops/ml","Tube Length":"150cm","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:85,stock:80,minOrderQty:10,tags:["blood transfusion","infusion","Care Force"],isActive:true,isFeatured:false},
  {name:"Urine Bag 2000ml",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-URINE-BAG-2L",description:"Urine collection bag 2000ml with drainage tube.",specifications:{"Capacity":"2000ml","Type":"Urine Collection Bag","Tube Length":"90cm","Outlet":"T-Tap","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:120,stock:100,minOrderQty:10,tags:["urine bag","catheter","drainage","Care Force"],isActive:true,isFeatured:false},
  {name:"Foley Catheter 2-Way 16Fr",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-FOLEY-2WAY-16FR",description:"Foley catheter 2-way 16Fr for urinary catheterization.",specifications:{"Type":"Foley Catheter 2-Way","Size":"16Fr","Balloon":"5-15ml","Material":"100% Silicone","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:180,stock:60,minOrderQty:5,tags:["Foley catheter","urinary","16Fr","Care Force"],isActive:true,isFeatured:false},
  {name:"Foley Catheter 2-Way 18Fr",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-FOLEY-2WAY-18FR",description:"Foley catheter 2-way 18Fr for urinary catheterization.",specifications:{"Type":"Foley Catheter 2-Way","Size":"18Fr","Balloon":"5-15ml","Material":"100% Silicone","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:190,stock:60,minOrderQty:5,tags:["Foley catheter","urinary","18Fr","Care Force"],isActive:true,isFeatured:true},
  {name:"Ryles Tube 14Fr",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-RYLES-TUBE-14FR",description:"Ryles tube 14Fr for nasogastric feeding and aspiration.",specifications:{"Type":"Ryles Tube","Size":"14Fr","Length":"125cm","Material":"Medical Grade PVC","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:95,stock:70,minOrderQty:10,tags:["Ryles tube","nasogastric","feeding","Care Force"],isActive:true,isFeatured:false},
  {name:"Ryles Tube 16Fr",brand:"Care Force Medical",manufacturer:"China",category:"Medical Supplies",sku:"CFM-RYLES-TUBE-16FR",description:"Ryles tube 16Fr for nasogastric feeding and aspiration.",specifications:{"Type":"Ryles Tube","Size":"16Fr","Length":"125cm","Material":"Medical Grade PVC","Sterile":"Yes"},certifications:["CE","ISO 13485"],price:100,stock:70,minOrderQty:10,tags:["Ryles tube","nasogastric","feeding","Care Force"],isActive:true,isFeatured:false},
  
  // Shanto Enterprise Products
  {name:"Surgical Gloves Sterile Size 6.5",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-SURG-GLOVE-6.5",description:"Sterile surgical gloves size 6.5 for surgical procedures.",specifications:{"Size":"6.5","Type":"Surgical Gloves","Material":"Natural Latex","Sterile":"Yes","Pack":"50 pairs"},certifications:["CE","ISO 13485"],price:1200,stock:40,minOrderQty:5,tags:["surgical gloves","sterile","6.5","Shanto"],isActive:true,isFeatured:false},
  {name:"Surgical Gloves Sterile Size 7.0",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-SURG-GLOVE-7.0",description:"Sterile surgical gloves size 7.0 for surgical procedures.",specifications:{"Size":"7.0","Type":"Surgical Gloves","Material":"Natural Latex","Sterile":"Yes","Pack":"50 pairs"},certifications:["CE","ISO 13485"],price:1200,stock:50,minOrderQty:5,tags:["surgical gloves","sterile","7.0","Shanto"],isActive:true,isFeatured:true},
  {name:"Surgical Gloves Sterile Size 7.5",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-SURG-GLOVE-7.5",description:"Sterile surgical gloves size 7.5 for surgical procedures.",specifications:{"Size":"7.5","Type":"Surgical Gloves","Material":"Natural Latex","Sterile":"Yes","Pack":"50 pairs"},certifications:["CE","ISO 13485"],price:1200,stock:50,minOrderQty:5,tags:["surgical gloves","sterile","7.5","Shanto"],isActive:true,isFeatured:true},
  {name:"Surgical Gloves Sterile Size 8.0",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-SURG-GLOVE-8.0",description:"Sterile surgical gloves size 8.0 for surgical procedures.",specifications:{"Size":"8.0","Type":"Surgical Gloves","Material":"Natural Latex","Sterile":"Yes","Pack":"50 pairs"},certifications:["CE","ISO 13485"],price:1200,stock:40,minOrderQty:5,tags:["surgical gloves","sterile","8.0","Shanto"],isActive:true,isFeatured:false},
  {name:"Examination Gloves Powder Free Medium",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-EXAM-GLOVE-M",description:"Powder-free examination gloves medium size.",specifications:{"Size":"Medium","Type":"Examination Gloves","Material":"Nitrile","Powder":"No","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:850,stock:80,minOrderQty:10,tags:["examination gloves","powder free","medium","Shanto"],isActive:true,isFeatured:true},
  {name:"Examination Gloves Powder Free Large",brand:"Shanto Enterprise",manufacturer:"Malaysia",category:"PPE & Safety",sku:"SE-EXAM-GLOVE-L",description:"Powder-free examination gloves large size.",specifications:{"Size":"Large","Type":"Examination Gloves","Material":"Nitrile","Powder":"No","Pack":"100 pcs"},certifications:["CE","ISO 13485"],price:850,stock:80,minOrderQty:10,tags:["examination gloves","powder free","large","Shanto"],isActive:true,isFeatured:true},
  {name:"Face Mask 3-Ply Disposable (50 pcs)",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-FACE-MASK-3PLY-50",description:"3-ply disposable face mask for protection, pack of 50.",specifications:{"Type":"3-Ply Face Mask","Layers":"3","Material":"Non-woven Fabric","Ear Loop":"Elastic","Pack":"50 pcs"},certifications:["CE"],price:180,stock:200,minOrderQty:10,tags:["face mask","3-ply","disposable","Shanto"],isActive:true,isFeatured:true},
  {name:"N95 Respirator Mask",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-N95-MASK",description:"N95 respirator mask for high-level protection.",specifications:{"Type":"N95 Respirator","Filtration":"≥95%","Material":"Non-woven Fabric","Valve":"Optional","Pack":"20 pcs"},certifications:["CE","NIOSH N95"],price:850,stock:100,minOrderQty:5,tags:["N95","respirator","mask","Shanto"],isActive:true,isFeatured:true},
  {name:"Surgical Cap Disposable (100 pcs)",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-SURGICAL-CAP-100",description:"Disposable surgical cap for hygiene, pack of 100.",specifications:{"Type":"Surgical Cap","Material":"Non-woven Fabric","Color":"Blue/Green","Elastic":"Yes","Pack":"100 pcs"},certifications:["CE"],price:280,stock:150,minOrderQty:10,tags:["surgical cap","disposable","hygiene","Shanto"],isActive:true,isFeatured:false},
  {name:"Shoe Cover Disposable (100 pcs)",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-SHOE-COVER-100",description:"Disposable shoe covers for hygiene, pack of 100.",specifications:{"Type":"Shoe Cover","Material":"Non-woven Fabric","Color":"Blue","Elastic":"Yes","Pack":"100 pcs"},certifications:["CE"],price:320,stock:150,minOrderQty:10,tags:["shoe cover","disposable","hygiene","Shanto"],isActive:true,isFeatured:false},
  {name:"Isolation Gown Disposable",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-ISOLATION-GOWN",description:"Disposable isolation gown for protection.",specifications:{"Type":"Isolation Gown","Material":"Non-woven Fabric","Size":"Universal","Closure":"Tie Back","Pack":"10 pcs"},certifications:["CE"],price:650,stock:80,minOrderQty:5,tags:["isolation gown","disposable","protection","Shanto"],isActive:true,isFeatured:false},
  {name:"Surgical Gown Sterile",brand:"Shanto Enterprise",manufacturer:"China",category:"PPE & Safety",sku:"SE-SURGICAL-GOWN",description:"Sterile surgical gown for surgical procedures.",specifications:{"Type":"Surgical Gown","Material":"SMS Non-woven","Size":"Universal","Sterile":"Yes","Pack":"10 pcs"},certifications:["CE","ISO 13485"],price:1200,stock:60,minOrderQty:5,tags:["surgical gown","sterile","protection","Shanto"],isActive:true,isFeatured:true}
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
