require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');
const logger = require('../utils/logger');

// Genesis International Products from Page 6-7 (ITP Series)
const productsData = [
  // Blood Grouping & Infectious Disease Tests
  {name:"Blood Grouping (ABO & Rh D) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-AB0-R",description:"Blood grouping test kit for ABO and Rh D determination.",specifications:{"Test Parameter":"ABO & Rh D","Type":"Rapid Test","Format":"Cassette","Specimen":"Whole Blood","Pack":"20 tests"},certifications:["CE","WB"],price:50,stock:100,minOrderQty:10,tags:["blood grouping","ABO","Rh D","Genesis"],isActive:true,isFeatured:false},
  
  // Hepatitis Tests
  {name:"Anti-HIV 1&2 Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HIV",description:"Anti-HIV 1&2 rapid test kit for HIV detection.",specifications:{"Test Parameter":"Anti-HIV 1&2","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:35,stock:80,minOrderQty:10,tags:["HIV","AIDS","infectious disease","Genesis"],isActive:true,isFeatured:true},
  {name:"Anti-HCV Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HCV",description:"Anti-HCV rapid test kit for Hepatitis C detection.",specifications:{"Test Parameter":"Anti-HCV","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:35,stock:80,minOrderQty:10,tags:["HCV","hepatitis C","infectious disease","Genesis"],isActive:true,isFeatured:true},
  {name:"HBs Ag Test Kit (Hepatitis B Surface Ag)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-AG-S",description:"HBsAg rapid test kit for Hepatitis B detection.",specifications:{"Test Parameter":"HBsAg","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"50 tests"},certifications:["CE"],price:24,stock:100,minOrderQty:10,tags:["HBsAg","hepatitis B","infectious disease","Genesis"],isActive:true,isFeatured:true},
  {name:"HBs Ag (Hepatitis B Surface Ag)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-AG-C",description:"HBsAg rapid test cassette for Hepatitis B detection.",specifications:{"Test Parameter":"HBsAg","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:24,stock:100,minOrderQty:10,tags:["HBsAg","hepatitis B","infectious disease","Genesis"],isActive:true,isFeatured:true},
  {name:"HBe Ab Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HBE-AB",description:"HBe antibody rapid test kit.",specifications:{"Test Parameter":"HBe Ab","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:40,stock:60,minOrderQty:10,tags:["HBe","hepatitis B","antibody","Genesis"],isActive:true,isFeatured:false},
  {name:"HBe Ag Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HBE-AG",description:"HBe antigen rapid test kit.",specifications:{"Test Parameter":"HBe Ag","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:40,stock:60,minOrderQty:10,tags:["HBe","hepatitis B","antigen","Genesis"],isActive:true,isFeatured:false},
  {name:"HBc Ab Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HBC-AB",description:"HBc antibody rapid test kit.",specifications:{"Test Parameter":"HBc Ab","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:40,stock:60,minOrderQty:10,tags:["HBc","hepatitis B","antibody","Genesis"],isActive:true,isFeatured:false},
  {name:"HBc IgM Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HBC-IGM",description:"HBc IgM rapid test kit for acute Hepatitis B infection.",specifications:{"Test Parameter":"HBc IgM","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:40,stock:60,minOrderQty:10,tags:["HBc IgM","hepatitis B","acute infection","Genesis"],isActive:true,isFeatured:false},
  {name:"HCV-HBsAg-Syphilis COMBO Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HHHS",description:"3-in-1 combo test for HCV, HBsAg, and Syphilis.",specifications:{"Test Parameter":"HCV+HBsAg+Syphilis","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:140,stock:40,minOrderQty:5,tags:["combo","HCV","HBsAg","syphilis","Genesis"],isActive:true,isFeatured:true},
  
  // Tropical Disease Tests
  {name:"Malaria HRP2/pLDH (Pf + Pan) Ag Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-M-PF+PAN",description:"Malaria rapid test for P.falciparum and Pan species detection.",specifications:{"Test Parameter":"Malaria Pf+Pan","Type":"Rapid Test","Format":"Cassette","Specimen":"Whole Blood","Pack":"40 tests"},certifications:["CE"],price:80,stock:60,minOrderQty:10,tags:["malaria","tropical disease","Pf","Pan","Genesis"],isActive:true,isFeatured:false},
  {name:"Dengue NS1 Ag Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-D-NS1",description:"Dengue NS1 antigen rapid test kit.",specifications:{"Test Parameter":"Dengue NS1","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:80,stock:60,minOrderQty:10,tags:["dengue","NS1","tropical disease","Genesis"],isActive:true,isFeatured:true},
  {name:"Dengue IgG/IgM/NS1 Panel Test CE",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-D-DUO",description:"Dengue combo test for IgG/IgM/NS1 detection.",specifications:{"Test Parameter":"Dengue IgG/IgM/NS1","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:260,stock:30,minOrderQty:5,tags:["dengue","combo","IgG","IgM","NS1","Genesis"],isActive:true,isFeatured:true},
  {name:"Dengue IgG/IgM Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-D-M/G",description:"Dengue IgG/IgM antibody rapid test kit.",specifications:{"Test Parameter":"Dengue IgG/IgM","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:140,stock:50,minOrderQty:10,tags:["dengue","IgG","IgM","antibody","Genesis"],isActive:true,isFeatured:false},
  
  // Cardiac Markers
  {name:"Troponin I Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-TRO-I",description:"Troponin I rapid test kit for cardiac assessment.",specifications:{"Test Parameter":"Troponin I","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:120,stock:50,minOrderQty:10,tags:["troponin","cardiac","heart attack","Genesis"],isActive:true,isFeatured:true},
  {name:"CK-MB Test Kit (Cardiac Marker)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-CK-MB",description:"CK-MB rapid test kit for cardiac assessment.",specifications:{"Test Parameter":"CK-MB","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:100,stock:50,minOrderQty:10,tags:["CK-MB","cardiac","heart attack","Genesis"],isActive:true,isFeatured:false},
  
  // Respiratory Tests
  {name:"Tuberculosis (TB) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-TB",description:"Tuberculosis antibody rapid test kit.",specifications:{"Test Parameter":"TB Antibody","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:100,stock:50,minOrderQty:10,tags:["tuberculosis","TB","respiratory","Genesis"],isActive:true,isFeatured:false},
  {name:"M.Pneumoniae (MP) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-MP",description:"Mycoplasma pneumoniae antibody rapid test kit.",specifications:{"Test Parameter":"M.Pneumoniae","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"25 tests"},certifications:["CE"],price:200,stock:40,minOrderQty:5,tags:["mycoplasma","pneumonia","respiratory","Genesis"],isActive:true,isFeatured:false},
  {name:"Flu A/B (Respiratory Diseases) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-FLU-A/B",description:"Influenza A/B rapid test kit for respiratory disease detection.",specifications:{"Test Parameter":"Flu A/B","Type":"Rapid Test","Format":"Cassette","Specimen":"Nasal Secretions","Pack":"25 tests"},certifications:["CE"],price:300,stock:40,minOrderQty:5,tags:["influenza","flu","respiratory","Genesis"],isActive:true,isFeatured:true},
  {name:"SARS-CoV-2 IgG/IgM Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-C-19-AG",description:"SARS-CoV-2 antibody rapid test kit for COVID-19 detection.",specifications:{"Test Parameter":"SARS-CoV-2 IgG/IgM","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"25 tests"},certifications:["CE"],price:400,stock:60,minOrderQty:10,tags:["COVID-19","SARS-CoV-2","antibody","Genesis"],isActive:true,isFeatured:true},
  {name:"SARS-CoV-2 Antigen(Respiratory Diseases) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-C-19-GM",description:"SARS-CoV-2 antigen rapid test kit for COVID-19 detection.",specifications:{"Test Parameter":"SARS-CoV-2 Antigen","Type":"Rapid Test","Format":"Cassette","Specimen":"Nasopharyngeal","Pack":"25 tests"},certifications:["CE"],price:300,stock:60,minOrderQty:10,tags:["COVID-19","SARS-CoV-2","antigen","Genesis"],isActive:true,isFeatured:true},
  {name:"SARS-CoV-2 IgG/IgM (Respiratory Diseases) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-C-GM",description:"SARS-CoV-2 IgG/IgM antibody test for COVID-19.",specifications:{"Test Parameter":"SARS-CoV-2 IgG/IgM","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"25 tests"},certifications:["CE"],price:300,stock:60,minOrderQty:10,tags:["COVID-19","SARS-CoV-2","IgG","IgM","Genesis"],isActive:true,isFeatured:false},
  
  // Gastrointestinal Tests
  {name:"H.Pylori Ab Test Kit (Enteric Diseases)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HP-AB",description:"H.Pylori antibody rapid test kit for gastric infection detection.",specifications:{"Test Parameter":"H.Pylori Ab","Type":"Rapid Test","Format":"Cassette","Specimen":"Serum/Plasma","Pack":"40 tests"},certifications:["CE"],price:80,stock:60,minOrderQty:10,tags:["H.Pylori","gastric","infection","Genesis"],isActive:true,isFeatured:false},
  {name:"H.Pylori Antigen Test Kit (Enteric Diseases)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-HP-AG",description:"H.Pylori antigen rapid test kit for gastric infection detection.",specifications:{"Test Parameter":"H.Pylori Antigen","Type":"Rapid Test","Format":"Cassette","Specimen":"Feces","Pack":"20 tests"},certifications:["CE"],price:180,stock:40,minOrderQty:5,tags:["H.Pylori","gastric","antigen","Genesis"],isActive:true,isFeatured:false},
  {name:"Rota/Adenovirus Test Kit (Enteric Diseases)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-R-AV",description:"Rotavirus/Adenovirus combo rapid test kit.",specifications:{"Test Parameter":"Rota/Adenovirus","Type":"Rapid Test","Format":"Cassette","Specimen":"Feces","Pack":"20 tests"},certifications:["CE"],price:300,stock:35,minOrderQty:5,tags:["rotavirus","adenovirus","enteric","Genesis"],isActive:true,isFeatured:false},
  {name:"Rotavirus Test Kit (Enteric Diseases)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-RV",description:"Rotavirus rapid test kit for gastroenteritis detection.",specifications:{"Test Parameter":"Rotavirus","Type":"Rapid Test","Format":"Cassette","Specimen":"Feces","Pack":"20 tests"},certifications:["CE"],price:200,stock:40,minOrderQty:5,tags:["rotavirus","gastroenteritis","enteric","Genesis"],isActive:true,isFeatured:false},
  {name:"Adenovirus Test Kit (Enteric Diseases)",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-AV",description:"Adenovirus rapid test kit for gastroenteritis detection.",specifications:{"Test Parameter":"Adenovirus","Type":"Rapid Test","Format":"Cassette","Specimen":"Feces","Pack":"20 tests"},certifications:["CE"],price:200,stock:40,minOrderQty:5,tags:["adenovirus","gastroenteritis","enteric","Genesis"],isActive:true,isFeatured:false},
  
  // Syphilis Tests
  {name:"Syphilis /Treponema Palladium (TP) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-SYP-S",description:"Syphilis/TP rapid test kit for STD detection.",specifications:{"Test Parameter":"Syphilis/TP","Type":"Rapid Test","Format":"Strip","Specimen":"S/P/WB","Pack":"50 tests"},certifications:["CE"],price:16,stock:100,minOrderQty:20,tags:["syphilis","TP","STD","Genesis"],isActive:true,isFeatured:false},
  {name:"Syphilis /Treponema Palladium (TP) Test Kit",brand:"Genesis International",manufacturer:"India",category:"Diagnostic Equipment",sku:"ITP-SYP-C",description:"Syphilis/TP rapid test cassette for STD detection.",specifications:{"Test Parameter":"Syphilis/TP","Type":"Rapid Test","Format":"Cassette","Specimen":"S/P/WB","Pack":"40 tests"},certifications:["CE"],price:30,stock:80,minOrderQty:10,tags:["syphilis","TP","STD","Genesis"],isActive:true,isFeatured:false}
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
