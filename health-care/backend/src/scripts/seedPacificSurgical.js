require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Pacific Surgical Instruments from Pages 9-10
const productsData = [
  {name:"Laparoscope Child 4 Blade",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-LAPARO-CHILD-4B",description:"Laparoscope child 4 blade surgical instrument for pediatric procedures.",specifications:{"Type":"Laparoscope","Blades":"4","Size":"Child","Material":"Stainless Steel","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:3500,stock:10,minOrderQty:1,tags:["laparoscope","pediatric","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Hambies Knife",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-HAMBIES-KNIFE",description:"Hambies knife for surgical procedures.",specifications:{"Type":"Surgical Knife","Material":"Stainless Steel","Blade":"Fixed","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:850,stock:25,minOrderQty:1,tags:["knife","surgical","Hambies","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Crocodile Forcep 6 inch",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-CROC-FORCEP-6IN",description:"Crocodile forcep 6 inch for grasping and holding tissue.",specifications:{"Type":"Crocodile Forcep","Length":"6 inches","Material":"Stainless Steel","Tip":"Serrated","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1200,stock:20,minOrderQty:1,tags:["forcep","crocodile","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Crocodile Forcep 8 inch",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-CROC-FORCEP-8IN",description:"Crocodile forcep 8 inch for grasping and holding tissue.",specifications:{"Type":"Crocodile Forcep","Length":"8 inches","Material":"Stainless Steel","Tip":"Serrated","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1450,stock:18,minOrderQty:1,tags:["forcep","crocodile","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Bandage Cutting Scissor 8 inch",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-BANDAGE-SCISSOR-8IN",description:"Bandage cutting scissor 8 inch with blunt tip for safe cutting.",specifications:{"Type":"Bandage Scissor","Length":"8 inches","Material":"Stainless Steel","Tip":"Blunt","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:650,stock:30,minOrderQty:1,tags:["scissor","bandage","surgical","Pacific Surgical"],isActive:true,isFeatured:true},
  {name:"Doyens Retractor",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-DOYENS-RETRACTOR",description:"Doyens retractor for surgical exposure and tissue retraction.",specifications:{"Type":"Doyens Retractor","Material":"Stainless Steel","Blade Width":"Variable","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1800,stock:15,minOrderQty:1,tags:["retractor","Doyens","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Nasal Speculum",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-NASAL-SPECULUM",description:"Nasal speculum for ENT examination and procedures.",specifications:{"Type":"Nasal Speculum","Material":"Stainless Steel","Opening":"Adjustable","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:950,stock:22,minOrderQty:1,tags:["speculum","nasal","ENT","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Thodicum Set",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-THODICUM-SET",description:"Thodicum set for ENT procedures.",specifications:{"Type":"Thodicum Set","Material":"Stainless Steel","Components":"Multiple","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:4500,stock:8,minOrderQty:1,tags:["Thodicum","ENT","surgical set","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"ENT Sucker Nozzle",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-ENT-SUCKER-NOZZLE",description:"ENT sucker nozzle for aspiration during procedures.",specifications:{"Type":"Sucker Nozzle","Material":"Stainless Steel","Diameter":"Variable","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:750,stock:25,minOrderQty:1,tags:["sucker","nozzle","ENT","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Bone Cutter Single Action",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-BONE-CUTTER-SINGLE",description:"Bone cutter single action for orthopedic procedures.",specifications:{"Type":"Bone Cutter","Action":"Single","Material":"Stainless Steel","Jaw":"Straight","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:2800,stock:12,minOrderQty:1,tags:["bone cutter","orthopedic","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Bone Cutter Double Action",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-BONE-CUTTER-DOUBLE",description:"Bone cutter double action for enhanced cutting power.",specifications:{"Type":"Bone Cutter","Action":"Double","Material":"Stainless Steel","Jaw":"Straight","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:3200,stock:10,minOrderQty:1,tags:["bone cutter","double action","orthopedic","Pacific Surgical"],isActive:true,isFeatured:true},
  {name:"Bone Nibbler",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-BONE-NIBBLER",description:"Bone nibbler for removing small pieces of bone.",specifications:{"Type":"Bone Nibbler","Material":"Stainless Steel","Jaw":"Curved","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:2400,stock:15,minOrderQty:1,tags:["bone nibbler","orthopedic","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Bone Holding Forcep",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-BONE-HOLDING",description:"Bone holding forcep for stabilizing bone during surgery.",specifications:{"Type":"Bone Holding Forcep","Material":"Stainless Steel","Grip":"Ratchet","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:2100,stock:18,minOrderQty:1,tags:["bone holding","forcep","orthopedic","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Devaki Forcep 6 inch",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-DEVAKI-FORCEP-6IN",description:"Devaki forcep 6 inch for tissue manipulation.",specifications:{"Type":"Devaki Forcep","Length":"6 inches","Material":"Stainless Steel","Tip":"Serrated","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1100,stock:20,minOrderQty:1,tags:["Devaki","forcep","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Devaki Forcep 8 inch",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-DEVAKI-FORCEP-8IN",description:"Devaki forcep 8 inch for tissue manipulation.",specifications:{"Type":"Devaki Forcep","Length":"8 inches","Material":"Stainless Steel","Tip":"Serrated","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1350,stock:18,minOrderQty:1,tags:["Devaki","forcep","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Proctoscope",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-PROCTOSCOPE",description:"Proctoscope for rectal examination and procedures.",specifications:{"Type":"Proctoscope","Material":"Stainless Steel","Diameter":"Variable","Length":"Variable","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1600,stock:15,minOrderQty:1,tags:["proctoscope","rectal","examination","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Foreign Body Hook",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-FOREIGN-BODY-HOOK",description:"Foreign body hook for removing foreign objects.",specifications:{"Type":"Foreign Body Hook","Material":"Stainless Steel","Tip":"Curved Hook","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:850,stock:22,minOrderQty:1,tags:["foreign body","hook","surgical","Pacific Surgical"],isActive:true,isFeatured:false},
  {name:"Lifter Forcep",brand:"Pacific Surgical",manufacturer:"Pakistan",category:"Surgical Instruments",sku:"PS-LIFTER-FORCEP",description:"Lifter forcep for tissue elevation and manipulation.",specifications:{"Type":"Lifter Forcep","Material":"Stainless Steel","Tip":"Curved","Sterilization":"Autoclavable"},certifications:["CE","ISO 13485"],price:1250,stock:20,minOrderQty:1,tags:["lifter","forcep","surgical","Pacific Surgical"],isActive:true,isFeatured:false}
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
