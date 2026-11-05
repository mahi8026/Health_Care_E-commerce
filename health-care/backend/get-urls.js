const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('\n🔍 Searching for GPL images in Cloudinary...\n');
console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

// Try all possible folder locations
const foldersToTry = [
  'Mediport/products/gpl',
  'MediportBD/products/gpl',
  'Mediport/brands/gpl',
  'MediportBD/brands/gpl',
  'medcorebd/products/gpl',
  'Mediport/gpl',
  'MediportBD/gpl'
];

let foundIndex = 0;

function tryNextFolder() {
  if (foundIndex >= foldersToTry.length) {
    console.log('❌ No GPL images found in any folder\n');
    console.log('📁 Folders checked:');
    foldersToTry.forEach(f => console.log(`   - ${f}`));
    console.log('\n💡 Your Cloudinary has these root folders:');
    console.log('   - medcorebd');
    console.log('   - Mediport');
    console.log('   - MediportBD');
    console.log('   - samples\n');
    console.log('🎯 Please upload your 3 GPL images to one of:');
    console.log('   • Mediport/products/gpl/  (recommended)');
    console.log('   • MediportBD/products/gpl/');
    console.log('\n   Then run this script again.\n');
    process.exit(0);
    return;
  }

  const folder = foldersToTry[foundIndex];
  console.log(`🔍 Checking: ${folder}...`);

  cloudinary.api.resources(
    {
      type: 'upload',
      prefix: folder,
      max_results: 10
    },
    (error, result) => {
      if (!error && result.resources && result.resources.length > 0) {
        console.log(`\n✅ FOUND ${result.resources.length} images in ${folder}/:\n`);
        result.resources.forEach((r, i) => {
          const filename = r.public_id.split('/').pop();
          console.log(`${i+1}. ${filename}`);
          console.log(`   ${r.secure_url}\n`);
        });
        console.log('─'.repeat(70));
        console.log('\n📋 COPY THIS TO quick-add-gpl-images.js (line ~24):\n');
        console.log('const GPL_IMAGE_URLS = [');
        result.resources.slice(0, 3).forEach((r, i) => {
          console.log(`  '${r.secure_url}'${i < 2 ? ',' : ''}`);
        });
        console.log('];\n');
        process.exit(0);
      } else {
        foundIndex++;
        tryNextFolder();
      }
    }
  );
}

tryNextFolder();
