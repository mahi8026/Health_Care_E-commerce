require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Serology Products from Page 2
const productsData = [
  // SEROLOGY FEBRILE ANTIGENS
  {name:"S. Typhi O Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF050305-S-TYPHI-O",description:"Salmonella Typhi O antigen for Widal test.",specifications:{"Test Parameter":"S. Typhi O","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:20,minOrderQty:1,tags:["Widal","typhoid","febrile antigen"],isActive:true,isFeatured:false},
  {name:"S. Typhi H Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF010305-S-TYPHI-H",description:"Salmonella Typhi H antigen for Widal test.",specifications:{"Test Parameter":"S. Typhi H","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:20,minOrderQty:1,tags:["Widal","typhoid"],isActive:true,isFeatured:false},
  {name:"S. Para Typhi AH Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF020305-S-PARA-TYPHI-AH",description:"Salmonella Para Typhi AH antigen.",specifications:{"Test Parameter":"S. Para Typhi AH","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:15,minOrderQty:1,tags:["paratyphoid","Widal"],isActive:true,isFeatured:false},
  {name:"S. Para Typhi BH Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF020305-S-PARA-TYPHI-BH",description:"Salmonella Para Typhi BH antigen.",specifications:{"Test Parameter":"S. Para Typhi BH","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:15,minOrderQty:1,tags:["paratyphoid","Widal"],isActive:true,isFeatured:false},
  {name:"Brucella Abortus Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF070305-BRUCELLA-ABORTUS",description:"Brucella abortus antigen for brucellosis testing.",specifications:{"Test Parameter":"Brucella Abortus","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["brucella","brucellosis"],isActive:true,isFeatured:false},
  {name:"Proteus OX2 Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF120305-PROTEUS-OX2",description:"Proteus OX2 antigen for Weil-Felix test.",specifications:{"Test Parameter":"Proteus OX2","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["Proteus","Weil-Felix"],isActive:true,isFeatured:false},
  {name:"Proteus OX19 Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SF130305-PROTEUS-OX19",description:"Proteus OX19 antigen for rickettsial disease.",specifications:{"Test Parameter":"Proteus OX19","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["Proteus","rickettsial"],isActive:true,isFeatured:false},
  {name:"Proteus OXK Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CT040025-PROTEUS-OXK",description:"Proteus OXK antigen.",specifications:{"Test Parameter":"Proteus OXK","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["Proteus"],isActive:true,isFeatured:false},
  {name:"Proteus OX2 Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CT050025-PROTEUS-OX2-2",description:"Proteus OX2 antigen alternate pack.",specifications:{"Test Parameter":"Proteus OX2","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["Proteus"],isActive:true,isFeatured:false},
  {name:"Proteus OX19 Febrile Antigen",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CT030025-PROTEUS-OX19-2",description:"Proteus OX19 antigen alternate pack.",specifications:{"Test Parameter":"Proteus OX19","Kit Size":"5 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:550,stock:12,minOrderQty:1,tags:["Proteus"],isActive:true,isFeatured:false},
  
  // SEROLOGY BLOOD GROUPING
  {name:"Anti-A Blood Grouping Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB020010-ANTI-A",description:"Anti-A blood grouping reagent for ABO typing.",specifications:{"Test Parameter":"Anti-A","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:200,stock:30,minOrderQty:1,tags:["blood grouping","ABO","Anti-A"],isActive:true,isFeatured:false},
  {name:"Anti-B Blood Grouping Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB020010-ANTI-B",description:"Anti-B blood grouping reagent for ABO typing.",specifications:{"Test Parameter":"Anti-B","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:200,stock:30,minOrderQty:1,tags:["blood grouping","ABO","Anti-B"],isActive:true,isFeatured:false},
  {name:"Anti-AB Blood Grouping Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB030010-ANTI-AB",description:"Anti-AB blood grouping reagent.",specifications:{"Test Parameter":"Anti-AB","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:400,stock:25,minOrderQty:1,tags:["blood grouping","Anti-AB"],isActive:true,isFeatured:false},
  {name:"Anti-D Blood Grouping Reagent",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB040010-ANTI-D",description:"Anti-D (Rh) blood grouping reagent.",specifications:{"Test Parameter":"Anti-D (Rh)","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:25,minOrderQty:1,tags:["blood grouping","Rh","Anti-D"],isActive:true,isFeatured:true},
  {name:"Bioslide Albumin 22% Solution",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB060010-BIOSLIDE-ALBUMIN",description:"Bioslide albumin 22% solution for blood grouping.",specifications:{"Concentration":"22%","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:750,stock:20,minOrderQty:1,tags:["albumin","blood grouping"],isActive:true,isFeatured:false},
  {name:"Coombs Anti-Human Globulin Polyspecific",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB060010-COOMBS-AHG",description:"Coombs anti-human globulin polyspecific reagent.",specifications:{"Type":"Polyspecific AHG","Kit Size":"10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:750,stock:15,minOrderQty:1,tags:["Coombs","AHG","blood bank"],isActive:true,isFeatured:false},
  {name:"Anti-A,B,D,U (M+H+G)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SB090030-ANTI-ABDU-MHG",description:"Complete blood grouping kit with Anti-A, B, D, and control.",specifications:{"Components":"Anti-A, Anti-B, Anti-D, Control","Kit Size":"3x10 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:20,minOrderQty:1,tags:["blood grouping","complete kit"],isActive:true,isFeatured:true},
  
  // SEROLOGY LATEX
  {name:"ASO Latex Only",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL001000-ASO-LATEX-ONLY",description:"ASO latex reagent for anti-streptolysin O detection.",specifications:{"Test Parameter":"ASO","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:2000,stock:15,minOrderQty:1,tags:["ASO","latex","streptococcal"],isActive:true,isFeatured:false},
  {name:"ASO Latex Slide Agglutination",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL001000-ASO-LATEX-SLIDE",description:"ASO latex slide agglutination test.",specifications:{"Test Parameter":"ASO","Method":"Slide Agglutination","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:150,stock:20,minOrderQty:1,tags:["ASO","latex"],isActive:true,isFeatured:false},
  {name:"CRP Latex Only",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL002000-CRP-LATEX-ONLY",description:"CRP latex reagent for C-reactive protein detection.",specifications:{"Test Parameter":"CRP","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:20,minOrderQty:1,tags:["CRP","latex","inflammation"],isActive:true,isFeatured:true},
  {name:"CRP Latex Slide Agglutination",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL002000-CRP-LATEX-SLIDE",description:"CRP latex slide agglutination test.",specifications:{"Test Parameter":"CRP","Method":"Slide Agglutination","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:200,stock:25,minOrderQty:1,tags:["CRP","latex"],isActive:true,isFeatured:false},
  {name:"RF Latex Only",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL003000-RF-LATEX-ONLY",description:"RF latex reagent for rheumatoid factor detection.",specifications:{"Test Parameter":"RF (Rheumatoid Factor)","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:18,minOrderQty:1,tags:["RF","rheumatoid factor","latex"],isActive:true,isFeatured:false},
  {name:"RF Latex Slide Agglutination",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL003000-RF-LATEX-SLIDE",description:"RF latex slide agglutination test.",specifications:{"Test Parameter":"RF","Method":"Slide Agglutination","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:150,stock:20,minOrderQty:1,tags:["RF","latex"],isActive:true,isFeatured:false},
  {name:"HCG Latex Only",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL003065-HCG-LATEX-ONLY",description:"HCG latex reagent for pregnancy testing.",specifications:{"Test Parameter":"HCG","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:25,minOrderQty:1,tags:["HCG","pregnancy","latex"],isActive:true,isFeatured:false},
  {name:"HCG Latex Slide Agglutination",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"SL003065-HCG-LATEX-SLIDE",description:"HCG latex slide agglutination pregnancy test.",specifications:{"Test Parameter":"HCG","Method":"Slide Agglutination","Kit Size":"100 TEST","Storage":"2-8°C"},certifications:["CE IVD"],price:750,stock:30,minOrderQty:1,tags:["HCG","pregnancy","latex"],isActive:true,isFeatured:true},
  
  // COAGULATION REAGENT
  {name:"Biograde PT (Prothrombin Time)",brand:"Generic",manufacturer:"China",category:"Laboratory Reagents",sku:"CO010063-BIOGRADE-PT",description:"Prothrombin time reagent for coagulation testing.",specifications:{"Test Parameter":"PT (Prothrombin Time)","Kit Size":"3 ML","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:15,minOrderQty:1,tags:["PT","prothrombin","coagulation"],isActive:true,isFeatured:false}
];

// Helper functions (same as before)
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
