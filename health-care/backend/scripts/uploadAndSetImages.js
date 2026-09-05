/**
 * Script: Download product images from the web and upload to Cloudinary,
 * then update MongoDB with the real secure_url.
 *
 * Run from health-care/backend/:  node scripts/uploadAndSetImages.js
 */
require('dotenv').config();
const mongoose    = require('mongoose');
const cloudinary  = require('cloudinary').v2;
const https       = require('https');
const http        = require('http');
const Product     = require('../src/models/Product');

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helper: download URL to buffer ───────────────────────────────────────────
function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*',
        'Referer': 'https://healthpointbd.com/',
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Helper: upload buffer to Cloudinary ──────────────────────────────────────
function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         'MediportBD/products',
        public_id:      publicId,
        overwrite:      true,
        resource_type:  'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ── Product image definitions ─────────────────────────────────────────────────
const PRODUCTS = [
  {
    sku: 'YAM-500CE-BP',
    images: [
      {
        sourceUrl: 'https://healthpointbd.com/wp-content/uploads/2025/06/YamasuAneroid-Analogue-Blood-Check-Blood-pressure-machine-machine01Rapid-Medical-bd-1-1.webp',
        publicId:  'yamasu-500ce-bp-main',
        isPrimary: true,
        alt:       'Yamasu Aneroid Sphygmomanometer 500CE Manual Blood Pressure Machine Made in Japan',
      },
      {
        sourceUrl: 'https://healthpointbd.com/wp-content/uploads/2025/06/yamasu-07-removebg-preview-4.png',
        publicId:  'yamasu-500ce-bp-2',
        isPrimary: false,
        alt:       'Yamasu 500CE BP Machine with cuff and accessories',
      },
    ],
  },
  {
    sku: 'OMR-ACW5-ADP',
    images: [
      {
        sourceUrl: 'https://healthpointbd.com/wp-content/uploads/2024/12/omron-adapter-6volt-0.6A-500x500-1.jpeg',
        publicId:  'omron-acw5-adapter-main',
        isPrimary: true,
        alt:       'Omron AC Adapter HEM-ACW5 6V 500mA for Digital Blood Pressure Monitor',
      },
      {
        sourceUrl: 'https://healthpointbd.com/wp-content/uploads/2024/12/31gexVgRx0L.jpg',
        publicId:  'omron-acw5-adapter-2',
        isPrimary: false,
        alt:       'Omron HEM-ACW5 adapter packaging',
      },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  console.log(`✅ Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}\n`);

  for (const productDef of PRODUCTS) {
    console.log(`\n── Processing SKU: ${productDef.sku} ──`);

    const product = await Product.findOne({ sku: productDef.sku });
    if (!product) {
      console.log(`  ❌ Product not found: ${productDef.sku}`);
      continue;
    }

    const uploadedImages = [];

    for (const imgDef of productDef.images) {
      try {
        process.stdout.write(`  ⬇  Downloading ${imgDef.publicId}… `);
        const buffer = await downloadToBuffer(imgDef.sourceUrl);
        console.log(`${buffer.length} bytes`);

        process.stdout.write(`  ☁  Uploading to Cloudinary… `);
        const result = await uploadBuffer(buffer, imgDef.publicId);
        console.log(`✅ ${result.secure_url}`);

        uploadedImages.push({
          url:       result.secure_url,
          publicId:  result.public_id,
          isPrimary: imgDef.isPrimary,
          alt:       imgDef.alt,
        });
      } catch (err) {
        console.log(`\n  ⚠️  Failed: ${err.message} — skipping this image`);
      }
    }

    if (uploadedImages.length > 0) {
      product.images = uploadedImages;
      await product.save();
      console.log(`  💾 Saved ${uploadedImages.length} image(s) to product`);
    } else {
      console.log(`  ⚠️  No images uploaded — product images unchanged`);
    }
  }

  console.log('\n\n── All done ──────────────────────────\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
