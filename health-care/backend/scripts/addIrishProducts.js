/**
 * One-time script: Import IRISH brand products (Arogga.com, brand_id 100561) into MediportBD.
 * Source: https://www.arogga.com/products?source=brand_best_selling_products&_brand_id=100561
 * All names, prices, discounts, availability, units and product images are the real Arogga data.
 * Run from health-care/backend/:  node scripts/addIrishProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Manufacturer = require('../src/models/Manufacturer');

// ── IRISH product data scraped from Arogga (real info) ─────────────────────
// price = selling price , old = original price , unit from Base Unit field.
const IRISH_PRODUCTS = [
  {
    sku: 'IRIS-ELEC-HEATPAD',
    name: 'Irish Electric Heating Pad',
    price: 1235, old: 1300, unit: 'pack',
    category: 'Medical Devices', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzMzg1LUVsZWN0cmljLUhlYXRpbmctUGFkLTEzLWluY2gtSVJJU0gtZGRtdS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRISH Electric Heating Pad — a portable mains-powered heating pad for targeted warmth and pain relief. Ideal for applying soothing heat to muscles and joints at home, providing gentle, consistent heat with an easy on/off control. Suitable for daily use by people of all ages. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Electric Heating Pad', Power: 'Mains (AC)', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-HEATPAD-ORTHO14',
    name: 'IRISH Heating Pad Ortho 14 Inch',
    price: 1211, old: 1500, unit: 'pack',
    category: 'Physiotherapy & Rehabilitation', avail: false,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJQcm9kdWN0LXBfaW1hZ2VzXC81MzM4NlwvNTMzODYtaGVhdGluZy1wYWQtb3J0aG8tOTBjeno0LmpwZWciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRISH Heating Pad Ortho 14 Inch — a 14-inch orthopaedic heating pad designed to deliver relaxing, targeted heat therapy to the back, shoulder, neck and other pain-prone areas. Uses gentle infrared warmth to help soothe muscle tension and stiffness after physical activity. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Ortho Heating Pad', Size: '14 Inch', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-ELEC-UNDERBLANKET',
    name: 'Electric Under Blanket (IRISH)',
    price: 4746, old: 5500, unit: 'pack',
    category: 'Medical Devices', avail: false,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzMzg3LUVsZWN0cmljLVVuZGVyLUJsYW5rZXQtSVJJU0gtNGlqOC5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRISH Electric Under Blanket — a cosy, machine-washable electric under blanket that keeps a bed warm and comfortable during cold nights. Placed under the fitted sheet to provide an even, gentle warmth across the mattress. Includes multiple controls for safe and adjustable temperature. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Electric Under Blanket', 'Washable': 'Yes (machine washable)', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-DIGI-BABYSCALE',
    name: 'Digital Baby Weight Scale (Irish)',
    price: 3169, old: 4000, unit: 'piece',
    category: 'Medical Devices', avail: false,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzMzg4LUJhYnktV2VpZ2h0LVNjYWxlLURpZ2l0YWwtSVJJU0gtM3JteS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRISH Digital Baby Weight Scale — a safe, digital weighing scale designed specifically for accurately monitoring infant weight. Features a comfortable baby tray/platform, stable non-slip base and an easy-to-read digital display in kg. Ideal for new parents and paediatric use at home. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Digital Baby Scale', Display: 'Digital (kg)', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-UNDERPAD-L-10',
    name: 'IRIS Under Pad Premium Quality L 10 Pcs',
    price: 900, old: 990, unit: 'pack',
    category: 'Medical Supplies', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzNTkzLVVuZGVyLVBhZC1QcmVtaXVtLVF1YWxpdHktTC0xMC1QY3MtSVJJUy1TaXplLUwteXk1aC5qcGVnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjoxMDAwLCJoZWlnaHQiOjEwMDAsImZpdCI6Im91dHNpZGUifSwib3ZlcmxheVdpdGgiOnsiYnVja2V0IjoiYXJvZ2dhIiwia2V5IjoibWlzY1wvd20ucG5nIiwiYWxwaGEiOjkwfX19',
    desc: 'IRIS Under Pad Premium Quality L — a pack of 10 large premium quality under pads (L size). Soft, absorbent and disposable, these under pads offer excellent protection and hygiene for elderly care, incontinence care, patient bedding and post-natal use. High absorbency with a soft, breathable top layer. 100% original IRIS product by IRISH, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRIS', Size: 'L', Pack: '10 Pcs', Type: 'Under Pad (disposable)', 'Base Unit': '10 Pcs x 1', 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-UNDERPAD-XL-10',
    name: 'IRIS Under Pad Premium Quality XL 10 Pcs',
    price: 941, old: 1100, unit: 'pack',
    category: 'Medical Supplies', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzTNTk1LVVuZGVyLVBhZC1QcmVtaXVtLVF1YWxpdHktWEwtMTAtUGNzLUlSSVMtU2l6ZS1YTC1mcjhhLmpwZWciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRIS Under Pad Premium Quality XL — a pack of 10 extra-large premium quality under pads (XL size). Highly absorbent and disposable for maximum protection and hygiene, ideal for elderly, incontinence and patient care plus post-natal use. Soft top layer with a leak-proof backing for comfort and reliability. 100% original IRIS product by IRISH, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRIS', Size: 'XL', Pack: '10 Pcs', Type: 'Under Pad (disposable)', 'Base Unit': '10 Pcs x 1', 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-BABYPAD-M-20',
    name: 'IRISH Baby Pad Premium Quality M (60 x 60cm) 20 Pcs',
    price: 1402, old: 1500, unit: 'pack',
    category: 'Baby & Mom Care', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTNcLzUzTNTk2LUJhYnktUGFkLVByZW1pdW0tUXVhbGl0eS1NLTIwLVBjcy1JUklTLVNpemUtTS1jZ3JiLnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTAwMCwiaGVpZ2h0IjoxMDAwLCJmaXQiOiJvdXRzaWRlIn0sIm92ZXJsYXlXaXRoIjp7ImJ1Y2tldCI6ImFyb2dnYSIsImtleSI6Im1pc2NcL3dtLnBuZyIsImFscGhhIjo5MH19fQ==',
    desc: 'IRISH Baby Pad Premium Quality M (60 x 60cm) — a pack of 20 medium-size premium quality baby changing/under pads. Soft, absorbent and hygienic for changing baby diapers and protecting surfaces. Gentle on a baby\'s delicate skin with excellent absorbency. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Size: 'M (60 x 60cm)', Pack: '20 Pcs', Type: 'Baby Pad', 'Base Unit': '20 Pcs x 1', 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-ELEC-HEATEDBLANKET',
    name: 'Electric Heated Blanket Heating Levels Fast Heating, Machine Washable, Dark Grey (IRISH) - (Size 66 inch x 48inch)',
    price: 4294, old: 5500, unit: 'pack',
    category: 'Medical Devices', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtZWRpY2luZVwvNTRcLzU0ODgwLUVsZWN0cmljLUJsYW5rZXQtejJkZ3I0LnBuZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTAwMCwiaGVpZ2h0IjoxMDAwLCJmaXQiOiJvdXRzaWRlIn0sIm92ZXJsYXlXaXRoIjp7ImJ1Y2tldCI6ImFyb2dnYSIsImtleSI6Im1pc2NcL3dtLnBuZyIsImFscGhhIjo5MH19fQ==',
    desc: 'IRISH Electric Heated Blanket — fast-heating, machine-washable electric blanket with multiple adjustable heating levels. Dark grey finish, sized 66 inch x 48 inch. Provides rapid, even warmth with adjustable temperature control for comfortable sleep on cold nights. Machine washable for easy cleaning and maintenance. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Electric Heated Blanket', Size: '66 inch x 48 inch', Colour: 'Dark Grey', 'Heating Levels': 'Multiple / Fast heating', 'Washable': 'Yes (machine washable)', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-INFRARED-LAMP-150W',
    name: 'Infrared Heating Lamp Heat Lamp / IRR Lamp- 150 Watt With Regulator (IRISH)',
    price: 3508, old: 3900, unit: 'piece',
    category: 'Physiotherapy & Rehabilitation', avail: false,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJQcm9kdWN0LXBfaW1hZ2VzXC81NTA2NlwvNTUwNjYtNTUzMDdiNzg2MTg1ODczMTI4MTM1MGY0OGYwMzFmYmUtcXVucnR6LmpwZWciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEwMDAsImhlaWdodCI6MTAwMCwiZml0Ijoib3V0c2lkZSJ9LCJvdmVybGF5V2l0aCI6eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJtaXNjXC93bS5wbmciLCJhbHBoYSI6OTB9fX0=',
    desc: 'IRISH Infrared Heating Lamp (Heat Lamp / IRR Lamp) — a 150 Watt infrared physiotherapy heat lamp with a dimmer regulator. Emits soothing infrared heat for muscle relaxation, pain relief and physiotherapy use. Includes a regulator to adjust heating intensity to your comfort level. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Infrared Heat Lamp', Power: '150 Watt', 'With Regulator': 'Yes', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-BABYSCALE-HF301',
    name: 'Baby Weighing Scale Digital-HF-301',
    price: 4013, old: 4200, unit: 'piece',
    category: 'Baby & Mom Care', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJQcm9kdWN0VmFyaWFudC1wdl9pbWFnZXNcLzYzNjQwXC82MzY0MC0yNS1mbGNhcDcud2VicCIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MTAwMCwiaGVpZ2h0IjoxMDAwLCJmaXQiOiJvdXRzaWRlIn0sIm92ZXJsYXlXaXRoIjp7ImJ1Y2tldCI6ImFyb2dnYSIsImtleSI6Im1pc2NcL3dtLnBuZyIsImFscGhhIjo5MH19fQ==',
    desc: 'IRISH Baby Weighing Scale Digital-HF-301 — a digital baby weighing scale for accurate and quick measurement of infant weight. Features a stable weighing platform, easy-to-read digital display, and reliable precision for tracking your baby\'s healthy growth from birth. Simple and safe to use at home. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Model: 'HF-301', Type: 'Digital Baby Scale', Display: 'Digital (kg)', 'Base Unit': "1's Pack x 1", 'Country of Origin': 'China' },
  },
  {
    sku: 'IRIS-FACEMASK-50',
    name: "Face Mask Surgical 3 Layers with Nose Pin 50's Pack (Irish)",
    price: 255, old: 300, unit: 'box',
    category: 'PPE & Safety', avail: true,
    image: 'https://cdn2.arogga.com/eyJidWNrZXQiOiJhcm9nZ2EiLCJrZXkiOiJQcm9kdWN0LXBfaW1hZ2VzXC8zNTA0NlwvMzUwNDYtc3VyZ2ljYWwtbWVsdGJsb3duLWZhY2UtbWFzay1kaXNwb3NhYmxlLTMtcGx5LTV1c294bS5qcGVnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjoxMDAwLCJoZWlnaHQiOjEwMDAsImZpdCI6Im91dHNpZGUifSwib3ZlcmxheVdpdGgiOnsiYnVja2V0IjoiYXJvZ2dhIiwia2V5IjoibWlzY1wvd20ucG5nIiwiYWxwaGEiOjkwfX19',
    desc: 'IRISH Face Mask Surgical 3 Layers with Nose Pin — a box of 50 surgical face masks, featuring a 3-layer protective construction and an adjustable nose pin for a snug, secure fit. Designed for everyday protection against dust, droplets and airborne particles. Soft ear loops for all-day comfort. 100% original IRISH brand product, delivered across Bangladesh by Arogga.',
    spec: { Brand: 'IRISH', Type: 'Surgical Mask', Layers: '3', 'Nose Pin': 'Yes', Pack: "50's", 'Base Unit': "1's Box x 1", 'Country of Origin': 'China' },
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Resolve or create IRISH manufacturer ───────────────────────────────────
  let manufacturer = await Manufacturer.findOne({ name: { $regex: /^IRISH$/i } });
  if (!manufacturer) {
    manufacturer = await Manufacturer.create({
      name: 'IRISH',
      description: 'IRISH is a healthcare and home-therapy brand offering electric heating pads, heated blankets, under pads, baby care products, weighing scales, infrared lamps and surgical masks. Products are sourced, verified and delivered across Bangladesh by Arogga.',
      country: 'China',
      isActive: true,
    });
    console.log(`Manufacturer created: IRISH (${manufacturer._id})`);
  } else {
    console.log(`Manufacturer found: ${manufacturer.name} (${manufacturer._id})`);
  }

  // ── Resolve or create needed categories ────────────────────────────────────
  const needed = ['Medical Devices', 'Physiotherapy & Rehabilitation', 'Medical Supplies', 'Baby & Mom Care', 'PPE & Safety'];
  const categoryMap = {};
  for (const cname of needed) {
    const slug = cname.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let cat = await Category.findOne({ $or: [{ name: { $regex: new RegExp('^' + cname + '$', 'i') } }, { slug }] });
    if (!cat) {
      cat = await Category.create({ name: cname, description: cname, isActive: true });
      console.log(`Category created: ${cname} (${cat._id})`);
    } else {
      console.log(`Category: ${cname} (${cat._id})`);
    }
    categoryMap[cname] = cat._id;
  }

  // ── Import products (idempotent — skips existing SKUs) ────────────────────
  const stats = { success: 0, skipped: 0, failed: 0 };

  for (const prod of IRISH_PRODUCTS) {
    try {
      const existing = await Product.findOne({ sku: prod.sku }).lean();
      if (existing) {
        console.log(`Skip ${prod.sku} - ${prod.name} (exists)`);
        stats.skipped++;
        continue;
      }

      const discountPct = prod.old > prod.price ? Math.round((1 - prod.price / prod.old) * 100) : 0;

      await Product.create({
        name: prod.name,
        brand: manufacturer._id,
        category: categoryMap[prod.category],
        sku: prod.sku,
        price: prod.price,
        oldPrice: prod.old,
        discountPct,
        stock: prod.avail ? 50 : 0,
        lowStockThreshold: 10,
        unit: prod.unit,
        minOrderQty: 1,
        description: prod.desc,
        images: [{
          url: prod.image,
          publicId: `irish-${prod.sku.toLowerCase()}`,
          isPrimary: true,
          alt: `${prod.name} - IRISH - MediportBD Bangladesh`,
        }],
        specifications: prod.spec,
        badge: 'sale',
        isActive: true,
        isFeatured: false,
        tags: ['irish', 'arogga', 'healthcare', 'bangladesh', prod.category.toLowerCase()],
      });

      console.log(`OK ${prod.sku} - ${prod.name} (BDT ${prod.price}${prod.old ? `, was BDT ${prod.old} (-${discountPct}%)` : ''})${prod.avail ? '' : ' [OUT OF STOCK]'}`);
      stats.success++;
    } catch (error) {
      console.log(`FAIL ${prod.sku} - ${prod.name} (${error.message})`);
      stats.failed++;
    }
  }

  console.log('\n──────────────── Import Complete ────────────────');
  console.log(`   Imported: ${stats.success}  |  Skipped: ${stats.skipped}  |  Failed: ${stats.failed}`);
  console.log('\nVerify at: /products?brand=IRISH');

  await mongoose.disconnect();
  process.exit(stats.failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});