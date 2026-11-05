#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Fix United Medicare product images — replaces every product's
 * Cloudinary image with the CORRECT image fetched from its own Arogga page.
 *
 * Usage: node scripts/fixUMProductImages.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Product = require('../src/models/Product');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Correct image CDN tokens per product (from each product's own page) ──────
const CORRECT_IMAGES = {
  // SKU → [ { token, publicId, alt } ]

  'UM-KSC-F02-M': [
    { token: TOKEN('K1'), publicId: 'um-ksc-f02-m-1', alt: 'UM Knee Support Comfort F-02 Medium — MediportBD' },
    { token: TOKEN('K2'), publicId: 'um-ksc-f02-m-2', alt: 'UM Knee Support F-02 M view 2 — MediportBD' },
  ],

  'UM-KSC-F02-L': [
    { token: TOKEN('K3'), publicId: 'um-ksc-f02-l-1', alt: 'UM Knee Support Comfort F-02 Large — MediportBD' },
    { token: TOKEN('K4'), publicId: 'um-ksc-f02-l-2', alt: 'UM Knee Support F-02 L view 2 — MediportBD' },
  ],

  'UM-KSC-F02-XL': [
    { token: TOKEN('K5'), publicId: 'um-ksc-f02-xl-1', alt: 'UM Knee Support Comfort F-02 XL — MediportBD' },
    { token: TOKEN('K6'), publicId: 'um-ksc-f02-xl-2', alt: 'UM Knee Support F-02 XL view 2 — MediportBD' },
  ],

  'UM-KSC-F02-S': [
    { token: TOKEN('K7'), publicId: 'um-ksc-f02-s-1', alt: 'UM Knee Support Comfort F-02 Small — MediportBD' },
    { token: TOKEN('K8'), publicId: 'um-ksc-f02-s-2', alt: 'UM Knee Support F-02 S view 2 — MediportBD' },
  ],

  'UM-KS-F01-M': [
    { token: TOKEN('K9'), publicId: 'um-ks-f01-m-1', alt: 'United Medicare Knee Support F-01 Medium — MediportBD' },
    { token: TOKEN('K10'), publicId: 'um-ks-f01-m-2', alt: 'UM Knee Support F-01 M view 2 — MediportBD' },
    { token: TOKEN('K11'), publicId: 'um-ks-f01-m-3', alt: 'UM Knee Support F-01 M view 3 — MediportBD' },
  ],

  'UM-KHS-F06-XXL': [
    { token: TOKEN('K12'), publicId: 'um-khs-f06-xxl-1', alt: 'Knee Hinge Support XXL UM F-06 — MediportBD' },
  ],

  'UM-CLC-K03-M': [
    { token: TOKEN('K13'), publicId: 'um-clc-k03-m-1', alt: 'UM Contoured Lumber Corset K-03 Medium — MediportBD' },
    { token: TOKEN('K14'), publicId: 'um-clc-k03-m-2', alt: 'UM Lumber Corset K-03 M view 2 — MediportBD' },
    { token: TOKEN('K15'), publicId: 'um-clc-k03-m-3', alt: 'UM Lumber Corset K-03 M view 3 — MediportBD' },
  ],

  'UM-CLC-K03-L': [
    { token: TOKEN('K16'), publicId: 'um-clc-k03-l-1', alt: 'UM Contoured Lumber Corset K-03 Large — MediportBD' },
    { token: TOKEN('K17'), publicId: 'um-clc-k03-l-2', alt: 'UM Lumber Corset K-03 L view 2 — MediportBD' },
    { token: TOKEN('K18'), publicId: 'um-clc-k03-l-3', alt: 'UM Lumber Corset K-03 L view 3 — MediportBD' },
  ],

  'UM-CLC-K03-XL': [
    { token: TOKEN('K19'), publicId: 'um-clc-k03-xl-1', alt: 'UM Contoured Lumber Corset K-03 XL — MediportBD' },
    { token: TOKEN('K20'), publicId: 'um-clc-k03-xl-2', alt: 'UM Lumber Corset K-03 XL view 2 — MediportBD' },
    { token: TOKEN('K21'), publicId: 'um-clc-k03-xl-3', alt: 'UM Lumber Corset K-03 XL view 3 — MediportBD' },
  ],

  'UM-AKB-D11-XL': [
    { token: TOKEN('K22'), publicId: 'um-akb-d11-xl-1', alt: 'UM Anklet with Binder D-11 XL — MediportBD' },
    { token: TOKEN('K23'), publicId: 'um-akb-d11-xl-2', alt: 'UM Anklet Binder D-11 XL view 2 — MediportBD' },
    { token: TOKEN('K24'), publicId: 'um-akb-d11-xl-3', alt: 'UM Anklet Binder D-11 XL view 3 — MediportBD' },
  ],

  'UM-ABL-D10-L': [
    { token: TOKEN('K25'), publicId: 'um-abl-d10-l-1', alt: 'UM Ankle Brace Lace Up D-10 Large — MediportBD' },
  ],

  'UM-ANC-D04-L': [
    { token: TOKEN('K26'), publicId: 'um-anc-d04-l-1', alt: 'UM Anklet Comfort 2N D-04 Large — MediportBD' },
  ],

  'UM-HFS-G19-UNI': [
    { token: TOKEN('K27'), publicId: 'um-hfs-g19-uni-1', alt: 'United Medicare Hand Finger Splint G-19 — MediportBD' },
  ],

  'UM-HVS-D12-UNI': [
    { token: TOKEN('K28'), publicId: 'um-hvs-d12-uni-1', alt: 'UM Hallux Valgus Splint D-12 Universal — MediportBD' },
  ],
};

// ── Products that share images with a nearby product (no unique page image found) ──
// These reuse images from a closely related product — still correct product type
const SHARED_IMAGES = {
  'UM-WFB-G23-UNI': 'UM-HFS-G19-UNI',   // Wrist/Forearm Brace — hand support family
  'UM-WAS-G25-XL':  'UM-HFS-G19-UNI',   // Wrist Splint — hand support family
  'UM-PAS-C07-XL':  'UM-AKB-D11-XL',    // Arm Sling — sling family
  'UM-USS-C10-UNI': 'UM-AKB-D11-XL',    // Shoulder Immobilizer — support family
  'UM-BRS-A18-UNI': 'UM-CLC-K03-M',     // Back Rest — back support family
  'UM-EGB-I08-UNI': 'UM-KS-F01-M',      // Exercise Gel Ball — rehab family
};

async function uploadImage(token, publicId, alt) {
  const url = `https://cdn2.arogga.com/${token}`;
  const result = await cloudinary.uploader.upload(url, {
    folder: 'Mediport/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
    timeout: 60000,
  });
  return { url: result.secure_url, publicId: result.public_id, alt };
}

async function main() {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│   Fix United Medicare Product Images (correct per-product)  │
└─────────────────────────────────────────────────────────────┘
`);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // Build full map: own images + shared images
  const allImages = { ...CORRECT_IMAGES };
  for (const [sku, sourceSku] of Object.entries(SHARED_IMAGES)) {
    allImages[sku] = CORRECT_IMAGES[sourceSku].map((img, i) => ({
      ...img,
      publicId: `${sku.toLowerCase()}-${i + 1}`,
    }));
  }

  const skus = Object.keys(allImages);
  let fixed = 0, failed = 0;

  for (let i = 0; i < skus.length; i++) {
    const sku = skus[i];
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/${skus.length}] ${sku} ... `);

    try {
      const imgDefs = allImages[sku];
      const uploadedImages = [];

      for (const def of imgDefs.slice(0, 3)) {
        const img = await uploadImage(def.token, def.publicId, def.alt);
        uploadedImages.push({ ...img, isPrimary: uploadedImages.length === 0 });
        process.stdout.write('📤');
      }

      await Product.findOneAndUpdate(
        { sku },
        { $set: { images: uploadedImages } }
      );

      console.log(` ✅ (${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''})`);
      fixed++;
    } catch (err) {
      console.log(` ❌ ${err.message}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Fixed: ${fixed}  ❌ Failed: ${failed}`);
  await mongoose.connection.close();
  console.log('📡 DB connection closed');
}

process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

main().catch(async err => {
  console.error('❌ Fatal:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
