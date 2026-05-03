require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Product = require('./src/models/Product');
const Manufacturer = require('./src/models/Manufacturer');
const Category = require('./src/models/Category');

const LOCAL_URI = 'mongodb://localhost:27017/medcore-bd';
// Use the exact same URI format as the backend
const PRODUCTION_URI = 'mongodb+srv://Health_Care_E-commerce:ibQkT9ppTdivDtXt@cluster0.rqyzhey.mongodb.net/medcore-bd?retryWrites=true&w=majority&appName=Cluster0';

async function exportToProduction() {
  try {
    console.log('🚀 Starting data export to production...\n');
    
    // Connect to local database using default connection
    console.log('📍 Connecting to local MongoDB...');
    const localConn = mongoose.createConnection(LOCAL_URI);
    await localConn.asPromise();
    console.log('✅ Connected to local database');
    console.log('   Database:', localConn.db.databaseName);
    console.log('');
    
    // Connect to production database using default connection
    console.log('📍 Connecting to production MongoDB Atlas...');
    const prodConn = mongoose.createConnection(PRODUCTION_URI);
    await prodConn.asPromise();
    console.log('✅ Connected to production database');
    console.log('   Database:', prodConn.db.databaseName);
    console.log('   Host:', prodConn.host);
    console.log('');
    
    // Get models for both connections
    const LocalProduct = localConn.model('Product', Product.schema);
    const LocalManufacturer = localConn.model('Manufacturer', Manufacturer.schema);
    const LocalCategory = localConn.model('Category', Category.schema);
    
    const ProdProduct = prodConn.model('Product', Product.schema);
    const ProdManufacturer = prodConn.model('Manufacturer', Manufacturer.schema);
    const ProdCategory = prodConn.model('Category', Category.schema);
    
    // Export Categories
    console.log('📂 Exporting Categories...');
    const localCategories = await LocalCategory.find({}).lean();
    console.log(`   Found ${localCategories.length} categories in local DB`);
    
    for (const cat of localCategories) {
      await ProdCategory.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
    }
    const prodCatCount = await ProdCategory.countDocuments();
    console.log(`✅ Categories synced: ${prodCatCount} in production\n`);
    
    // Export Manufacturers
    console.log('🏭 Exporting Manufacturers...');
    const localManufacturers = await LocalManufacturer.find({}).lean();
    console.log(`   Found ${localManufacturers.length} manufacturers in local DB`);
    
    for (const mfr of localManufacturers) {
      await ProdManufacturer.findOneAndUpdate(
        { slug: mfr.slug },
        mfr,
        { upsert: true, new: true }
      );
    }
    const prodMfrCount = await ProdManufacturer.countDocuments();
    console.log(`✅ Manufacturers synced: ${prodMfrCount} in production\n`);
    
    // Export Products
    console.log('📦 Exporting Products...');
    
    // First, let's see what's in production
    const existingProdProducts = await ProdProduct.countDocuments();
    console.log(`   Current products in production: ${existingProdProducts}`);
    
    const localProducts = await LocalProduct.find({}).lean();
    console.log(`   Found ${localProducts.length} products in local DB`);
    console.log('   This may take 2-3 minutes...\n');
    
    // Delete all existing products in production to start fresh
    console.log('   🗑️  Clearing existing products in production...');
    await ProdProduct.deleteMany({});
    console.log('   ✅ Cleared\n');
    
    let added = 0;
    let failed = 0;
    
    for (let i = 0; i < localProducts.length; i++) {
      const product = localProducts[i];
      
      try {
        // Create new product
        await ProdProduct.create(product);
        added++;
        
        if ((i + 1) % 50 === 0) {
          console.log(`   Progress: ${i + 1}/${localProducts.length} products processed...`);
        }
      } catch (error) {
        console.error(`   ❌ Error with ${product.sku}: ${error.message}`);
        failed++;
      }
    }
    
    const prodProductCount = await ProdProduct.countDocuments();
    console.log(`\n✅ Products synced: ${prodProductCount} in production`);
    console.log(`   📊 Added: ${added}, Failed: ${failed}\n`);
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Export Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Products:       ${prodProductCount}`);
    console.log(`🏭 Manufacturers:  ${prodMfrCount}`);
    console.log(`📂 Categories:     ${prodCatCount}`);
    console.log('═══════════════════════════════════════\n');
    
    await localConn.close();
    await prodConn.close();
    
    console.log('✅ Database connections closed');
    console.log('\n🌐 Check your site: https://health-care-e-commerce-murex.vercel.app');
    console.log('📝 Next step: Add images using the browser console or API\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

exportToProduction();
