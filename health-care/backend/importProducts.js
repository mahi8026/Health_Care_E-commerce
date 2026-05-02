require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const slugify = require('slugify');

// Import models
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Manufacturer = require('./src/models/Manufacturer');

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

// Cache for brands and categories to avoid repeated DB lookups
const brandCache = new Map();
const categoryCache = new Map();

/**
 * Get or create a manufacturer (brand) by name
 */
const getOrCreateBrand = async (brandName) => {
  if (!brandName) {
    throw new Error('Brand name is required');
  }

  const trimmedName = brandName.trim();
  
  // Check cache first
  if (brandCache.has(trimmedName)) {
    return brandCache.get(trimmedName);
  }

  // Try to find existing brand (case-insensitive)
  let brand = await Manufacturer.findOne({ 
    name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
  });

  // Create if doesn't exist
  if (!brand) {
    try {
      brand = await Manufacturer.create({
        name: trimmedName,
        isActive: true
      });
      console.log(`     🏭 Created new brand: ${trimmedName}`);
    } catch (err) {
      // Handle duplicate key error (race condition)
      if (err.code === 11000) {
        // Brand was created by another process, fetch it
        brand = await Manufacturer.findOne({ 
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        });
        if (!brand) {
          throw new Error(`Failed to find or create brand: ${trimmedName}`);
        }
      } else {
        throw err;
      }
    }
  }

  // Cache the result
  brandCache.set(trimmedName, brand._id);
  return brand._id;
};

/**
 * Get or create a category by name
 */
const getOrCreateCategory = async (categoryName) => {
  if (!categoryName) {
    throw new Error('Category name is required');
  }

  const trimmedName = categoryName.trim();
  
  // Check cache first
  if (categoryCache.has(trimmedName)) {
    return categoryCache.get(trimmedName);
  }

  // Try to find existing category (case-insensitive)
  let category = await Category.findOne({ 
    name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
  });

  // Create if doesn't exist
  if (!category) {
    try {
      category = await Category.create({
        name: trimmedName,
        isActive: true
      });
      console.log(`     📁 Created new category: ${trimmedName}`);
    } catch (err) {
      // Handle duplicate key error (race condition)
      if (err.code === 11000) {
        // Category was created by another process, fetch it
        category = await Category.findOne({ 
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        });
        if (!category) {
          throw new Error(`Failed to find or create category: ${trimmedName}`);
        }
      } else {
        throw err;
      }
    }
  }

  // Cache the result
  categoryCache.set(trimmedName, category._id);
  return category._id;
};

/**
 * Parse a CSV row into product data
 * Returns raw data - brand and category will be resolved to ObjectIds later
 */
