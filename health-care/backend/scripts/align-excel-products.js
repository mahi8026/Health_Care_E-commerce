require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

// Per-product specification data (aligned with existing product format)
const SPEC_DATA = {
  'Excel hCG Pregnancy Rapid Test': {
    'Detection Target': 'hCG (human Chorionic Gonadotropin) hormone',
    'Sample Type': 'Urine / Serum',
    'Test Format': 'Cassette device / Strip',
    'Result Time': '3-5 minutes',
  },
  'Excel HBsAg Rapid Test': {
    'Detection Target': 'Hepatitis B Surface Antigen (HBsAg)',
    'Sample Type': 'Serum / Plasma',
    'Test Format': 'Cassette device / Strip',
    'Result Time': '10-15 minutes',
  },
  'Excel HCV Rapid Test': {
    'Detection Target': 'Antibodies to Hepatitis C Virus (HCV)',
    'Sample Type': 'Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel HIV Rapid Test': {
    'Detection Target': 'HIV-1 / HIV-2 / Subtype O antibodies',
    'Sample Type': 'Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel Dengue NS1 Rapid Test': {
    'Detection Target': 'Dengue virus NS1 antigen',
    'Sample Type': 'Whole Blood / Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel Dengue IgG/IgM Rapid Test': {
    'Detection Target': 'Dengue virus IgG and IgM antibodies',
    'Sample Type': 'Whole Blood / Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel H. pylori Rapid Test': {
    'Detection Target': 'H. pylori antibody (blood) / antigen (feces)',
    'Sample Type': 'Whole Blood / Serum / Plasma / Feces',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel Syphilis Rapid Test': {
    'Detection Target': 'Treponema Pallidum (TP) antibodies (IgG/IgM)',
    'Sample Type': 'Whole Blood / Serum / Plasma',
    'Test Format': 'Cassette device / Strip',
    'Result Time': '10-15 minutes',
  },
  'Excel Malaria Rapid Test': {
    'Detection Target': 'P. falciparum / P. vivax / P. ovale / P. malariae antigens',
    'Sample Type': 'Whole Blood',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel HAV IgM Rapid Test': {
    'Detection Target': 'Hepatitis A virus IgM antibodies',
    'Sample Type': 'Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
  'Excel HBeAg Rapid Test': {
    'Detection Target': 'Hepatitis B Envelope Antigen (HBeAg)',
    'Sample Type': 'Serum / Plasma',
    'Test Format': 'Cassette device',
    'Result Time': '10-15 minutes',
  },
};

const B2B_DISCOUNT = 0.75; // B2B price = 75% of retail (matches Jumper product ratio)

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const products = await Product.find({ name: { $regex: '^Excel ' } });
  console.log('Found ' + products.length + ' Excel products to align\n');

  let updated = 0;
  for (const p of products) {
    const specs = SPEC_DATA[p.name];
    if (!specs) {
      console.log('⊘ Skip (no spec data): ' + p.name);
      continue;
    }

    p.b2bPrice = Math.round(p.price * B2B_DISCOUNT);
    p.lowStockThreshold = 10;
    p.minStock = 10;
    p.minOrder = 1;
    p.discountPct = 0;
    p.hazardClass = 'safe';
    p.storageTemp = 'room';
    p.lotNumber = '';
    p.subcategory = '';
    p.expiryDate = null;
    p.hasAMC = false;
    p.certifications = ['CE', 'ISO 13485'];

    // Rebuild specifications (aligned with existing product format)
    const newSpecs = {
      ...specs,
      'Storage Condition': '2-30°C (room temperature)',
      'Shelf Life': '24 months (as per box)',
      'Product Type': 'Single-use rapid diagnostic test kit',
      'Intended Use': 'Professional in vitro diagnostic use',
      Manufacturer: 'M/S. Patwary Enterprise (Excel Rapid Test)',
    };
    p.specifications = new Map(Object.entries(newSpecs));

    await p.save();
    updated++;
    console.log('✓ ' + p.name + ' | b2bPrice: ৳' + p.b2bPrice + ' | specs: ' + newSpecs.length + ' entries | certs: CE, ISO 13485');
  }

  console.log('\nUpdated ' + updated + '/' + products.length + ' products');
  await mongoose.connection.close();
  console.log('Done');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
