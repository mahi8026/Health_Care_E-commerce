/**
 * One-time script: Import Acon (USA) Rapid Test products into the database.
 * Source: "Product & Price Of Acon Device" price list (9 devices, per-pc pricing).
 * Run from health-care/backend/:  node scripts/addAconProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

// ── Acon product data from the official price list ──────────────────────────
// price = BDT per piece (Per Pcs column), stock/minOrderQty set for per-pc sale.
const ACON_PRODUCTS = [
  {
    sku: 'ACON-HBSAG',
    name: 'Acon HBsAg Rapid Test Kit (Hepatitis B Surface Antigen)',
    price: 17.1,
    description: `Acon HBsAg Rapid Test Cassette — one-step in-vitro qualitative test for the detection of Hepatitis B surface antigen (HBsAg) in human serum, plasma or whole blood. Rapid visual result within 10-15 minutes, no instrumentation required. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-HCV',
    name: 'Acon HCV Rapid Test Kit (Anti-HCV Antibody)',
    price: 28,
    description: `Acon HCV Rapid Test Cassette — one-step in-vitro qualitative test for the detection of antibody to Hepatitis C virus (anti-HCV) in human serum, plasma or whole blood. Rapid visual result within 10-15 minutes, no instrumentation required. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-HIV',
    name: 'Acon HIV Rapid Test Kit (HIV 1/2 Antibody)',
    price: 28,
    description: `Acon HIV 1/2 Rapid Test Cassette — one-step in-vitro qualitative test for the detection of antibodies to Human Immunodeficiency Virus types 1 and 2 in human serum, plasma or whole blood. Rapid visual result within 10-15 minutes, suitable for screening. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-SYPH',
    name: 'Acon Syphilis Rapid Test Kit (Anti-TP Antibody)',
    price: 28,
    description: `Acon Syphilis Rapid Test Cassette — one-step in-vitro qualitative test for the detection of Treponema pallidum (TP) antibodies in human serum, plasma or whole blood. Rapid visual result within 10-15 minutes, no instrumentation required. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-MALARIA',
    name: 'Acon Malaria Rapid Test Kit (Pf/Pan Antigen)',
    price: 48,
    description: `Acon Malaria Rapid Test Cassette — one-step in-vitro qualitative test for the detection of Plasmodium falciparum (Pf) and Pan-malarial antigens in human whole blood. Rapid visual result within 10-15 minutes, ideal for field and clinic screening. 100% original Acon product, made in USA.`,
    sampleType: 'Whole Blood',
  },
  {
    sku: 'ACON-HCG',
    name: 'Acon HCG Rapid Test Kit (Pregnancy Test)',
    price: 18,
    description: `Acon HCG Rapid Test Cassette — one-step in-vitro qualitative test for the detection of human chorionic gonadotropin (hCG) in human urine or serum for early pregnancy detection. Rapid visual result within 3-5 minutes. 100% original Acon product, made in USA.`,
    sampleType: 'Urine / Serum',
  },
  {
    sku: 'ACON-HPYLORI',
    name: 'Acon H. pylori Rapid Test Kit (Antibody)',
    price: 48,
    description: `Acon H. pylori Rapid Test Cassette — one-step in-vitro qualitative test for the detection of IgG/IgM/IgA antibodies to Helicobacter pylori in human serum, plasma or whole blood. Rapid visual result within 10-15 minutes, aids in diagnosis of H. pylori infection. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-DENGUE-NS1',
    name: 'Acon Dengue NS1 Rapid Test Kit (NS1 Antigen)',
    price: 60,
    description: `Acon Dengue NS1 Rapid Test Cassette — one-step in-vitro qualitative test for the detection of dengue virus NS1 antigen in human serum, plasma or whole blood. Enables early detection of dengue infection from day 1 of fever. Rapid visual result within 15-20 minutes. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
  {
    sku: 'ACON-DENGUE-IGGIGM',
    name: 'Acon Dengue IgG/IgM Rapid Test Kit (Antibody)',
    price: 60,
    description: `Acon Dengue IgG/IgM Rapid Test Cassette — one-step in-vitro qualitative test for the differential detection of dengue virus IgG and IgM antibodies in human serum, plasma or whole blood. Distinguishes primary from secondary dengue infection. Rapid visual result within 15-20 minutes. 100% original Acon product, made in USA.`,
    sampleType: 'Serum / Plasma / Whole Blood',
  },
];

// Generic rapid-test product images (rotated across products, same approach
// as the HUMAN reagent import — replace with real product photos later).
const RAPID_TEST_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=800&fit=crop', alt: 'Medical rapid diagnostic test device' },
  { url: 'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?w=800&h=800&fit=crop', alt: 'Diagnostic test kit with cassette' },
  { url: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=800&fit=crop', alt: 'Laboratory test kits and reagents' },
  { url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=800&fit=crop', alt: 'Medical laboratory testing equipment' },
  { url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=800&fit=crop', alt: 'Medical diagnostic test kit' },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Resolve category (rapid test kits → Laboratory Reagents) ──────────────
  let category = await Category.findOne({
    $or: [
      { name: { $regex: /^Laboratory Reagents$/i } },
      { slug: 'laboratory-reagents' },
    ],
  });
  if (!category) {
    category = await Category.create({
      name: 'Laboratory Reagents',
      slug: 'laboratory-reagents',
      description: 'Laboratory reagents and rapid test kits for clinical chemistry, immunology, and diagnostics.',
      isActive: true,
    });
    console.log(`Category created: ${category.name} (${category._id})`);
  } else {
    console.log(`Category: ${category.name} (${category._id})`);
  }

  // ── Resolve or create Acon manufacturer ────────────────────────────────────
  let manufacturer = await Manufacturer.findOne({ name: { $regex: /^Acon$/i } });
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'Acon',
      slug: 'acon',
      country: 'USA',
      description: 'Acon Laboratories, Inc. — USA-based manufacturer of rapid diagnostic tests, clinical chemistry and point-of-care products. One-step rapid test cassettes for infectious disease, fertility and tropical disease screening.',
      website: 'https://www.aconlabs.com',
      isActive: true,
    });
    console.log(`Manufacturer created: Acon (${manufacturer._id})`);
  } else {
    console.log(`Manufacturer found: ${manufacturer.name} (${manufacturer._id})`);
  }

  // ── Import products (idempotent — skips existing SKUs) ────────────────────
  const stats = { success: 0, skipped: 0, failed: 0 };

  for (let i = 0; i < ACON_PRODUCTS.length; i++) {
    const prod = ACON_PRODUCTS[i];
    try {
      const existing = await Product.findOne({ sku: prod.sku }).lean();
      if (existing) {
        console.log(`⊘ ${prod.sku} - ${prod.name} (exists)`);
        stats.skipped++;
        continue;
      }

      const image = RAPID_TEST_IMAGES[i % RAPID_TEST_IMAGES.length];

      const product = await Product.create({
        name: prod.name,
        brand: manufacturer._id,
        category: category._id,
        sku: prod.sku,
        price: prod.price,
        stock: 100,
        lowStockThreshold: 20,
        unit: 'piece',
        minOrderQty: 1,
        description: prod.description,
        images: [{
          url: image.url,
          publicId: `acon-${prod.sku.toLowerCase()}`,
          isPrimary: true,
          alt: `${prod.name} - Acon USA - MediportBD Bangladesh`,
        }],
        specifications: {
          Brand: 'Acon',
          Format: 'Cassette (one-step)',
          'Sample Type': prod.sampleType,
          Pack: '1 test per cassette (per pcs)',
          'Result Time': '10–20 minutes (visual read)',
          Storage: 'Room temperature (2–30°C)',
          'Country of Origin': 'USA',
          Certification: 'CE, ISO 13485',
        },
        certifications: ['CE', 'ISO 13485'],
        storageTemp: 'room',
        badge: 'new',
        isActive: true,
        isFeatured: false,
        tags: [
          'acon', 'rapid test', 'rapid test kit', 'usa', 'screening',
          'laboratory reagents', 'diagnostic', 'one step test',
        ],
      });

      console.log(`✓ ${prod.sku} - ${prod.name} (৳${prod.price}/pc) [${product._id}]`);
      stats.success++;
    } catch (error) {
      console.log(`✗ ${prod.sku} - ${prod.name} (${error.message})`);
      stats.failed++;
    }
  }

  console.log('\n──────────────── Import Complete ────────────────');
  console.log(`   ✓ Imported: ${stats.success}  |  ⊘ Skipped: ${stats.skipped}  |  ✗ Failed: ${stats.failed}`);
  console.log('\nVerify at: /products?brand=Acon');
  console.log('(Product photos are placeholders — upload real Acon cassette images via admin)');

  await mongoose.disconnect();
  process.exit(stats.failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

