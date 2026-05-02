require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Salmonella Antigens & Lab Instruments from Page 8
const productsData = [
  // Salmonella Antigens
  {name:"S. Typhi-O Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2139005-TYPHI-O",description:"Salmonella Typhi-O antigen for Widal test.",specifications:{"Test Parameter":"S. Typhi-O","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","typhi","widal","antigen"],isActive:true,isFeatured:false},
  {name:"S. Typhi-H Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2135005-TYPHI-H",description:"Salmonella Typhi-H antigen for Widal test.",specifications:{"Test Parameter":"S. Typhi-H","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","typhi","widal","antigen"],isActive:true,isFeatured:false},
  {name:"S. Paratyphi-AH Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2113005-PARATYPHI-AH",description:"Salmonella Paratyphi-AH antigen for Widal test.",specifications:{"Test Parameter":"S. Paratyphi-AH","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","paratyphi","widal","antigen"],isActive:true,isFeatured:false},
  {name:"S. Paratyphi-BH Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2119005-PARATYPHI-BH",description:"Salmonella Paratyphi-BH antigen for Widal test.",specifications:{"Test Parameter":"S. Paratyphi-BH","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","paratyphi","widal","antigen"],isActive:true,isFeatured:false},
  {name:"S. Paratyphi-AO Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2117005-PARATYPHI-AO",description:"Salmonella Paratyphi-AO antigen for Widal test.",specifications:{"Test Parameter":"S. Paratyphi-AO","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","paratyphi","widal","antigen"],isActive:true,isFeatured:false},
  {name:"S. Paratyphi-BO Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SAL-2123005-PARATYPHI-BO",description:"Salmonella Paratyphi-BO antigen for Widal test.",specifications:{"Test Parameter":"S. Paratyphi-BO","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:500,stock:30,minOrderQty:5,tags:["salmonella","paratyphi","widal","antigen"],isActive:true,isFeatured:false},
  
  // Brucella Antigens
  {name:"Brucella Abortus Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"BRU-2100005-ABORTUS",description:"Brucella Abortus antigen for brucellosis detection.",specifications:{"Test Parameter":"Brucella Abortus","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:25,minOrderQty:5,tags:["brucella","abortus","brucellosis","antigen"],isActive:true,isFeatured:false},
  {name:"Brucella Melitensis Antigen 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"BRU-2104005-MELITENSIS",description:"Brucella Melitensis antigen for brucellosis detection.",specifications:{"Test Parameter":"Brucella Melitensis","Pack Size":"5ml","Method":"Slide Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:600,stock:25,minOrderQty:5,tags:["brucella","melitensis","brucellosis","antigen"],isActive:true,isFeatured:false},
  
  // Serology Tests
  {name:"ASLO/ASO Latex (Antigen) Only vial 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2340012-ASLO-VIAL",description:"ASLO/ASO Latex antigen only vial for 100 tests.",specifications:{"Test Parameter":"ASLO/ASO","Pack Size":"100 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:1400,stock:20,minOrderQty:2,tags:["ASLO","ASO","latex","serology"],isActive:true,isFeatured:false},
  {name:"ASLO/ASO Latex (With Slide & Control) 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2340010-ASLO-COMPLETE",description:"ASLO/ASO Latex complete kit with slide and control for 100 tests.",specifications:{"Test Parameter":"ASLO/ASO","Pack Size":"100 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:2000,stock:20,minOrderQty:2,tags:["ASLO","ASO","latex","complete kit"],isActive:true,isFeatured:true},
  {name:"ASLO/ASO Latex (Antigen) Only vial 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2340015-ASLO-VIAL-50",description:"ASLO/ASO Latex antigen only vial for 50 tests.",specifications:{"Test Parameter":"ASLO/ASO","Pack Size":"50 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:850,stock:25,minOrderQty:5,tags:["ASLO","ASO","latex","serology"],isActive:true,isFeatured:false},
  {name:"ASLO/ASO Latex (With Slide & Control) 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2340005-ASLO-COMPLETE-50",description:"ASLO/ASO Latex complete kit with slide and control for 50 tests.",specifications:{"Test Parameter":"ASLO/ASO","Pack Size":"50 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:25,minOrderQty:5,tags:["ASLO","ASO","latex","complete kit"],isActive:true,isFeatured:false},
  
  {name:"RF/RA Latex (Antigen) Only vial 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2355012-RF-VIAL",description:"RF/RA Latex antigen only vial for 100 tests.",specifications:{"Test Parameter":"RF/RA","Pack Size":"100 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:1400,stock:20,minOrderQty:2,tags:["RF","RA","rheumatoid","latex"],isActive:true,isFeatured:false},
  {name:"RF/RA Latex (With Slide & Control) 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2355010-RF-COMPLETE",description:"RF/RA Latex complete kit with slide and control for 100 tests.",specifications:{"Test Parameter":"RF/RA","Pack Size":"100 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:20,minOrderQty:2,tags:["RF","RA","rheumatoid","complete kit"],isActive:true,isFeatured:true},
  {name:"RF/RA Latex (Antigen) Only vial 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2355015-RF-VIAL-50",description:"RF/RA Latex antigen only vial for 50 tests.",specifications:{"Test Parameter":"RF/RA","Pack Size":"50 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:850,stock:25,minOrderQty:5,tags:["RF","RA","rheumatoid","latex"],isActive:true,isFeatured:false},
  {name:"RF/RA Latex (With Slide & Control) 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2355005-RF-COMPLETE-50",description:"RF/RA Latex complete kit with slide and control for 50 tests.",specifications:{"Test Parameter":"RF/RA","Pack Size":"50 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:25,minOrderQty:5,tags:["RF","RA","rheumatoid","complete kit"],isActive:true,isFeatured:false},
  {name:"RF Waaler/Rose Waaler (With Slide & Control) 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2375010-RF-WAALER",description:"RF Waaler/Rose Waaler complete kit with slide and control for 100 tests.",specifications:{"Test Parameter":"RF Waaler/Rose","Pack Size":"100 Test","Method":"Waaler-Rose","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:2700,stock:15,minOrderQty:2,tags:["RF","Waaler","Rose","rheumatoid"],isActive:true,isFeatured:false},
  
  {name:"RPR/VDRL (Antigen) Only vial 5ml",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2510020-RPR-VIAL",description:"RPR/VDRL antigen only vial 5ml for syphilis screening.",specifications:{"Test Parameter":"RPR/VDRL","Pack Size":"5ml","Method":"Flocculation","Storage":"2-8°C"},certifications:["CE IVD"],price:750,stock:30,minOrderQty:5,tags:["RPR","VDRL","syphilis","screening"],isActive:true,isFeatured:false},
  {name:"RPR/VDRL (With Slide & Control) 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2510010-RPR-COMPLETE",description:"RPR/VDRL complete kit with slide and control for 100 tests.",specifications:{"Test Parameter":"RPR/VDRL","Pack Size":"100 Test","Method":"Flocculation","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1750,stock:25,minOrderQty:2,tags:["RPR","VDRL","syphilis","complete kit"],isActive:true,isFeatured:true},
  
  {name:"CRP Latex (Antigen) Only vial 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2410012-CRP-VIAL",description:"CRP Latex antigen only vial for 100 tests.",specifications:{"Test Parameter":"CRP","Pack Size":"100 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:1400,stock:20,minOrderQty:2,tags:["CRP","inflammation","latex"],isActive:true,isFeatured:false},
  {name:"CRP Latex (With Slide & Control) 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2410010-CRP-COMPLETE",description:"CRP Latex complete kit with slide and control for 100 tests.",specifications:{"Test Parameter":"CRP","Pack Size":"100 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1800,stock:20,minOrderQty:2,tags:["CRP","inflammation","complete kit"],isActive:true,isFeatured:true},
  {name:"CRP Latex (Antigen) Only vial 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2410015-CRP-VIAL-50",description:"CRP Latex antigen only vial for 50 tests.",specifications:{"Test Parameter":"CRP","Pack Size":"50 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:850,stock:25,minOrderQty:5,tags:["CRP","inflammation","latex"],isActive:true,isFeatured:false},
  {name:"CRP Latex (With Slide & Control) 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2410005-CRP-COMPLETE-50",description:"CRP Latex complete kit with slide and control for 50 tests.",specifications:{"Test Parameter":"CRP","Pack Size":"50 Test","Method":"Latex Agglutination","Includes":"Slide & Control","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:25,minOrderQty:5,tags:["CRP","inflammation","complete kit"],isActive:true,isFeatured:false},
  {name:"hCG Pregnancy Latex (Antigen) Only vial 100 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2610017-HCG-VIAL",description:"hCG Pregnancy Latex antigen only vial for 100 tests.",specifications:{"Test Parameter":"hCG","Pack Size":"100 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:2000,stock:20,minOrderQty:2,tags:["hCG","pregnancy","latex"],isActive:true,isFeatured:false},
  {name:"hCG Pregnancy Latex (Antigen) Only vial 50 Test",brand:"Generic",manufacturer:"Spain",category:"Laboratory Reagents",sku:"SER-2610010-HCG-VIAL-50",description:"hCG Pregnancy Latex antigen only vial for 50 tests.",specifications:{"Test Parameter":"hCG","Pack Size":"50 Test","Method":"Latex Agglutination","Storage":"2-8°C"},certifications:["CE IVD"],price:1600,stock:25,minOrderQty:5,tags:["hCG","pregnancy","latex"],isActive:true,isFeatured:false},
  
  // Lab Instruments
  {name:"TEMIS Semi Automatic Clinical Chemistry Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-1803050-TEMIS",description:"TEMIS semi-automatic clinical chemistry analyzer.",specifications:{"Type":"Semi-Automatic","Parameters":"Multiple","Display":"LCD","Throughput":"Variable","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["analyzer","chemistry","semi-automatic","TEMIS"],isActive:true,isFeatured:false},
  {name:"KROMA Fully Automated Chemistry Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-1800050-KROMA",description:"KROMA fully automated chemistry analyzer.",specifications:{"Type":"Fully Automated","Parameters":"Multiple","Display":"Touchscreen","Throughput":"High","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["analyzer","chemistry","automated","KROMA"],isActive:true,isFeatured:true},
  {name:"KROMA Plus Fully Automated Chemistry Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-1800100-KROMA-PLUS",description:"KROMA Plus fully automated chemistry analyzer with advanced features.",specifications:{"Type":"Fully Automated","Parameters":"Multiple","Display":"Touchscreen","Throughput":"High","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["analyzer","chemistry","automated","KROMA Plus"],isActive:true,isFeatured:true},
  {name:"LIDA 500 Automatic Clinical Chemistry Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-1805500-LIDA-500",description:"LIDA 500 automatic clinical chemistry analyzer.",specifications:{"Type":"Automatic","Parameters":"Multiple","Throughput":"500 tests/hour","Display":"Touchscreen","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["analyzer","chemistry","automatic","LIDA 500"],isActive:true,isFeatured:true},
  {name:"IRIA ESR Machine 5 hole",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-5810005-IRIA-5",description:"IRIA ESR machine with 5 holes for erythrocyte sedimentation rate testing.",specifications:{"Type":"ESR Machine","Holes":"5","Method":"Westergren","Timer":"Yes"},certifications:["CE"],price:0,stock:5,minOrderQty:1,tags:["ESR","machine","IRIA","5 hole"],isActive:true,isFeatured:false},
  {name:"LEXA NE ESR Machine 20 hole (With Printer)",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-5810030-LEXA-20",description:"LEXA NE ESR machine with 20 holes and built-in printer.",specifications:{"Type":"ESR Machine","Holes":"20","Method":"Westergren","Printer":"Built-in","Timer":"Yes"},certifications:["CE"],price:0,stock:3,minOrderQty:1,tags:["ESR","machine","LEXA","20 hole","printer"],isActive:true,isFeatured:true},
  {name:"THERMA NE ESR Machine 100 hole (With Printer)",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-5810025-THERMA-100",description:"THERMA NE ESR machine with 100 holes and built-in printer.",specifications:{"Type":"ESR Machine","Holes":"100","Method":"Westergren","Printer":"Built-in","Timer":"Yes"},certifications:["CE"],price:0,stock:2,minOrderQty:1,tags:["ESR","machine","THERMA","100 hole","printer"],isActive:true,isFeatured:true},
  {name:"Plus-Sed Auto Plastic ESR Tube (1.5ml) 6x100pcs pkt",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Medical Supplies",sku:"LAB-5220060-ESR-TUBE",description:"Plus-Sed auto plastic ESR tubes 1.5ml, pack of 6x100 pieces.",specifications:{"Type":"ESR Tube","Volume":"1.5ml","Material":"Plastic","Pack":"6x100 pcs"},certifications:["CE"],price:0,stock:50,minOrderQty:5,tags:["ESR tube","plastic","disposable"],isActive:true,isFeatured:false},
  {name:"STEL 3 Hematology Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-3802000-STEL-3",description:"STEL 3 hematology analyzer for complete blood count.",specifications:{"Type":"Hematology Analyzer","Parameters":"3-part differential","Display":"LCD","Throughput":"60 samples/hour","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["hematology","analyzer","CBC","STEL 3"],isActive:true,isFeatured:false},
  {name:"STEL 5 Hematology Analyzer",brand:"LAB INSTRUMENTS",manufacturer:"Spain",category:"Hospital Machines",sku:"LAB-3803000-STEL-5",description:"STEL 5 hematology analyzer with 5-part differential.",specifications:{"Type":"Hematology Analyzer","Parameters":"5-part differential","Display":"LCD","Throughput":"80 samples/hour","Power":"AC 220V"},certifications:["CE","ISO 13485"],price:0,stock:2,minOrderQty:1,tags:["hematology","analyzer","CBC","STEL 5"],isActive:true,isFeatured:true}
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
