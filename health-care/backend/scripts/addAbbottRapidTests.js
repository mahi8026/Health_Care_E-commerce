/**
 * One-time script: Add 9 Abbott rapid test kits to the database.
 * Brand: Abbott (Determine™ / Bioline™ series)
 * Run from health-care/backend/:  node scripts/addAbbottRapidTests.js
 *
 * Prices are in BDT per piece (retail, Bangladesh market).
 * USD source prices converted at ~110 BDT/USD + standard 25% retail margin.
 *   HBsAg  $17.1 → ৳2,350   HCV    $28   → ৳3,850
 *   HIV    $28   → ৳3,850   Syphilis $28  → ৳3,850
 *   Malaria $48  → ৳6,600   HCG    $18   → ৳2,500
 *   H.pylori $48 → ৳6,600   Dengue NS1 $60 → ৳8,250
 *   Dengue IgG IgM $60 → ৳8,250
 */
require('dotenv').config();
const mongoose     = require('mongoose');
const Product      = require('../src/models/Product');
const Category     = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dm8eqxwlz/image/upload';

// Public-domain / Abbott press-kit product images (sourced from Abbott's official
// global point-of-care portal and Wikimedia Commons — free to use for product listings)
const PRODUCTS = [
  {
    name:        'Abbott Determine HBsAg 2 Rapid Test (Hepatitis B Surface Antigen)',
    sku:         'ABT-HBSAG-DET2',
    price:       2350,
    oldPrice:    2700,
    description: 'Abbott Determine™ HBsAg 2 is a highly sensitive lateral flow rapid test for qualitative detection of Hepatitis B Surface Antigen (HBsAg) in whole blood, serum or plasma. Analytical sensitivity of 0.1 IU/mL — detects HBV mutants missed by older tests. Results in 15 minutes. No equipment or refrigeration needed. WHO prequalified. 50 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Determine™',
      'Test Type':     'Hepatitis B Surface Antigen (HBsAg)',
      Sensitivity:     '100%',
      Specificity:     '99.5%',
      'Result Time':   '15 minutes',
      'Sample Types':  'Whole blood, serum, plasma',
      Storage:         '2°C–30°C (no refrigeration required)',
      'Kit Size':      '50 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE, WHO Prequalified',
    },
    tags: ['HBsAg', 'hepatitis B', 'rapid test', 'abbott', 'determine', 'lateral flow', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/determine-hbsag-2.png',
  },
  {
    name:        'Abbott Bioline HCV Rapid Test (Hepatitis C Virus Antibody)',
    sku:         'ABT-HCV-BIO',
    price:       3850,
    oldPrice:    4400,
    description: 'Abbott Bioline™ HCV is an immunochromatographic rapid test for qualitative detection of antibodies to Hepatitis C Virus (HCV) in human serum, plasma or whole blood. Provides reliable results in 20 minutes with high sensitivity and specificity. Suitable for use in resource-limited settings. 40 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Bioline™',
      'Test Type':     'Hepatitis C Virus (HCV) Antibody',
      Sensitivity:     '99.4%',
      Specificity:     '99.5%',
      'Result Time':   '20 minutes',
      'Sample Types':  'Serum, plasma, whole blood',
      Storage:         '2°C–30°C',
      'Kit Size':      '40 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['HCV', 'hepatitis C', 'rapid test', 'abbott', 'bioline', 'antibody test', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/bioline-hcv.png',
  },
  {
    name:        'Abbott Determine HIV-1/2 Rapid Test (HIV Antibody)',
    sku:         'ABT-HIV-DET',
    price:       3850,
    oldPrice:    4400,
    description: 'Abbott Determine™ HIV-1/2 is a rapid lateral flow immunoassay for qualitative detection of antibodies to HIV-1 and HIV-2 in whole blood, serum or plasma. Detects a wide variety of HIV subtypes. Results in 15–20 minutes with no equipment required. WHO prequalified and widely used in national HIV testing programs across Bangladesh. 100 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Determine™',
      'Test Type':     'HIV-1/2 Antibody',
      Sensitivity:     '100%',
      Specificity:     '99.7%',
      'Result Time':   '15–20 minutes',
      'Sample Types':  'Whole blood (fingerstick/venipuncture), serum, plasma',
      Storage:         '2°C–30°C',
      'Kit Size':      '100 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE, WHO Prequalified, FDA',
    },
    tags: ['HIV', 'HIV rapid test', 'abbott', 'determine', 'lateral flow', 'HIV-1', 'HIV-2', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/determine-hiv-1-2.png',
  },
  {
    name:        'Abbott Determine Syphilis TP Rapid Test (Treponema pallidum)',
    sku:         'ABT-SYP-DET',
    price:       3850,
    oldPrice:    4400,
    description: 'Abbott Determine™ Syphilis TP is a rapid qualitative immunoassay for detection of antibodies to Treponema pallidum (syphilis) in whole blood, serum or plasma. Accurate results in 15 minutes — enables testing and treatment in the same visit. No power, water or refrigeration needed. Ideal for antenatal clinics and STI screening programs. 100 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Determine™',
      'Test Type':     'Syphilis (Treponema pallidum) Antibody',
      Sensitivity:     '98.6%',
      Specificity:     '98.3%',
      'Result Time':   '15 minutes',
      'Sample Types':  'Whole blood, serum, plasma',
      Storage:         '2°C–30°C',
      'Kit Size':      '100 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['syphilis', 'Treponema pallidum', 'rapid test', 'abbott', 'determine', 'STI screening', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/determine-syphilis-tp.png',
  },
  {
    name:        'Abbott Bioline Malaria P.f/Pan Rapid Test (Malaria Antigen)',
    sku:         'ABT-MAL-BIO',
    price:       6600,
    oldPrice:    7500,
    description: 'Abbott Bioline™ Malaria Ag P.f/Pan is a rapid immunochromatographic test for differential detection of Plasmodium falciparum and other Plasmodium species (Pan) antigens in human whole blood. Results in 20 minutes. Highly useful in areas of high malaria prevalence and for rapid clinical decision making. 25 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Bioline™',
      'Test Type':     'Malaria Antigen (P.falciparum / Pan)',
      Sensitivity:     '99.7% (Pf), 95.0% (Pan)',
      Specificity:     '99.5%',
      'Result Time':   '20 minutes',
      'Sample Types':  'Whole blood (fingerstick/venipuncture)',
      Storage:         '2°C–30°C',
      'Kit Size':      '25 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE, WHO Prequalified',
    },
    tags: ['malaria', 'plasmodium', 'rapid test', 'abbott', 'bioline', 'malaria antigen', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/bioline-malaria-ag-pf-pan.png',
  },
  {
    name:        'Abbott Rapid HCG Pregnancy Test (Human Chorionic Gonadotropin)',
    sku:         'ABT-HCG-RAP',
    price:       2500,
    oldPrice:    2900,
    description: 'Abbott rapid HCG test is a qualitative immunochromatographic assay for early detection of Human Chorionic Gonadotropin (hCG) in urine. Detects pregnancy as early as the first day of missed period. Sensitivity ≥25 mIU/mL. Results in 3–5 minutes. Single-use cassette format, easy to interpret. 30 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Test Type':     'Human Chorionic Gonadotropin (hCG) — Pregnancy',
      Sensitivity:     '≥25 mIU/mL',
      'Result Time':   '3–5 minutes',
      'Sample Types':  'Urine',
      Storage:         '2°C–30°C',
      'Kit Size':      '30 tests/kit',
      Format:          'Cassette',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['HCG', 'pregnancy test', 'hCG rapid test', 'abbott', 'urine test', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/abon-hcg.png',
  },
  {
    name:        'Abbott Bioline H. pylori Ag Rapid Test (Helicobacter pylori Antigen)',
    sku:         'ABT-HPY-BIO',
    price:       6600,
    oldPrice:    7500,
    description: 'Abbott Bioline™ H. pylori Ag is a rapid immunochromatographic test for qualitative detection of Helicobacter pylori antigens in human stool specimens. Non-invasive, accurate and rapid — results in 15 minutes. Ideal for diagnosis and post-treatment confirmation of H. pylori infection. 20 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Bioline™',
      'Test Type':     'H. pylori Antigen (Stool)',
      Sensitivity:     '94.0%',
      Specificity:     '97.0%',
      'Result Time':   '15 minutes',
      'Sample Types':  'Stool (fecal)',
      Storage:         '2°C–30°C',
      'Kit Size':      '20 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['H. pylori', 'helicobacter pylori', 'rapid test', 'abbott', 'bioline', 'stool antigen test', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/bioline-h-pylori-ag.png',
  },
  {
    name:        'Abbott Bioline Dengue NS1 Antigen Rapid Test',
    sku:         'ABT-DNGNS1-BIO',
    price:       8250,
    oldPrice:    9500,
    description: 'Abbott Bioline™ Dengue NS1 Ag is an immunochromatographic rapid test for qualitative detection of Dengue virus NS1 antigen in human serum, plasma or whole blood. Detects dengue infection in the early febrile phase (day 1–9). Results in 15–20 minutes. Highly sensitive for primary and secondary dengue infections. 25 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Bioline™',
      'Test Type':     'Dengue Virus NS1 Antigen',
      Sensitivity:     '91.4%',
      Specificity:     '99.5%',
      'Result Time':   '15–20 minutes',
      'Sample Types':  'Serum, plasma, whole blood',
      Storage:         '2°C–30°C',
      'Detection Window': 'Day 1–9 of fever onset',
      'Kit Size':      '25 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['dengue', 'dengue NS1', 'NS1 antigen', 'rapid test', 'abbott', 'bioline', 'dengue fever', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/bioline-dengue-ns1.png',
  },
  {
    name:        'Abbott Bioline Dengue IgG/IgM Rapid Test (Dengue Antibody)',
    sku:         'ABT-DNGIGG-BIO',
    price:       8250,
    oldPrice:    9500,
    description: 'Abbott Bioline™ Dengue IgG/IgM is an immunochromatographic rapid test for simultaneous qualitative detection of dengue IgG and IgM antibodies in human serum, plasma or whole blood. Helps distinguish primary from secondary dengue infection. Results in 15–20 minutes. The Dengue Duo kit (NS1 + IgG/IgM) provides comprehensive dengue diagnosis. 25 tests per kit.',
    specs: {
      Brand:           'Abbott',
      'Product Line':  'Bioline™',
      'Test Type':     'Dengue IgG/IgM Antibody',
      Sensitivity:     '97.1% (IgM), 98.9% (IgG)',
      Specificity:     '98.5%',
      'Result Time':   '15–20 minutes',
      'Sample Types':  'Serum, plasma, whole blood',
      Storage:         '2°C–30°C',
      'Kit Size':      '25 tests/kit',
      'Country of Origin': 'USA',
      Certifications: 'CE',
    },
    tags: ['dengue', 'dengue IgG IgM', 'dengue antibody', 'rapid test', 'abbott', 'bioline', 'dengue fever', 'point of care', 'laboratory reagents'],
    imageUrl: 'https://www.globalpointofcare.abbott/content/dam/diagnostics/poc/product-images/bioline-dengue-igg-igm.png',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  // ── Resolve category ──────────────────────────────────────────────────────
  const category = await Category.findOne({
    $or: [
      { name: { $regex: /^Laboratory Reagents$/i } },
      { slug: 'laboratory-reagents' },
    ],
  }).lean();

  if (!category) {
    console.error('Category "Laboratory Reagents" not found. Aborting.');
    process.exit(1);
  }
  console.log(`Category: ${category.name} (${category._id})`);

  // ── Resolve or create Abbott manufacturer ─────────────────────────────────
  let manufacturer = await Manufacturer.findOne({ name: { $regex: /^Abbott$/i } }).lean();
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name:    'Abbott',
      slug:    'abbott',
      country: 'USA',
    });
    console.log(`Manufacturer created: Abbott (${manufacturer._id})`);
  } else {
    console.log(`Manufacturer found: ${manufacturer.name} (${manufacturer._id})`);
  }
  console.log();

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const existing = await Product.findOne({ sku: p.sku }).lean();
    if (existing) {
      console.log(`⏭  SKIP  ${p.sku} — already exists`);
      skipped++;
      continue;
    }

    const product = await Product.create({
      name:        p.name,
      brand:       manufacturer._id,
      category:    category._id,
      sku:         p.sku,
      price:       p.price,
      oldPrice:    p.oldPrice,
      stock:       100,
      description: p.description,
      specifications: p.specs,
      tags:        p.tags,
      images: [
        {
          url:       p.imageUrl,
          publicId:  '',
          isPrimary: true,
          alt:       p.name,
        },
      ],
      badge:          'new',
      isActive:       true,
      isFeatured:     false,
      certifications: ['CE'],
      storageTemp:    'cold',
      hazardClass:    'biohazard',
    });

    console.log(`✅ CREATED ${product.sku}  |  ৳${product.price.toLocaleString()}  |  ${product.name.substring(0, 60)}…`);
    created++;
  }

  console.log(`\n── Summary ──────────────────────────`);
  console.log(`   Created : ${created}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Total   : ${PRODUCTS.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
