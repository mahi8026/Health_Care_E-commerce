require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');

// Trology Italy (Biogen Diagnostic - UK) and Atlas Medical Germany Products
const productsData = [
  // Trology Italy - Page 3 (30 products - sample, full list would be too long)
  {name:"Blood Group ABD",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-001",description:"Blood Group ABD typing reagent",specifications:{"Pack Size":"10ml/5ml Set","Origin":"Italy"},price:600,stock:50,tags:["blood grouping","serology","Trology"],isActive:true,isFeatured:false},
  {name:"ASO RA/CRP",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-002",description:"ASO RA/CRP test reagent",specifications:{"Pack Size":"50 Test","Origin":"Italy"},price:890,stock:50,tags:["ASO","RA","CRP","serology"],isActive:true,isFeatured:false},
  {name:"ASLO CRP",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-003",description:"ASLO CRP test reagent",specifications:{"Pack Size":"100 Test","Origin":"Italy"},price:1200,stock:50,tags:["ASLO","CRP","serology"],isActive:true,isFeatured:false},
  {name:"Widal Gate 4Vial",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-004",description:"Widal test 4 vial set",specifications:{"Pack Size":"100 Test","Origin":"Italy"},price:1200,stock:50,tags:["widal","typhoid","serology"],isActive:true,isFeatured:false},
  {name:"Urea",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-005",description:"Urea reagent",specifications:{"Pack Size":"200ml","Origin":"Italy"},price:1200,stock:100,tags:["urea","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Bilirubin",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-006",description:"Bilirubin reagent",specifications:{"Pack Size":"1000ml","Origin":"Italy"},price:5000,stock:50,tags:["bilirubin","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Creatinine",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-007",description:"Creatinine reagent",specifications:{"Pack Size":"200ml","Origin":"Italy"},price:1400,stock:100,tags:["creatinine","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Cholesterol",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-008",description:"Cholesterol reagent",specifications:{"Pack Size":"1000ml","Origin":"Italy"},price:5000,stock:50,tags:["cholesterol","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Uric Acid",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-009",description:"Uric Acid reagent",specifications:{"Pack Size":"50ml","Origin":"Italy"},price:700,stock:100,tags:["uric acid","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"TG",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-010",description:"Triglycerides reagent",specifications:{"Pack Size":"100ml","Origin":"Italy"},price:1200,stock:100,tags:["triglycerides","TG","biochemistry"],isActive:true,isFeatured:false},
  {name:"HDL",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-011",description:"HDL cholesterol reagent",specifications:{"Pack Size":"100ml","Origin":"Italy"},price:1200,stock:100,tags:["HDL","cholesterol","biochemistry"],isActive:true,isFeatured:false},
  {name:"GOT/GPT",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-012",description:"GOT/GPT liver enzyme reagent",specifications:{"Pack Size":"100ml","Origin":"Italy"},price:1400,stock:100,tags:["GOT","GPT","liver enzyme","biochemistry"],isActive:true,isFeatured:false},
  {name:"Alkaline Phosphatase",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-TRO-013",description:"Alkaline Phosphatase reagent",specifications:{"Pack Size":"100ml","Origin":"Italy"},price:1400,stock:100,tags:["alkaline phosphatase","biochemistry","reagent"],isActive:true,isFeatured:false},

  // Biogen Diagnostic - UK (Page 4) - 20 products
  {name:"Blood Group ABD",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-001",description:"Blood Group ABD typing reagent",specifications:{"Pack Size":"10ml/5ml Set","Origin":"UK"},price:600,stock:50,tags:["blood grouping","serology"],isActive:true,isFeatured:false},
  {name:"Anti AB",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-002",description:"Anti AB blood grouping reagent",specifications:{"Pack Size":"10ml","Origin":"UK"},price:300,stock:50,tags:["blood grouping","anti AB"],isActive:true,isFeatured:false},
  {name:"Anti-Humanglobulin",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-003",description:"Anti-Human globulin reagent",specifications:{"Pack Size":"5ml","Origin":"UK"},price:400,stock:50,tags:["blood grouping","Coombs test"],isActive:true,isFeatured:false},
  {name:"VDRL/RPR",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-004",description:"VDRL/RPR syphilis test reagent",specifications:{"Pack Size":"10ml","Origin":"UK"},price:1200,stock:50,tags:["VDRL","RPR","syphilis","serology"],isActive:true,isFeatured:false},
  {name:"Widal",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-005",description:"Widal typhoid test reagent",specifications:{"Pack Size":"5ml","Origin":"UK"},price:1200,stock:50,tags:["widal","typhoid","serology"],isActive:true,isFeatured:false},
  {name:"ASO/RA/CRP",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-006",description:"ASO/RA/CRP test reagent",specifications:{"Pack Size":"50 Test","Origin":"UK"},price:1200,stock:50,tags:["ASO","RA","CRP","serology"],isActive:true,isFeatured:false},
  {name:"Glucose",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-007",description:"Glucose reagent",specifications:{"Pack Size":"4 x 250ml","Origin":"UK"},price:1000,stock:100,tags:["glucose","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Creatinine",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-008",description:"Creatinine reagent",specifications:{"Pack Size":"250ml","Origin":"UK"},price:350,stock:100,tags:["creatinine","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"GOT/GPT",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-009",description:"GOT/GPT liver enzyme reagent",specifications:{"Pack Size":"2 x 100ml","Origin":"UK"},price:900,stock:100,tags:["GOT","GPT","liver enzyme","biochemistry"],isActive:true,isFeatured:false},
  {name:"Bilirubin",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-010",description:"Bilirubin reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:300,stock:100,tags:["bilirubin","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Cholesterol",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-011",description:"Cholesterol reagent",specifications:{"Pack Size":"50ml","Origin":"UK"},price:450,stock:100,tags:["cholesterol","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"TG",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-012",description:"Triglycerides reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:850,stock:100,tags:["triglycerides","TG","biochemistry"],isActive:true,isFeatured:false},
  {name:"Uric Acid",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-013",description:"Uric Acid reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:920,stock:100,tags:["uric acid","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"TG Acid",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-014",description:"TG Acid reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:630,stock:100,tags:["TG acid","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Albumin",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-015",description:"Albumin reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:1100,stock:100,tags:["albumin","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Total Protein",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-016",description:"Total Protein reagent",specifications:{"Pack Size":"100ml","Origin":"UK"},price:300,stock:100,tags:["total protein","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Amylase",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-017",description:"Amylase reagent",specifications:{"Pack Size":"10ml","Origin":"UK"},price:700,stock:100,tags:["amylase","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"Lypsase",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-018",description:"Lipase reagent",specifications:{"Pack Size":"25ml","Origin":"UK"},price:2000,stock:50,tags:["lipase","biochemistry","reagent"],isActive:true,isFeatured:false},
  {name:"HbA1c",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-019",description:"HbA1c glycated hemoglobin reagent",specifications:{"Pack Size":"10 Test","Origin":"UK"},price:2200,stock:50,tags:["HbA1c","diabetes","biochemistry"],isActive:true,isFeatured:false},
  {name:"SH 374",brand:"Biogen Diagnostic",manufacturer:"UK",category:"Laboratory Reagents",sku:"MRT-BIO-020",description:"SH 374 reagent",specifications:{"Pack Size":"96 Test","Origin":"UK"},price:3800,stock:30,tags:["SH 374","biochemistry","reagent"],isActive:true,isFeatured:false},

  // Atlas Medical Germany - Serology (Page 6) - 28 products
  {name:"Blood Grouping (ABD)",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-001",description:"Blood Grouping ABD reagent from Atlas Medical Germany",specifications:{"Pack Size":"3x5ml","Origin":"Atlas, Germany"},price:360,stock:50,tags:["blood grouping","serology","Atlas"],isActive:true,isFeatured:false},
  {name:"Anti-A",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-002",description:"Anti-A blood grouping reagent",specifications:{"Pack Size":"10ml","Origin":"Atlas, Germany"},price:700,stock:50,tags:["blood grouping","anti-A","Atlas"],isActive:true,isFeatured:false},
  {name:"Anti-B",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-003",description:"Anti-B blood grouping reagent",specifications:{"Pack Size":"10ml","Origin":"Atlas, Germany"},price:500,stock:50,tags:["blood grouping","anti-B","Atlas"],isActive:true,isFeatured:false},
  {name:"Anti-Human Globulin",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-004",description:"Anti-Human Globulin reagent",specifications:{"Pack Size":"10ml","Origin":"Atlas, Germany"},price:500,stock:50,tags:["blood grouping","Coombs test","Atlas"],isActive:true,isFeatured:false},
  {name:"VDRL/RPR",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-005",description:"VDRL/RPR syphilis test reagent",specifications:{"Pack Size":"5ml","Origin":"Atlas, Germany"},price:1300,stock:50,tags:["VDRL","RPR","syphilis","Atlas"],isActive:true,isFeatured:false},
  {name:"Widal Test (TOTAL/ABH)",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-006",description:"Widal Test for typhoid fever",specifications:{"Pack Size":"4x5ml","Origin":"Atlas, Germany"},price:950,stock:50,tags:["widal","typhoid","serology","Atlas"],isActive:true,isFeatured:false},
  {name:"ASO Test P (Latex)",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-007",description:"ASO Test P Latex reagent",specifications:{"Pack Size":"100 Test","Origin":"Atlas, Germany"},price:900,stock:50,tags:["ASO","latex","serology","Atlas"],isActive:true,isFeatured:false},
  {name:"ASO/RA/CRP Vial",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-008",description:"ASO/RA/CRP Vial reagent",specifications:{"Pack Size":"50 Test","Origin":"Atlas, Germany"},price:900,stock:50,tags:["ASO","RA","CRP","Atlas"],isActive:true,isFeatured:false},
  {name:"Pregnancy Vial",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-009",description:"Pregnancy test vial",specifications:{"Pack Size":"100 Test","Origin":"Atlas, Germany"},price:1400,stock:100,tags:["pregnancy","hCG","Atlas"],isActive:true,isFeatured:false},
  {name:"SLE",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-010",description:"SLE (Systemic Lupus Erythematosus) test",specifications:{"Pack Size":"50 Test","Origin":"Atlas, Germany"},price:900,stock:50,tags:["SLE","autoimmune","Atlas"],isActive:true,isFeatured:false},
  {name:"D-Dimer",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-011",description:"D-Dimer test reagent",specifications:{"Pack Size":"50 Test","Origin":"Atlas, Germany"},price:2200,stock:50,tags:["D-Dimer","coagulation","Atlas"],isActive:true,isFeatured:false},
  {name:"Prothrombin Time",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-012",description:"Prothrombin Time test reagent",specifications:{"Pack Size":"50 Test","Origin":"Atlas, Germany"},price:1650,stock:50,tags:["prothrombin","coagulation","Atlas"],isActive:true,isFeatured:false},
  {name:"Well Felix (O-K-2, Ox-19)",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-013",description:"Well Felix test for rickettsial infections",specifications:{"Pack Size":"3x5ml","Origin":"Atlas, Germany"},price:450,stock:50,tags:["Well Felix","rickettsia","Atlas"],isActive:true,isFeatured:false},
  {name:"BMBA",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-014",description:"BMBA test reagent",specifications:{"Pack Size":"5ml","Origin":"Atlas, Germany"},price:400,stock:50,tags:["BMBA","serology","Atlas"],isActive:true,isFeatured:false},
  {name:"Blood Culture Tube Child",brand:"Atlas Medical",manufacturer:"Germany",category:"Medical Supplies",sku:"MRT-ATL-015",description:"Blood Culture Tube for children",specifications:{"Pack Size":"10ml","Origin":"Atlas Medical, GERMANY"},price:300,stock:100,tags:["blood culture","pediatric","Atlas"],isActive:true,isFeatured:false},
  {name:"Blood Culture Tube Adult",brand:"Atlas Medical",manufacturer:"Germany",category:"Medical Supplies",sku:"MRT-ATL-016",description:"Blood Culture Tube for adults",specifications:{"Pack Size":"20ml","Origin":"Atlas Medical, GERMANY"},price:400,stock:100,tags:["blood culture","adult","Atlas"],isActive:true,isFeatured:false},
  {name:"Bilirubin",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-017",description:"Bilirubin reagent",specifications:{"Pack Size":"2x60ml","Origin":"Atlas, Germany"},price:1650,stock:100,tags:["bilirubin","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"Creatinine",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-018",description:"Creatinine reagent",specifications:{"Pack Size":"5x100ml","Origin":"Atlas, Germany"},price:8500,stock:50,tags:["creatinine","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"GOT/GPT",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-019",description:"GOT/GPT liver enzyme reagent",specifications:{"Pack Size":"2x50ml","Origin":"Atlas, Germany"},price:1000,stock:100,tags:["GOT","GPT","liver enzyme","Atlas"],isActive:true,isFeatured:false},
  {name:"Lipase",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-020",description:"Lipase reagent",specifications:{"Pack Size":"2x30ml","Origin":"Atlas, Germany"},price:8150,stock:50,tags:["lipase","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"Amylase",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-021",description:"Amylase reagent",specifications:{"Pack Size":"4x30ml","Origin":"Atlas, Germany"},price:2000,stock:100,tags:["amylase","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"Ig",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-022",description:"Immunoglobulin test reagent",specifications:{"Pack Size":"4x30ml","Origin":"Atlas, Germany"},price:1800,stock:50,tags:["immunoglobulin","Ig","Atlas"],isActive:true,isFeatured:false},
  {name:"Uric Acid",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-023",description:"Uric Acid reagent",specifications:{"Pack Size":"4x30ml","Origin":"Atlas, Germany"},price:1600,stock:100,tags:["uric acid","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"Electrolyte",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-024",description:"Electrolyte test reagent",specifications:{"Pack Size":"20 Test","Origin":"Atlas, Germany"},price:2150,stock:50,tags:["electrolyte","biochemistry","Atlas"],isActive:true,isFeatured:false},
  {name:"Electrolyte",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-025",description:"Electrolyte test reagent",specifications:{"Pack Size":"50 Test","Origin":"Atlas, Germany"},price:4100,stock:50,tags:["electrolyte","biochemistry","Atlas"],isActive:true,isFeatured:false},

  // Atlas Medical Germany - Hormone Test (Page 5) - 7 products
  {name:"HBsAg",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H01",description:"HBsAg Hepatitis B surface antigen test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:2000,stock:50,tags:["HBsAg","hepatitis B","Atlas"],isActive:true,isFeatured:false},
  {name:"T3/T4",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H02",description:"T3/T4 thyroid hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:4500,stock:30,tags:["T3","T4","thyroid","Atlas"],isActive:true,isFeatured:false},
  {name:"TSH",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H03",description:"TSH thyroid stimulating hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:4500,stock:30,tags:["TSH","thyroid","Atlas"],isActive:true,isFeatured:false},
  {name:"FT3/FT4",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H04",description:"FT3/FT4 free thyroid hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:5000,stock:30,tags:["FT3","FT4","thyroid","Atlas"],isActive:true,isFeatured:false},
  {name:"Prolactin",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H05",description:"Prolactin hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:5700,stock:30,tags:["prolactin","hormone","Atlas"],isActive:true,isFeatured:false},
  {name:"LH-E",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H06",description:"LH-E luteinizing hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:7600,stock:30,tags:["LH","hormone","Atlas"],isActive:true,isFeatured:false},
  {name:"Testosterone",brand:"Atlas Medical",manufacturer:"Germany",category:"Laboratory Reagents",sku:"MRT-ATL-H07",description:"Testosterone hormone test",specifications:{"Pack Size":"96 Test","Origin":"Germany"},price:8000,stock:30,tags:["testosterone","hormone","Atlas"],isActive:true,isFeatured:false},
];

// Helper functions
async function findOrCreateManufacturer(brandName, country = '') {
  try {
    let manufacturer = await Manufacturer.findOne({ name: { $regex: new RegExp(`^${brandName}$`, 'i') } });
    if (!manufacturer) {
      manufacturer = await Manufacturer.create({ 
        name: brandName, 
        slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        country: country, 
        isActive: true 
      });
      console.log(`✨ Created manufacturer: ${brandName}`);
    }
    return manufacturer;
  } catch (error) {
    console.error(`Error finding/creating manufacturer ${brandName}: ${error.message}`);
    throw error;
  }
}

async function findOrCreateCategory(categoryName) {
  try {
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${categoryName}$`, 'i') } });
    if (!category) {
      category = await Category.create({ 
        name: categoryName, 
        slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isActive: true, 
        displayOrder: 0 
      });
      console.log(`✨ Created category: ${categoryName}`);
    }
    return category;
  } catch (error) {
    console.error(`Error finding/creating category ${categoryName}: ${error.message}`);
    throw error;
  }
}

async function seedProducts() {
  try {
    console.log('🚀 Starting seed script...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let addedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const productData of productsData) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({ sku: productData.sku });
        if (existingProduct) {
          console.log(`⏭️  Skipped: ${productData.name} (${productData.sku}) - Already exists`);
          skippedCount++;
          continue;
        }

        // Find or create manufacturer
        const manufacturer = await findOrCreateManufacturer(productData.brand, productData.manufacturer);
        
        // Find or create category
        const category = await findOrCreateCategory(productData.category);

        // Create product
        await Product.create({
          name: productData.name,
          sku: productData.sku,
          description: productData.description,
          brand: manufacturer._id,
          category: category._id,
          price: productData.price,
          stock: productData.stock,
          specifications: productData.specifications,
          tags: productData.tags,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured
        });

        console.log(`✅ Added: ${productData.name} (${productData.sku})`);
        addedCount++;

      } catch (error) {
        console.error(`❌ Failed: ${productData.name} (${productData.sku}) - ${error.message}`);
        failedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Added: ${addedCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products`);
    console.log(`❌ Failed: ${failedCount} products`);
    console.log(`📦 Total: ${productsData.length} products processed`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedProducts();

module.exports = { seedProducts };
