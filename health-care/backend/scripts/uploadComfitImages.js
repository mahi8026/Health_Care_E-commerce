#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Upload real Comfit glove images from Arogga CDN → Cloudinary
 * then update the three product records in MongoDB.
 *
 * Usage: node scripts/uploadComfitImages.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Product = require('../src/models/Product');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Real image URLs decoded from Arogga's _next/image src ──────────────────
// Product 74708 – Examination Gloves Medium
const IMG_EXAM_M =
  `https://cdn2.arogga.com/${TOKEN('K1')}`;

// Product 81046 – Examination Gloves Large
const IMG_EXAM_L =
  `https://cdn2.arogga.com/${TOKEN('K2')}`;

// Product 59620 – Surgical Hand Gloves (2 images)
const IMG_SURG_1 =
  `https://cdn2.arogga.com/${TOKEN('K3')}`;

const IMG_SURG_2 =
  `https://cdn2.arogga.com/${TOKEN('K4')}`;

// ── Upload one URL to Cloudinary ─────────────────────────────────────────────
async function uploadToCloudinary(imageUrl, publicId, altText) {
  console.log(`  📤 Uploading → ${publicId}`);
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: 'Mediport/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
    ],
  });
  console.log(`  ✅ Uploaded: ${result.secure_url}`);
  return { url: result.secure_url, publicId: result.public_id, alt: altText };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
┌────────────────────────────────────────────────────────────┐
│     Upload Comfit Glove Images → Cloudinary + MongoDB      │
└────────────────────────────────────────────────────────────┘
`);

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Connect to MongoDB
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // ── 1. Examination Gloves Medium ──────────────────────────────────────────
  console.log('[1/3] Comfit Examination Gloves Medium (M)');
  const imgExamM = await uploadToCloudinary(
    IMG_EXAM_M,
    'comfit-examination-gloves-medium',
    'Comfit Examination Gloves Medium (M) 100 pieces box — MediportBD'
  );
  await Product.findOneAndUpdate(
    { sku: 'CMF-EXG-M-100' },
    {
      $set: {
        images: [{ ...imgExamM, isPrimary: true }],
      },
    }
  );
  console.log('  💾 Product updated in DB\n');

  // ── 2. Examination Gloves Large ───────────────────────────────────────────
  console.log('[2/3] Comfit Examination Gloves Large (L)');
  const imgExamL = await uploadToCloudinary(
    IMG_EXAM_L,
    'comfit-examination-gloves-large',
    'Comfit Examination Gloves Large (L) 100 pieces box — MediportBD'
  );
  await Product.findOneAndUpdate(
    { sku: 'CMF-EXG-L-100' },
    {
      $set: {
        images: [{ ...imgExamL, isPrimary: true }],
      },
    }
  );
  console.log('  💾 Product updated in DB\n');

  // ── 3. Surgical Hand Gloves (2 images) ───────────────────────────────────
  console.log('[3/3] Comfit Surgical Hand Gloves 1 Pair');
  const [imgSurg1, imgSurg2] = await Promise.all([
    uploadToCloudinary(
      IMG_SURG_1,
      'comfit-surgical-gloves-1',
      'Comfit Surgical Hand Gloves 1 pair front view — MediportBD'
    ),
    uploadToCloudinary(
      IMG_SURG_2,
      'comfit-surgical-gloves-2',
      'Comfit Surgical Hand Gloves 1 pair view 2 — MediportBD'
    ),
  ]);
  await Product.findOneAndUpdate(
    { sku: 'CMF-SRG-1PR' },
    {
      $set: {
        images: [
          { ...imgSurg1, isPrimary: true },
          { ...imgSurg2, isPrimary: false },
        ],
      },
    }
  );
  console.log('  💾 Product updated in DB\n');

  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│  ✅  All 3 products now have real Cloudinary images        │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  await mongoose.connection.close();
  console.log('📡 DB connection closed');
}

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  mongoose.connection.close();
  process.exit(1);
});
