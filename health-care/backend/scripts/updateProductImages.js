/**
 * Script: Update product images for Yamasu BP machine and Omron AC adapter.
 * Uses Cloudinary fetch URLs to proxy the images — avoids hotlink blocking.
 * Format: https://res.cloudinary.com/{cloud}/image/fetch/{url}
 *
 * Run from health-care/backend/:  node scripts/updateProductImages.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../src/models/Product');

// Cloudinary fetch base — proxies any public URL through Cloudinary CDN
const CLD = 'https://res.cloudinary.com/dm8eqxwlz/image/fetch/f_auto,q_auto,w_600';

const encode = (url) => encodeURIComponent(url);

const UPDATES = [
  {
    sku:    'YAM-500CE-BP',
    images: [
      {
        url:       `${CLD}/${encode('https://healthpointbd.com/wp-content/uploads/2025/06/YamasuAneroid-Analogue-Blood-Check-Blood-pressure-machine-machine01Rapid-Medical-bd-1-1.webp')}`,
        publicId:  '',
        isPrimary: true,
        alt:       'Yamasu Aneroid Sphygmomanometer Manual Blood Pressure Machine 500CE Made in Japan',
      },
      {
        url:       `${CLD}/${encode('https://healthpointbd.com/wp-content/uploads/2025/06/YAMASU-Manual-Blood-Pressure-Machine-banner-removebg-preview-1.png.webp')}`,
        publicId:  '',
        isPrimary: false,
        alt:       'Yamasu 500CE BP Machine side view',
      },
      {
        url:       `${CLD}/${encode('https://healthpointbd.com/wp-content/uploads/2025/06/yamasu-07-removebg-preview-4.png')}`,
        publicId:  '',
        isPrimary: false,
        alt:       'Yamasu 500CE blood pressure machine with accessories',
      },
    ],
  },
  {
    sku:    'OMR-ACW5-ADP',
    images: [
      {
        url:       `${CLD}/${encode('https://healthpointbd.com/wp-content/uploads/2024/12/omron-adapter-6volt-0.6A-500x500-1.jpeg')}`,
        publicId:  '',
        isPrimary: true,
        alt:       'Omron AC Adapter HEM-ACW5 6V for Digital Blood Pressure Monitor',
      },
      {
        url:       `${CLD}/${encode('https://healthpointbd.com/wp-content/uploads/2024/12/31gexVgRx0L.jpg')}`,
        publicId:  '',
        isPrimary: false,
        alt:       'Omron HEM-ACW5 adapter packaging',
      },
    ],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  for (const update of UPDATES) {
    const product = await Product.findOne({ sku: update.sku });
    if (!product) {
      console.log(`❌ NOT FOUND: ${update.sku}`);
      continue;
    }

    product.images = update.images;
    await product.save();

    console.log(`✅ UPDATED: ${update.sku} — ${product.name.substring(0, 60)}…`);
    console.log(`   Images: ${update.images.length}`);
    console.log(`   Primary URL (first 100 chars): ${update.images[0].url.substring(0, 100)}\n`);
  }

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
