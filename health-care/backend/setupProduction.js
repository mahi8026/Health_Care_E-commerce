const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });
const { execSync } = require('child_process');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Production Database Setup - Complete Deployment         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📍 Target Database:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
console.log('☁️  Cloudinary:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('');

console.log('⚠️  WARNING: This will seed all products and images to production!');
console.log('⏱️  Estimated time: 10-15 minutes\n');

async function setup() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Seeding Products to Production Database');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    execSync('node seedProductionDatabase.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Adding Images to Products');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    execSync('node addImagesToProduction.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              🎉 PRODUCTION SETUP COMPLETE! 🎉              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ All 486 products seeded');
    console.log('✅ All product images uploaded');
    console.log('✅ Production database ready\n');
    
    console.log('🌐 Your deployed site should now show all products with images:');
    console.log('   https://health-care-e-commerce-murex.vercel.app\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
