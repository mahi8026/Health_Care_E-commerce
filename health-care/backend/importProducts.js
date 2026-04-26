require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const slugify = require('slugify');

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  console.log('🔌 Connecting to MongoDB...');
  
  // Try SRV connection first
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected (SRV)');
    return;
  } catch (srvError) {
    console.log('⚠️  SRV connection failed, trying standard connection...');
    
    // Fallback to standard connection string
    // Convert mongodb+srv:// to mongodb://
    if (uri.includes('mongodb+srv://')) {
      const standardUri = uri
        .replace('mongodb+srv://', 'mongodb://')
        .replace('@cluster0.rqyzhey.mongodb.net/', '@cluster0-shard-00-00.rqyzhey.mongodb.net:27017,cluster0-shard-00-01.rqyzhey.mongodb.net:27017,cluster0-shard-00-02.rqyzhey.mongodb.net:27017/')
        .replace('?retryWrites=true&w=majority&appName=Cluster0', '?ssl=true&replicaSet=atlas-123abc-shard-0&authSource=admin&retryWrites=true&w=majority');
      
      try {
        await mongoose.connect(standardUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB connected (Standard)');
        return;
      } catch (standardError) {
        console.error('❌ Both connection methods failed');
        console.error('\n💡 Possible solutions:');
        console.error('   1. Check if you are behind a firewall/VPN');
        console.error('   2. Try from a different network');
        console.error('   3. Use local MongoDB: mongodb://localhost:27017/medcore-bd');
        console.error('   4. Run import on production server');
        throw standardError;
      }
    }
    throw srvError;
  }
};

const productSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  brand: String,
  category: String,
  subcategory: String,
  sku: { type: String, unique: true },
  price: Number,
  b2bPrice: Number,
  discountPct: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit: { type: String, default: 'piece' },
  minOrderQty: { type: Number, default: 1 },
  specifications: { type: Map, of: String },
  certifications: [String],
  storageTemp: { type: String, default: 'room' },
  hazardClass: { type: String, default: 'safe' },
  compatibleWith: [String],
  tags: [String],
  lotNumber: String,
  expiryDate: Date,
  hasAMC: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const parseRow = (row, rowIndex) => {
  const clean = (val) => (val || '').toString().trim();
  const num = (val, fallback = 0) => {
    const n = parseFloat(clean(val));
    return isNaN(n) ? fallback : n;
  };
  const bool = (val) => ['yes', 'true', '1'].includes(clean(val).toLowerCase());
  const arr = (val) => clean(val).split(',').map(s => s.trim()).filter(Boolean);

  const name = clean(row['Product Name'] || row['name']);
  const sku = clean(row['SKU'] || row['sku']);
  
  if (!name) throw new Error(`Product Name is required`);
  if (!sku) throw new Error(`SKU is required`);
  
  const slug = slugify(`${name}-${sku}`, { lower: true, strict: true });

  const specsMap = {};
  const specsRaw = clean(row['Specifications'] || row['specifications']);
  if (specsRaw) {
    specsRaw.split('|').forEach(pair => {
      const [k, v] = pair.split(':');
      if (k && v) specsMap[k.trim()] = v.trim();
    });
  }

  const price = num(row['Price (BDT)'] || row['price']);
  const b2bPriceRaw = clean(row['B2B Price (BDT)'] || row['b2b_price']);
  const b2bPrice = b2bPriceRaw ? num(b2bPriceRaw) : Math.round(price * 0.78);

  // Parse expiry date (supports YYYY-MM-DD, DD/MM/YYYY formats)
  let expiryDate;
  const expiryRaw = clean(row['Expiry Date'] || row['expiry_date']);
  if (expiryRaw) {
    // Try parsing YYYY-MM-DD format first
    if (/^\d{4}-\d{2}-\d{2}$/.test(expiryRaw)) {
      expiryDate = new Date(expiryRaw);
    }
    // Try DD/MM/YYYY format
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryRaw)) {
      const [day, month, year] = expiryRaw.split('/');
      expiryDate = new Date(`${year}-${month}-${day}`);
    }
    // Validate date
    if (expiryDate && isNaN(expiryDate.getTime())) {
      expiryDate = undefined;
    }
  }

  return {
    name,
    slug,
    description: clean(row['Description'] || row['description']),
    brand: clean(row['Brand'] || row['brand']),
    category: clean(row['Category'] || row['category']).toLowerCase().replace(/\s+/g, '_'),
    subcategory: clean(row['Subcategory'] || row['subcategory']),
    sku,
    price,
    b2bPrice,
    discountPct: num(row['Discount %'] || row['discount_pct'], 0),
    stock: num(row['Stock Qty'] || row['stock'], 0),
    lowStockThreshold: num(row['Low Stock Alert'] || row['low_stock_threshold'], 10),
    unit: clean(row['Unit'] || row['unit']) || 'piece',
    minOrderQty: num(row['Min Order Qty'] || row['min_order_qty'], 1),
    specifications: specsMap,
    certifications: arr(row['Certifications'] || row['certifications']),
    storageTemp: clean(row['Storage Temp'] || row['storage_temp']) || 'room',
    hazardClass: clean(row['Hazard Class'] || row['hazard_class']) || 'safe',
    compatibleWith: arr(row['Compatible With'] || row['compatible_with']),
    tags: arr(row['Tags'] || row['tags']),
    lotNumber: clean(row['Lot Number'] || row['lot_number']),
    expiryDate,
    hasAMC: bool(row['Has AMC'] || row['has_amc']),
    isFeatured: bool(row['Featured'] || row['is_featured']),
    isActive: row['Active'] !== undefined ? bool(row['Active']) : true,
  };
};

const importProducts = async (csvFilePath) => {
  const absPath = path.resolve(csvFilePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading: ${absPath}`);
  const content = fs.readFileSync(absPath, 'utf-8');
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`📊 Found ${rows.length} rows in CSV\n`);
  await connectDB();

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    try {
      const productData = parseRow(row, rowNum);
      const result = await Product.findOneAndUpdate(
        { sku: productData.sku },
        { $set: productData },
        { upsert: true, new: true, runValidators: false }
      );

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        inserted++;
        console.log(`  ✅ [${rowNum}] INSERTED: ${productData.name} (${productData.sku})`);
      } else {
        updated++;
        console.log(`  🔄 [${rowNum}] UPDATED:  ${productData.name} (${productData.sku})`);
      }
    } catch (err) {
      failed++;
      const msg = `Row ${rowNum}: ${err.message}`;
      errors.push(msg);
      console.error(`  ❌ [${rowNum}] FAILED:   ${msg}`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📈 IMPORT COMPLETE`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   🔄 Updated:  ${updated}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log('─────────────────────────────────────────');

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   • ${e}`));
    fs.writeFileSync('import-errors.log', errors.join('\n'));
    console.log('\n📝 Error log saved to: import-errors.log');
  }

  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
};

const csvFile = process.argv[2];
if (!csvFile) {
  console.log('Usage: node importProducts.js <path-to-csv-file>');
  console.log('Example: node importProducts.js products.csv');
  process.exit(1);
}

importProducts(csvFile).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
