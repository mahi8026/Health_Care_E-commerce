const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });
const mongoose = require('mongoose');

console.log('🚀 Production Database Seeding Script\n');
console.log('📍 Target Database:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
console.log('');

async function runAllSeeds() {
  try {
    // Connect to production database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Production)\n');
    
    console.log('📦 Running all seed scripts...\n');
    console.log('⚠️  This will take several minutes. Please wait...\n');
    
    // Import and run all seed scripts
    const seedScripts = [
      './src/scripts/seedAllBrands-complete.js',
      './src/scripts/seedGPLBiochemistry.js',
      './src/scripts/seedTurbilatex.js',
      './src/scripts/seedSerologyProducts.js',
      './src/scripts/seedBiochemistryPage3.js',
      './src/scripts/seedBSMIProducts.js',
      './src/scripts/seedPacificSurgical.js',
      './src/scripts/seedCareForceShantoProducts.js',
      './src/scripts/seedLabKitPadma.js',
      './src/scripts/seedGp1100Devices.js',
      './src/scripts/seedGenesisInternational.js',
      './src/scripts/seedSalmonellaLabInstruments.js',
      './src/scripts/seedMRTradingProducts.js',
      './src/scripts/seedTrologyAtlasProducts.js'
    ];
    
    let totalProducts = 0;
    
    for (let i = 0; i < seedScripts.length; i++) {
      const scriptPath = seedScripts[i];
      const scriptName = path.basename(scriptPath);
      
      console.log(`\n[${i + 1}/${seedScripts.length}] Running ${scriptName}...`);
      
      try {
        // Clear require cache to ensure fresh execution
        delete require.cache[require.resolve(scriptPath)];
        
        // Run the seed script
        const seedModule = require(scriptPath);
        
        // If the module exports a function, call it
        if (typeof seedModule === 'function') {
          await seedModule();
        }
        
        console.log(`✅ Completed ${scriptName}`);
      } catch (error) {
        console.error(`❌ Error in ${scriptName}:`, error.message);
      }
    }
    
    // Get final count
    const Product = require('./src/models/Product');
    const Manufacturer = require('./src/models/Manufacturer');
    const Category = require('./src/models/Category');
    
    const productCount = await Product.countDocuments();
    const manufacturerCount = await Manufacturer.countDocuments();
    const categoryCount = await Category.countDocuments();
    
    console.log('\n\n📊 Final Database Status:');
    console.log('✅ Products:', productCount);
    console.log('✅ Manufacturers:', manufacturerCount);
    console.log('✅ Categories:', categoryCount);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('\n🎉 All products seeded to production!');
    console.log('\n📝 Next step: Run "node addImagesToProduction.js" to add images');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runAllSeeds();
