require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const Category = require('../models/Category');

// M.R. TRADING INTERNATIONAL Products
const productsData = [
  // Glucometer Products (Page 1) - 13 products
  {name:"Quick Check Medicine",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-001",description:"Quick Check Medicine glucometer device",specifications:{"Pack Size":"25 Test","Origin":"Taiwan"},price:700,stock:50,tags:["glucometer","diabetes","blood glucose"],isActive:true,isFeatured:false},
  {name:"Quick Check Meter",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-002",description:"Quick Check Meter for blood glucose monitoring",specifications:{"Pack Size":"1 unit","Origin":"Taiwan"},price:330,stock:50,tags:["glucometer","diabetes","blood glucose meter"],isActive:true,isFeatured:false},
  {name:"Sugar Check Meter",brand:"M.R. Trading International",manufacturer:"Germany",category:"Diagnostic Equipment",sku:"MRT-GLU-003",description:"Sugar Check Meter for glucose testing",specifications:{"Pack Size":"1 unit","Origin":"Germany Technology"},price:500,stock:50,tags:["glucometer","diabetes","sugar meter"],isActive:true,isFeatured:false},
  {name:"Sugar Check Strip (Vial)",brand:"M.R. Trading International",manufacturer:"Germany",category:"Diagnostic Equipment",sku:"MRT-GLU-004",description:"Sugar Check test strips in vial packaging",specifications:{"Pack Size":"50 Test","Origin":"Germany Technology"},price:400,stock:100,tags:["test strips","diabetes","glucose strips"],isActive:true,isFeatured:false},
  {name:"Life Check Strip (TD)",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-006",description:"Life Check test strips TD variant",specifications:{"Pack Size":"50 Test","Origin":"Taiwan"},price:400,stock:100,tags:["test strips","diabetes","glucose strips"],isActive:true,isFeatured:false},
  {name:"API Machine",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-007",description:"API glucometer machine",specifications:{"Pack Size":"1 unit","Origin":"Taiwan"},price:300,stock:30,tags:["glucometer","diabetes","API"],isActive:true,isFeatured:false},
  {name:"BG Pro Machine",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-009",description:"BG Pro blood glucose machine",specifications:{"Pack Size":"1 unit","Origin":"Taiwan"},price:300,stock:30,tags:["glucometer","diabetes","BG Pro"],isActive:true,isFeatured:false},
  {name:"Urit G-28 Machine",brand:"M.R. Trading International",manufacturer:"China",category:"Diagnostic Equipment",sku:"MRT-GLU-010",description:"Urit G-28 glucometer machine",specifications:{"Pack Size":"1 unit","Origin":"China"},price:300,stock:30,tags:["glucometer","diabetes","Urit"],isActive:true,isFeatured:false},
  {name:"Urit G-28 Strip",brand:"M.R. Trading International",manufacturer:"China",category:"Diagnostic Equipment",sku:"MRT-GLU-011",description:"Urit G-28 test strips",specifications:{"Pack Size":"50 Test","Origin":"China"},price:300,stock:100,tags:["test strips","diabetes","Urit"],isActive:true,isFeatured:false},
  {name:"LS-9 Meter",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-013",description:"LS-9 blood glucose meter",specifications:{"Pack Size":"1 unit","Origin":"Taiwan"},price:500,stock:30,tags:["glucometer","diabetes","LS-9"],isActive:true,isFeatured:false},
  {name:"LS-9 Strip",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-014",description:"LS-9 test strips",specifications:{"Pack Size":"25 Test","Origin":"Taiwan"},price:200,stock:100,tags:["test strips","diabetes","LS-9"],isActive:true,isFeatured:false},
  {name:"Nadler Test Pen",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-015",description:"Nadler test pen for blood sampling",specifications:{"Pack Size":"100 Test","Origin":"Taiwan"},price:300,stock:50,tags:["lancing device","diabetes","test pen"],isActive:true,isFeatured:false},
  {name:"Lancing Pen",brand:"M.R. Trading International",manufacturer:"Taiwan",category:"Diagnostic Equipment",sku:"MRT-GLU-016",description:"Lancing pen for blood sampling",specifications:{"Pack Size":"1 unit","Origin":"Taiwan"},price:60,stock:100,tags:["lancing device","diabetes","pen"],isActive:true,isFeatured:false},

  // Equipment (Page 2) - 8 products
  {name:"Semi Auto Biochemistry Analyzer",brand:"M.R. Trading International",manufacturer:"Austria",category:"Hospital Machines",sku:"MRT-EQ-113",description:"Semi-automatic biochemistry analyzer for clinical laboratory",specifications:{"Origin":"Austria"},price:130000,stock:5,tags:["analyzer","biochemistry","lab equipment"],isActive:true,isFeatured:true},
  {name:"Auto Quantity Analyzer",brand:"M.R. Trading International",manufacturer:"China",category:"Hospital Machines",sku:"MRT-EQ-114",description:"Automatic quantity analyzer for laboratory testing",specifications:{"Origin":"China"},price:480000,stock:3,tags:["analyzer","automatic","lab equipment"],isActive:true,isFeatured:true},
  {name:"Hematology Analyzer 3-Part",brand:"M.R. Trading International",manufacturer:"China",category:"Hospital Machines",sku:"MRT-EQ-115",description:"Hematology analyzer with 3-part differential",specifications:{"Origin":"China"},price:320000,stock:5,tags:["hematology","analyzer","blood count"],isActive:true,isFeatured:true},
  {name:"Hormone Analyzer",brand:"M.R. Trading International",manufacturer:"Austria",category:"Hospital Machines",sku:"MRT-EQ-116",description:"Hormone analyzer for endocrine testing",specifications:{"Origin":"Austria"},price:150000,stock:3,tags:["hormone","analyzer","endocrine"],isActive:true,isFeatured:true},
  {name:"Electrolyte Analyzer 3-Part",brand:"M.R. Trading International",manufacturer:"Austria",category:"Hospital Machines",sku:"MRT-EQ-117",description:"Electrolyte analyzer for Na, K, Cl testing",specifications:{"Origin":"Austria"},price:155000,stock:5,tags:["electrolyte","analyzer","lab equipment"],isActive:true,isFeatured:true},
  {name:"ECG Machine 6 Channel",brand:"M.R. Trading International",manufacturer:"Austria",category:"Diagnostic Equipment",sku:"MRT-EQ-119",description:"ECG machine with 6-channel recording",specifications:{"Origin":"Austria"},price:50000,stock:10,tags:["ECG","cardiac","heart monitor"],isActive:true,isFeatured:true},
  {name:"ECG Machine 12 Channel",brand:"M.R. Trading International",manufacturer:"Austria",category:"Diagnostic Equipment",sku:"MRT-EQ-120",description:"ECG machine with 12-channel recording",specifications:{"Origin":"Austria"},price:90000,stock:10,tags:["ECG","cardiac","heart monitor"],isActive:true,isFeatured:true},

  // Crescent Diagnostic KSA (Page 7) - 27 products
  {name:"Crescent Glucose 250ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-001",description:"Glucose reagent 250ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"250ml","Origin":"KSA, Crescent"},price:500,stock:100,tags:["glucose","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Urea 2x50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-002",description:"Urea reagent 2x50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"2x50ml","Origin":"KSA, Crescent"},price:650,stock:100,tags:["urea","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Urea 2x100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-003",description:"Urea reagent 2x100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"2x100ml","Origin":"KSA, Crescent"},price:1200,stock:100,tags:["urea","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Bilirubin 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-004",description:"Bilirubin reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:850,stock:100,tags:["bilirubin","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Bilirubin 200ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-005",description:"Bilirubin reagent 200ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"200ml","Origin":"KSA, Crescent"},price:1600,stock:100,tags:["bilirubin","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Cholesterol 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-006",description:"Cholesterol reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:600,stock:100,tags:["cholesterol","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Cholesterol 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-007",description:"Cholesterol reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:1200,stock:100,tags:["cholesterol","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Cholesterol 1000ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-008",description:"Cholesterol reagent 1000ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"1000ml","Origin":"KSA, Crescent"},price:6000,stock:50,tags:["cholesterol","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Creatinine (k) 2x100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-009",description:"Creatinine kinetic reagent 2x100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"2x100ml","Origin":"KSA, Crescent"},price:1600,stock:100,tags:["creatinine","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Uric Acid 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-010",description:"Uric Acid reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:900,stock:100,tags:["uric acid","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Uric Acid 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-011",description:"Uric Acid reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:1600,stock:100,tags:["uric acid","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent HDL 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-012",description:"HDL reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:700,stock:100,tags:["HDL","cholesterol","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent HDL 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-013",description:"HDL reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:1300,stock:100,tags:["HDL","cholesterol","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent HDL 200ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-014",description:"HDL reagent 200ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"200ml","Origin":"KSA, Crescent"},price:2500,stock:100,tags:["HDL","cholesterol","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent Tg 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-015",description:"Triglycerides reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:1000,stock:100,tags:["triglycerides","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Tg 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-016",description:"Triglycerides reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:2000,stock:100,tags:["triglycerides","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Got/Gpt (K) 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-017",description:"GOT/GPT kinetic reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:900,stock:100,tags:["GOT","GPT","liver enzyme","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent Got/Gpt(K) 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-018",description:"GOT/GPT kinetic reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:1600,stock:100,tags:["GOT","GPT","liver enzyme","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent Got/Gpt(k) 1000ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-019",description:"GOT/GPT kinetic reagent 1000ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"1000ml","Origin":"KSA, Crescent"},price:8000,stock:50,tags:["GOT","GPT","liver enzyme","reagent"],isActive:true,isFeatured:false},
  {name:"Crescent Alkalain 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-020",description:"Alkaline Phosphatase reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:900,stock:100,tags:["alkaline phosphatase","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Alkalain 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-021",description:"Alkaline Phosphatase reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:1800,stock:100,tags:["alkaline phosphatase","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Calcium 2x50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-022",description:"Calcium reagent 2x50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"2x50ml","Origin":"KSA, Crescent"},price:1200,stock:100,tags:["calcium","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Albumin 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-023",description:"Albumin reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:450,stock:100,tags:["albumin","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Total Protein 100ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-024",description:"Total Protein reagent 100ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"100ml","Origin":"KSA, Crescent"},price:450,stock:100,tags:["total protein","reagent","biochemistry"],isActive:true,isFeatured:false},
  {name:"Crescent Hemoglobin 50ml",brand:"Crescent Diagnostic",manufacturer:"KSA",category:"Laboratory Reagents",sku:"MRT-CRE-025",description:"Hemoglobin reagent 50ml from Crescent Diagnostic KSA",specifications:{"Pack Size":"50ml","Origin":"KSA, Crescent"},price:800,stock:100,tags:["hemoglobin","reagent","hematology"],isActive:true,isFeatured:false},
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
          brand: manufacturer._id,  // Use manufacturer._id for brand field
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
