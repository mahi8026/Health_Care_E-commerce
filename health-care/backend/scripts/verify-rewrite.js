/* Temp verification for rewrite-thin-descriptions APPLY run. Safe read-only. */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../src/models/Product');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const dc30 = await Product.findOne({ slug: '4d-color-doppler-diagnostic-ultrasound-machine-mindray-dc-30' }).lean();
  console.log('DC-30 desc len:', (dc30.description || '').length);
  console.log('DC-30 desc head:', (dc30.description || '').slice(0, 100));
  console.log('DC-30 specs:', JSON.stringify(dc30.specifications || {}));
  const bio = await Product.findOne({ slug: 'bio-max-ne-esr-machine-20-hole-with-printer' }).lean();
  console.log('Bio-Max desc len:', (bio.description || '').length, '(was 55)');
  const short = await Product.countDocuments({
    active: true,
    $and: [{ $or: [{ description: null }, { description: '' }] }],
  });
  console.log('empty-desc active products:', short);
  const thinLeft = await Product.countDocuments({ active: true, description: { $exists: true, $ne: '' }, $expr: { $lt: [{ $strLenCP: { $ifNull: ['$description', ''] } }, 80] } });
  console.log('active products with desc <80 chars:', thinLeft);
  const wrongBrand = await Product.countDocuments({ active: true, description: /Mediport(?!BD)/ });
  console.log('descriptions containing bare "Mediport":', wrongBrand);

  const dataDir = path.join(__dirname, '..', 'data');
  const backup = fs.readdirSync(dataDir).filter((f) => f.startsWith('description-backup-')).sort().pop();
  const parsed = JSON.parse(fs.readFileSync(path.join(dataDir, backup), 'utf8'));
  const entries = Array.isArray(parsed) ? parsed : (parsed.items || []);
  console.log('backup file:', backup, '| entries:', entries.length);
  const b30 = entries.find((e) => e.slug === '4d-color-doppler-diagnostic-ultrasound-machine-mindray-dc-30');
  console.log('DC-30 backup oldDescription len:', (b30.oldDescription || '').length, '| oldSpecifications keys:', Object.keys(b30.oldSpecifications || {}).length);
  await mongoose.disconnect();
})().catch((e) => { console.error('FAIL:', e.message); process.exit(1); });
