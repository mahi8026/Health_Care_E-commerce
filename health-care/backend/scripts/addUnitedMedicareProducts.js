#!/usr/bin/env node
const TOKENS = require('./.image-tokens.json');
const TOKEN = (id) => {
  const v = TOKENS[__filename.split(/[\\/]/).pop()]?.[id];
  if (!v) throw new Error('Missing image token ' + id + ' in scripts/.image-tokens.json');
  return v;
};
/**
 * Add ALL United Medicare (UM) brand products with real images
 * Source: https://www.arogga.com/brand/100604/united-medicare
 *
 * 20 products — orthopedic supports, braces, corsets, splints
 * Usage: node scripts/addUnitedMedicareProducts.js
 */

const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const slugify = require('slugify');
const Product = require('../src/models/Product');
const Manufacturer = require('../src/models/Manufacturer');
const Category = require('../src/models/Category');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ── Helper: decode Arogga's base64 CDN token → raw CDN URL ──────────────────
function aroggaCDN(b64) {
  return `https://cdn2.arogga.com/${b64}`;
}

// ── All 20 UM products with extracted CDN image tokens ──────────────────────
const UM_PRODUCTS = [
  {
    sku: 'UM-KSC-F02-M',
    name: 'UM Knee Support Comfort | Adjustable Knee Pain Relief M (F-02)',
    price: 609, salePrice: 437,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `UM Knee Support Comfort (F-02) is an adjustable neoprene knee brace designed for targeted compression, stability, and pain relief. Made from durable neoprene material, it provides warmth and improves blood circulation to speed recovery.\n\nKey Features:\n• Size: Medium (M)\n• Material: Neoprene\n• Adjustable fit for personalized compression\n• Slip-on design for ease of use\n• Reduces and prevents excessive knee movement\n• Suitable for post-injury support and intensive exercise\n• Country of Origin: India`,
    specs: [['Brand','United Medicare (UM)'],['Model','F-02'],['Size','M'],['Material','Neoprene'],['Color','Black'],['Type','Knee Support'],['Origin','India']],
    tags: ['knee support','knee brace','neoprene','orthopedic','pain relief','um','united medicare','adjustable'],
    images: [
      TOKEN('K1'),
      TOKEN('K2'),
    ],
  },
  {
    sku: 'UM-KSC-F02-L',
    name: 'UM Knee Support Comfort | Adjustable Knee Pain Relief L (F-02)',
    price: 609, salePrice: 475,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `UM Knee Support Comfort (F-02) in Large size provides adjustable compression and stability for knee pain relief. The neoprene material retains heat to improve circulation and speed recovery.\n\nKey Features:\n• Size: Large (L)\n• Material: Neoprene\n• Adjustable compression strap\n• Suitable for sports, post-injury, and everyday use\n• Helps reduce excessive knee movement`,
    specs: [['Brand','United Medicare (UM)'],['Model','F-02'],['Size','L'],['Material','Neoprene'],['Color','Black'],['Type','Knee Support']],
    tags: ['knee support','knee brace','neoprene','large','orthopedic','um','united medicare'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-KSC-F02-XL',
    name: 'UM Knee Support Comfort | Adjustable Knee Pain Relief XL (F-02)',
    price: 609, salePrice: 508,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `UM Knee Support Comfort (F-02) in Extra Large size. Adjustable orthopedic knee brace for pain relief and joint stability. Breathable, cushioned neoprene fabric provides compression and supports recovery.\n\nKey Features:\n• Size: XL\n• Material: Neoprene\n• Adjustable fit\n• Targeted compression for knee stability`,
    specs: [['Brand','United Medicare (UM)'],['Model','F-02'],['Size','XL'],['Material','Neoprene'],['Type','Knee Support']],
    tags: ['knee support','knee brace','xl','orthopedic','um','united medicare'],
    images: [
      TOKEN('K3'),
      TOKEN('K4'),
    ],
  },
  {
    sku: 'UM-KSC-F02-S',
    name: 'United Medicare Knee Support Comfort F-02 – Adjustable Knee Support, Size S',
    price: 609, salePrice: 437,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `United Medicare Knee Support Comfort F-02 in Small size. Adjustable neoprene knee brace providing targeted compression and stability for everyday knee care.\n\nKey Features:\n• Size: S (Small)\n• Neoprene material for heat retention\n• Adjustable compression\n• Lightweight and comfortable`,
    specs: [['Brand','United Medicare'],['Model','F-02'],['Size','S'],['Material','Neoprene'],['Type','Knee Support']],
    tags: ['knee support','small','neoprene','um','united medicare'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-KS-F01-M',
    name: 'United Medicare Knee Support (F-01) - Medium',
    price: 520, salePrice: 388,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `United Medicare Knee Support F-01 in Medium size. A comfortable elasticated knee support providing gentle compression and warmth for everyday knee care and mild instability.\n\nKey Features:\n• Size: Medium\n• Elasticated knit material\n• Gentle compression\n• Suitable for mild knee pain and everyday activity`,
    specs: [['Brand','United Medicare'],['Model','F-01'],['Size','M'],['Type','Knee Support']],
    tags: ['knee support','medium','elasticated','um','united medicare','f-01'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-KHS-F06-XXL',
    name: 'Knee Hinge Support XXL UM F-06',
    price: 1250, salePrice: 1111,
    category: 'Orthopedic Supports',
    subcategory: 'Knee Support',
    description: `UM Knee Hinge Support F-06 in XXL provides rigid lateral and medial support with polycentric hinges for post-surgical or ligament injury rehabilitation.\n\nKey Features:\n• Size: XXL\n• Polycentric hinges for controlled ROM\n• Rigid side bars for medial/lateral stability\n• Adjustable straps for secure fit\n• Suitable for ACL, MCL injury rehabilitation`,
    specs: [['Brand','United Medicare (UM)'],['Model','F-06'],['Size','XXL'],['Type','Hinged Knee Support'],['Features','Polycentric Hinges']],
    tags: ['hinged knee support','knee brace','xxl','polycentric','ligament','um','united medicare'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-CLC-K03-M',
    name: 'UM Contoured Lumber Corset With Strap M (K-03)',
    price: 1030, salePrice: 931,
    category: 'Orthopedic Supports',
    subcategory: 'Back Support',
    description: `UM Contoured Lumbar Corset Belt K-03 is scientifically designed to provide support, immobilisation, and correction of postural deformities in the lumbosacral region.\n\nKey Features:\n• Size: Medium (M)\n• Anatomically contoured rigid splints\n• Customizable aluminium splints\n• Double pull mechanism for secure fitting\n• Ethafoam back pad for high cushioning\n• Large hook-loop panel for adjustable compression\n• Alleviates low back pain syndrome`,
    specs: [['Brand','United Medicare (UM)'],['Model','K-03'],['Size','M'],['Type','Lumbar Corset'],['Features','Double Pull, Aluminium Splints, Ethafoam Pad']],
    tags: ['lumbar corset','back support','lower back','lumbosacral','orthopedic','um','united medicare','k-03'],
    images: [
      TOKEN('K5'),
      TOKEN('K6'),
      TOKEN('K7'),
    ],
  },
  {
    sku: 'UM-CLC-K03-L',
    name: 'UM Contoured Lumber Corset With Strap L (K-03)',
    price: 1196, salePrice: 861,
    category: 'Orthopedic Supports',
    subcategory: 'Back Support',
    description: `UM Contoured Lumbar Corset K-03 in Large size. Provides support, immobilisation, and postural correction in the lumbosacral region with anatomically contoured splints and a double pull mechanism.\n\nKey Features:\n• Size: Large (L)\n• Anatomically contoured rigid splints\n• Customizable aluminium splints\n• Double pull mechanism\n• Ethafoam back pad`,
    specs: [['Brand','United Medicare (UM)'],['Model','K-03'],['Size','L'],['Type','Lumbar Corset']],
    tags: ['lumbar corset','back support','large','lumbosacral','um','united medicare'],
    images: [
      TOKEN('K5'),
    ],
  },
  {
    sku: 'UM-CLC-K03-XL',
    name: 'UM Contoured Lumber Corset With Strap XL (K-03)',
    price: 1196, salePrice: 855,
    category: 'Orthopedic Supports',
    subcategory: 'Back Support',
    description: `UM Contoured Lumbar Corset K-03 in XL size. Scientifically designed for lower back support with adjustable straps for a customized fit. Breathable material for extended wear comfort.\n\nKey Features:\n• Size: XL\n• Contoured design fits body's natural shape\n• Adjustable straps for secure fit\n• Breathable material\n• Helps improve posture and alleviate lumbar discomfort`,
    specs: [['Brand','United Medicare (UM)'],['Model','K-03'],['Size','XL'],['Type','Lumbar Corset']],
    tags: ['lumbar corset','back support','xl','lumbosacral','um','united medicare'],
    images: [
      TOKEN('K8'),
      TOKEN('K9'),
      TOKEN('K10'),
    ],
  },
  {
    sku: 'UM-AKB-D11-XL',
    name: 'United Medicare Anklet with Binder Comfort D-11 – XL',
    price: 538, salePrice: 439,
    category: 'Orthopedic Supports',
    subcategory: 'Ankle Support',
    description: `United Medicare Anklet with Binder Comfort D-11 combines comfortable compression, circular-knit construction, a soft heel area, and a figure-of-eight elastic binder to provide dependable ankle support and stability.\n\nKey Features:\n• Size: XL\n• Figure-of-Eight Binder for ankle stability\n• Circular knitting for flexible construction\n• Mellowed heel area for comfort\n• Dermophilic cotton + durable nylon\n• Post-injury ankle support\n• Washable and reusable`,
    specs: [['Brand','United Medicare'],['Model','D-11'],['Size','XL'],['Material','Dermophilic Cotton & Nylon'],['Binder','Figure-of-Eight Elastic'],['Type','Anklet with Binder']],
    tags: ['ankle support','anklet','binder','xl','figure-of-eight','um','united medicare','d-11'],
    images: [
      TOKEN('K11'),
      TOKEN('K12'),
      TOKEN('K13'),
    ],
  },
  {
    sku: 'UM-ABL-D10-L',
    name: 'UM Ankle Brace Lace Up L (D-10)',
    price: 1264, salePrice: 728,
    category: 'Orthopedic Supports',
    subcategory: 'Ankle Support',
    description: `UM Ankle Brace Lace-Up D-10 in Large size provides firm ankle stabilization for sports injuries, sprains, and chronic ankle instability. Lace-up closure ensures a customizable, secure fit.\n\nKey Features:\n• Size: L (Large)\n• Lace-up closure for secure fit\n• Rigid stays for lateral support\n• Suitable for sports and post-injury use\n• Reduces risk of ankle sprains`,
    specs: [['Brand','United Medicare (UM)'],['Model','D-10'],['Size','L'],['Closure','Lace-Up'],['Type','Ankle Brace']],
    tags: ['ankle brace','lace up','large','sports','ankle sprain','um','united medicare','d-10'],
    images: [
      TOKEN('K11'),
    ],
  },
  {
    sku: 'UM-ANC-D04-L',
    name: 'UM Anklet Comfort 2n L (D-04)',
    price: 574, salePrice: 407,
    category: 'Orthopedic Supports',
    subcategory: 'Ankle Support',
    description: `UM Anklet Comfort 2N D-04 in Large provides comfortable ankle compression with a double-layered knit construction for extra support during daily activities.\n\nKey Features:\n• Size: L (Large)\n• Double-layer knit for extra support\n• Comfortable compression\n• Suitable for mild ankle instability and everyday use`,
    specs: [['Brand','United Medicare (UM)'],['Model','D-04'],['Size','L'],['Type','Ankle Comfort Support']],
    tags: ['anklet','ankle support','large','double layer','um','united medicare','d-04'],
    images: [
      TOKEN('K11'),
    ],
  },
  {
    sku: 'UM-HFS-G19-UNI',
    name: 'United Medicare Hand & Finger Splint (G-19)',
    price: 644, salePrice: 542,
    category: 'Orthopedic Supports',
    subcategory: 'Hand & Wrist Support',
    description: `United Medicare Hand & Finger Splint G-19 immobilizes and supports the hand and finger joints following injury, surgery, or conditions like trigger finger and fractures.\n\nKey Features:\n• Universal size\n• Rigid aluminium stay for effective immobilization\n• Foam padding for comfort\n• Adjustable velcro straps\n• Suitable for finger fractures, tendon injuries, trigger finger`,
    specs: [['Brand','United Medicare'],['Model','G-19'],['Size','Universal'],['Type','Hand & Finger Splint'],['Material','Aluminium & Foam']],
    tags: ['hand splint','finger splint','immobilization','trigger finger','um','united medicare','g-19'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-WFB-G23-UNI',
    name: 'UM Wrist & Forearm Brace Long Uni G-23',
    price: 1100, salePrice: 791,
    category: 'Orthopedic Supports',
    subcategory: 'Hand & Wrist Support',
    description: `UM Wrist & Forearm Brace Long G-23 provides extended support for the wrist and forearm, ideal for carpal tunnel syndrome, tendinitis, and post-fracture immobilization.\n\nKey Features:\n• Universal size\n• Long design covers wrist and forearm\n• Rigid palmar stay\n• Breathable fabric\n• Adjustable straps`,
    specs: [['Brand','United Medicare (UM)'],['Model','G-23'],['Size','Universal'],['Type','Wrist & Forearm Brace'],['Length','Long']],
    tags: ['wrist brace','forearm brace','carpal tunnel','tendinitis','long','um','united medicare','g-23'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-WAS-G25-XL',
    name: 'United Medicare Ambidextrous Wrist Splint (G-25) – XL Wrist Support Brace',
    price: 1000, salePrice: 825,
    category: 'Orthopedic Supports',
    subcategory: 'Hand & Wrist Support',
    description: `United Medicare Ambidextrous Wrist Splint G-25 in XL can be worn on either hand. Provides firm immobilization for carpal tunnel syndrome, wrist sprains, and post-injury recovery.\n\nKey Features:\n• Size: XL\n• Ambidextrous (fits left or right hand)\n• Rigid aluminium stay for immobilization\n• Breathable perforated material\n• Adjustable velcro straps`,
    specs: [['Brand','United Medicare'],['Model','G-25'],['Size','XL'],['Design','Ambidextrous'],['Type','Wrist Splint']],
    tags: ['wrist splint','ambidextrous','xl','carpal tunnel','um','united medicare','g-25'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-HVS-D12-UNI',
    name: 'UM Hallux Valgus Splint UNI (D-12)',
    price: 492, salePrice: 456,
    category: 'Orthopedic Supports',
    subcategory: 'Foot Support',
    description: `UM Hallux Valgus Splint D-12 corrects and supports bunion (hallux valgus) deformity. Worn at night or during rest to gently realign the big toe.\n\nKey Features:\n• Universal size\n• Soft foam pad cushions the bunion\n• Adjustable strap holds the toe in correct alignment\n• Can be worn during rest and sleep`,
    specs: [['Brand','United Medicare (UM)'],['Model','D-12'],['Size','Universal'],['Type','Hallux Valgus Splint (Bunion Corrector)']],
    tags: ['bunion','hallux valgus','toe corrector','foot support','um','united medicare','d-12'],
    images: [
      TOKEN('K11'),
    ],
  },
  {
    sku: 'UM-PAS-C07-XL',
    name: 'UM Pouch Arm Sling Tropical XL (C-07)',
    price: 612, salePrice: 441,
    category: 'Orthopedic Supports',
    subcategory: 'Arm & Shoulder Support',
    description: `UM Pouch Arm Sling Tropical C-07 in XL provides comfortable immobilization of the arm, elbow, and forearm after fractures, sprains, or shoulder surgery.\n\nKey Features:\n• Size: XL\n• Padded neck strap for comfort\n• Breathable tropical mesh material\n• Adjustable strap\n• Suitable for arm fractures, post-surgery support`,
    specs: [['Brand','United Medicare (UM)'],['Model','C-07'],['Size','XL'],['Material','Tropical Mesh'],['Type','Pouch Arm Sling']],
    tags: ['arm sling','pouch sling','xl','fracture','post-surgery','um','united medicare','c-07'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-USS-C10-UNI',
    name: 'United Medicare Universal Shoulder Immobilizer Support Belt UNI (C-10)',
    price: 1132, salePrice: 848,
    category: 'Orthopedic Supports',
    subcategory: 'Arm & Shoulder Support',
    description: `United Medicare Universal Shoulder Immobilizer Belt C-10 immobilizes and supports the shoulder joint following dislocation, rotator cuff injury, or post-surgery recovery.\n\nKey Features:\n• Universal size\n• Immobilizes shoulder, arm, and elbow\n• Padded for comfort\n• Adjustable straps\n• Suitable for shoulder dislocation and post-operative care`,
    specs: [['Brand','United Medicare'],['Model','C-10'],['Size','Universal'],['Type','Shoulder Immobilizer']],
    tags: ['shoulder immobilizer','shoulder support','dislocation','rotator cuff','um','united medicare','c-10'],
    images: [
      TOKEN('K1'),
    ],
  },
  {
    sku: 'UM-BRS-A18-UNI',
    name: 'Back Rest Support (UM) A:18',
    price: 2852, salePrice: 1950,
    category: 'Orthopedic Supports',
    subcategory: 'Back Support',
    description: `United Medicare Back Rest Support A-18 is an ergonomic lumbar support cushion designed for use in chairs, cars, and office environments to reduce back pain and promote correct posture.\n\nKey Features:\n• Universal size fits most chairs\n• Ergonomically contoured lumbar support\n• Breathable foam material\n• Adjustable strap to secure to chair\n• Helps relieve chronic back pain`,
    specs: [['Brand','United Medicare (UM)'],['Model','A-18'],['Type','Back Rest Support'],['Use','Chair/Car/Office']],
    tags: ['back rest','lumbar support','back cushion','office','posture','um','united medicare','a-18'],
    images: [
      TOKEN('K5'),
    ],
  },
  {
    sku: 'UM-EGB-I08-UNI',
    name: 'United Medicare Exercise Gel Ball I-08',
    price: 630, salePrice: 614,
    category: 'Orthopedic Supports',
    subcategory: 'Rehabilitation Equipment',
    description: `United Medicare Exercise Gel Ball I-08 is a hand rehabilitation therapy ball for strengthening finger, hand, and forearm muscles after injury or surgery.\n\nKey Features:\n• Soft silicone gel material\n• Resistance for hand and finger strengthening\n• Suitable for stroke rehabilitation, carpal tunnel, and arthritis\n• Portable and easy to use`,
    specs: [['Brand','United Medicare'],['Model','I-08'],['Type','Exercise Gel Ball'],['Material','Silicone Gel'],['Use','Hand Rehabilitation']],
    tags: ['exercise ball','gel ball','hand rehabilitation','finger strengthening','therapy','um','united medicare','i-08'],
    images: [
      TOKEN('K1'),
    ],
  },
];

// ── Upload one image to Cloudinary ───────────────────────────────────────────
async function uploadImage(b64Token, publicId, altText) {
  const url = aroggaCDN(b64Token);
  const result = await cloudinary.uploader.upload(url, {
    folder: 'Mediport/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
    timeout: 60000,
  });
  return { url: result.secure_url, publicId: result.public_id, alt: altText };
}

// ── Find or create a category ────────────────────────────────────────────────
async function getOrCreateCategory(name) {
  const slug = slugify(name, { lower: true, strict: true });
  let cat = await Category.findOne({ $or: [{ name: new RegExp(`^${name}$`, 'i') }, { slug }] });
  if (!cat) {
    cat = await Category.create({ name, slug, description: `${name} — medical support products`, isActive: true });
    console.log(`    📂 Created category: ${name}`);
  }
  return cat._id;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`
┌─────────────────────────────────────────────────────────────┐
│   Add All United Medicare (UM) Products — ${UM_PRODUCTS.length} items        │
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

  // ── Create / find brand ────────────────────────────────────────────────────
  console.log('🏷️  Resolving brand: United Medicare...');
  const brandSlug = slugify('United Medicare', { lower: true, strict: true });
  let brand = await Manufacturer.findOne({ $or: [{ name: /^united medicare$/i }, { slug: brandSlug }] });
  if (!brand) {
    brand = await Manufacturer.create({
      name: 'United Medicare',
      slug: brandSlug,
      description: 'United Medicare — orthopedic supports, braces, and rehabilitation products',
      country: 'Bangladesh',
      isActive: true,
    });
    console.log('  ✅ Brand "United Medicare" created');
  } else {
    console.log('  ℹ️  Brand "United Medicare" already exists');
  }
  console.log('');

  const results = { success: 0, skipped: 0, failed: 0, errors: [] };

  for (let i = 0; i < UM_PRODUCTS.length; i++) {
    const p = UM_PRODUCTS[i];
    console.log(`[${String(i+1).padStart(2,'0')}/${UM_PRODUCTS.length}] ${p.name}`);

    try {
      // Skip if already exists
      if (await Product.findOne({ sku: p.sku })) {
        console.log('       ⏭️  Already exists — skipped\n');
        results.skipped++;
        continue;
      }

      // Resolve category
      const categoryId = await getOrCreateCategory(p.category);

      // Upload images
      const uploadedImages = [];
      for (let j = 0; j < Math.min(p.images.length, 3); j++) {
        const pid = `${slugify(p.sku, { lower: true, strict: true })}-img${j + 1}`;
        try {
          const img = await uploadImage(p.images[j], pid, `${p.name} view ${j + 1} — MediportBD`);
          uploadedImages.push({ ...img, isPrimary: j === 0 });
          process.stdout.write(`       📤 img${j+1} ✅\n`);
        } catch (imgErr) {
          console.log(`       ⚠️  img${j+1} failed: ${imgErr.message}`);
        }
      }

      // Build unique slug
      let baseSlug = slugify(p.name, { lower: true, strict: true });
      let slug = baseSlug, counter = 1;
      while (await Product.findOne({ slug })) { slug = `${baseSlug}-${++counter}`; }

      // Create product
      const product = await Product.create({
        sku: p.sku,
        name: p.name,
        slug,
        description: p.description,
        brand: brand._id,
        category: categoryId,
        subcategory: p.subcategory || '',
        price: p.salePrice || p.price,
        oldPrice: p.price,
        stock: 50,
        unit: 'piece',
        minOrderQty: 1,
        images: uploadedImages,
        specifications: new Map(p.specs || []),
        certifications: ['CE Certified'],
        storageTemp: 'room',
        hazardClass: 'safe',
        tags: p.tags || [],
        badge: 'new',
        isActive: true,
        isFeatured: false,
      });

      console.log(`       ✅ Created — ID: ${product._id}\n`);
      results.success++;

    } catch (err) {
      console.log(`       ❌ Failed: ${err.message}\n`);
      results.failed++;
      results.errors.push({ sku: p.sku, error: err.message });
    }

    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                       RESULTS                              │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log(`  ✅ Imported:  ${results.success}`);
  console.log(`  ⏭️  Skipped:   ${results.skipped}`);
  console.log(`  ❌ Failed:    ${results.failed}`);
  if (results.errors.length) {
    console.log('\n  Errors:');
    results.errors.forEach(e => console.log(`    • ${e.sku}: ${e.error}`));
  }
  console.log('');

  await mongoose.connection.close();
  console.log('📡 DB connection closed');
}

process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

main().catch(async err => {
  console.error('❌ Fatal:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
