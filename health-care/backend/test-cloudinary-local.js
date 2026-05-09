/**
 * Test Cloudinary Configuration on Localhost
 * Run: node test-cloudinary-local.js
 */

require('dotenv').config();

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         CLOUDINARY CONFIGURATION CHECK                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check environment variables
const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

console.log('📋 Environment Variables:\n');
console.log(`   CLOUDINARY_CLOUD_NAME: ${hasCloudName ? '✅ ' + process.env.CLOUDINARY_CLOUD_NAME : '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_KEY:    ${hasApiKey ? '✅ ' + process.env.CLOUDINARY_API_KEY.substring(0, 6) + '...' : '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_SECRET: ${hasApiSecret ? '✅ ***SET***' : '❌ NOT SET'}`);

const isConfigured = hasCloudName && hasApiKey && hasApiSecret;

console.log(`\n📊 Status: ${isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}\n`);

if (isConfigured) {
  console.log('🔌 Testing connection to Cloudinary...\n');
  
  const cloudinary = require('cloudinary').v2;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Connection successful!\n');
      console.log(`   Status: ${result.status || 'ok'}`);
      console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);
      console.log('🎉 Cloudinary is working correctly!\n');
      console.log('📝 Upload Mode: cloudinary (production-ready)\n');
    })
    .catch(error => {
      console.log('❌ Connection failed!\n');
      console.log(`   Error: ${error.message}\n`);
      console.log('🔧 Possible issues:');
      console.log('   - Check API credentials are correct');
      console.log('   - Verify internet connection');
      console.log('   - Check Cloudinary account status\n');
    });
} else {
  console.log('⚠️  Cloudinary NOT configured!\n');
  console.log('📝 Upload Mode: local-disk (development only)\n');
  console.log('🔧 To fix:');
  console.log('   1. Open backend/.env file');
  console.log('   2. Add these lines:');
  console.log('      CLOUDINARY_CLOUD_NAME=dm8eqxwlz');
  console.log('      CLOUDINARY_API_KEY=397344892624316');
  console.log('      CLOUDINARY_API_SECRET=TPAt1OgyLGu3vHBwPIRmt0jgbr8');
  console.log('   3. Restart the server\n');
}