const parseRow = async (row, rowIndex) => {
  const clean = (val) => (val || '').toString().trim();
  const num = (val, fallback = 0) => {
    const n = parseFloat(clean(val));
    return isNaN(n) ? fallback : n;
  };
  const bool = (val) => ['yes', 'true', '1'].includes(clean(val).toLowerCase());
  const arr = (val) => clean(val).split(',').map(s => s.trim()).filter(Boolean);

  const name = clean(row['Product Name'] || row['name']);
  const sku = clean(row['SKU'] || row['sku']);
  const brandName = clean(row['Brand'] || row['brand']);
  const categoryName = clean(row['Category'] || row['category']);
  
  // Validate required fields
  if (!name) throw new Error(`Product Name is required`);
  if (!sku) throw new Error(`SKU is required`);
  if (!brandName) throw new Error(`Brand is required`);
  if (!categoryName) throw new Error(`Category is required`);
  
  const price = num(row['Price (BDT)'] || row['price']);
  if (price <= 0) throw new Error(`Price must be greater than 0`);

  // Generate slug
  const slug = slugify(`${name}-${sku}`, { lower: true, strict: true });

  // Parse specifications (Key:Value|Key:Value format)
  const specsMap = {};
  const specsRaw = clean(row['Specifications'] || row['specifications']);
  if (specsRaw) {
    specsRaw.split('|').forEach(pair => {
      const [k, v] = pair.split(':');
      if (k && v) specsMap[k.trim()] = v.trim();
    });
  }

  // Calculate B2B price (auto-calculate as 78% of retail if not provided)
  const b2bPriceRaw = clean(row['B2B Price (BDT)'] || row['b2b_price'] || row['b2bPrice']);
  const b2bPrice = b2bPriceRaw ? num(b2bPriceRaw) : Math.round(price * 0.78);

  // Parse expiry date (supports YYYY-MM-DD, DD/MM/YYYY formats)
  let expiryDate;
  const expiryRaw = clean(row['Expiry Date'] || row['expiry_date'] || row['expiryDate']);
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
      console.warn(`     ⚠️  Invalid expiry date format: ${expiryRaw}`);
      expiryDate = undefined;
    }
  }

  // Parse certifications (comma-separated, normalize to uppercase)
  const certifications = arr(row['Certifications'] || row['certifications'])
    .map(cert => cert.toUpperCase())
    .filter(cert => ['CE', 'FDA', 'ISO', 'DGDA', 'ISO 13485', 'IEC 60601-1', 'ISO 9001', 'ISO 11135'].includes(cert));

  // Validate unit
  const unit = clean(row['Unit'] || row['unit']) || 'piece';
  const validUnits = ['piece', 'box', 'kit', 'pack', 'set'];
  if (!validUnits.includes(unit)) {
    console.warn(`     ⚠️  Invalid unit "${unit}", defaulting to "piece"`);
  }

  // Validate storage temp
  const storageTemp = clean(row['Storage Temp'] || row['storage_temp'] || row['storageTemp']) || 'room';
  const validStorageTemps = ['room', 'cold', 'frozen'];
  if (!validStorageTemps.includes(storageTemp)) {
    console.warn(`     ⚠️  Invalid storage temp "${storageTemp}", defaulting to "room"`);
  }

  // Validate hazard class
  const hazardClass = clean(row['Hazard Class'] || row['hazard_class'] || row['hazardClass']) || 'safe';
  const validHazardClasses = ['safe', 'biohazard', 'chemical'];
  if (!validHazardClasses.includes(hazardClass)) {
    console.warn(`     ⚠️  Invalid hazard class "${hazardClass}", defaulting to "safe"`);
  }

  // Resolve brand and category to ObjectIds
  const brandId = await getOrCreateBrand(brandName);
  const categoryId = await getOrCreateCategory(categoryName);

  return {
    name,
    slug,
    description: clean(row['Description'] || row['description']),
    brand: brandId,
    category: categoryId,
    subcategory: clean(row['Subcategory'] || row['subcategory']),
    sku: sku.toUpperCase(), // SKU should be uppercase
    price,
    b2bPrice,
    discountPct: num(row['Discount %'] || row['discount_pct'] || row['discountPct'], 0),
    stock: num(row['Stock Qty'] || row['stock'], 0),
    lowStockThreshold: num(row['Low Stock Alert'] || row['low_stock_threshold'] || row['lowStockThreshold'], 10),
    unit: validUnits.includes(unit) ? unit : 'piece',
    minOrderQty: num(row['Min Order Qty'] || row['min_order_qty'] || row['minOrderQty'], 1),
    specifications: specsMap,
    certifications,
    storageTemp: validStorageTemps.includes(storageTemp) ? storageTemp : 'room',
    hazardClass: validHazardClasses.includes(hazardClass) ? hazardClass : 'safe',
    compatibleWith: arr(row['Compatible With'] || row['compatible_with'] || row['compatibleWith']),
    tags: arr(row['Tags'] || row['tags']).map(tag => tag.toLowerCase()),
    lotNumber: clean(row['Lot Number'] || row['lot_number'] || row['lotNumber']),
    expiryDate,
    hasAMC: bool(row['Has AMC'] || row['has_amc'] || row['hasAMC']),
    isFeatured: bool(row['Featured'] || row['is_featured'] || row['isFeatured']),
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
  
  // Parse CSV with flexible options
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`📊 Found ${rows.length} rows in CSV\n`);
  
  // Connect to database
  await connectDB();

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];
  const warnings = [];

  console.log('🔄 Processing products...\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Account for header row
    
    try {
      // Parse and validate row data
      const productData = await parseRow(row, rowNum);
      
      // Check if product exists by SKU
      const existingProduct = await Product.findOne({ sku: productData.sku });
      
      if (existingProduct) {
        // Update existing product
        Object.assign(existingProduct, productData);
        await existingProduct.save();
        updated++;
        console.log(`  🔄 [${rowNum}] UPDATED:  ${productData.name} (${productData.sku})`);
      } else {
        // Create new product
        await Product.create(productData);
        inserted++;
        console.log(`  ✅ [${rowNum}] INSERTED: ${productData.name} (${productData.sku})`);
      }
      
    } catch (err) {
      failed++;
      const msg = `Row ${rowNum}: ${err.message}`;
      errors.push(msg);
      console.error(`  ❌ [${rowNum}] FAILED:   ${err.message}`);
      
      // Log the problematic row data for debugging
      if (process.env.DEBUG) {
        console.error(`     Debug: ${JSON.stringify(row)}`);
      }
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📈 IMPORT COMPLETE`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   🔄 Updated:  ${updated}`);
  console.log(`   ❌ Failed:   ${failed}`);
  console.log('─────────────────────────────────────────');

  // Log summary of created brands and categories
  if (brandCache.size > 0) {
    console.log(`\n🏭 Brands processed: ${brandCache.size}`);
  }
  if (categoryCache.size > 0) {
    console.log(`📁 Categories processed: ${categoryCache.size}`);
  }

  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   • ${e}`));
    const errorLogPath = path.join(__dirname, 'import-errors.log');
    fs.writeFileSync(errorLogPath, errors.join('\n'));
    console.log(`\n📝 Error log saved to: ${errorLogPath}`);
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
