require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

/**
 * Product CSV Validation Script
 * Validates CSV file before import to catch errors early
 * Usage: node validateProducts.js <path-to-csv-file>
 */

const REQUIRED_FIELDS = ['Product Name', 'SKU', 'Brand', 'Category', 'Price (BDT)', 'Stock Qty'];
const VALID_UNITS = ['piece', 'box', 'kit', 'pack', 'set'];
const VALID_STORAGE_TEMPS = ['room', 'cold', 'frozen'];
const VALID_HAZARD_CLASSES = ['safe', 'biohazard', 'chemical'];
const VALID_CERTIFICATIONS = ['CE', 'FDA', 'ISO', 'DGDA', 'ISO 13485', 'IEC 60601-1', 'ISO 9001', 'ISO 11135'];
const VALID_CATEGORIES = ['diagnostic', 'surgical', 'reagent', 'lab_equipment', 'ppe', 'implant', 'disposable', 'other'];

const clean = (val) => (val || '').toString().trim();
const num = (val) => parseFloat(clean(val));
const bool = (val) => ['yes', 'true', '1'].includes(clean(val).toLowerCase());

class ValidationReport {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.rowCount = 0;
    this.validRows = 0;
    this.skus = new Set();
    this.brands = new Set();
    this.categories = new Set();
  }

  addError(row, field, message) {
    this.errors.push({ row, field, message });
  }

  addWarning(row, field, message) {
    this.warnings.push({ row, field, message });
  }

  addInfo(message) {
    this.info.push(message);
  }

  isValid() {
    return this.errors.length === 0;
  }

  print() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         PRODUCT CSV VALIDATION REPORT                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Total Rows: ${this.rowCount}`);
    console.log(`✅ Valid Rows: ${this.validRows}`);
    console.log(`❌ Rows with Errors: ${this.errors.length > 0 ? this.rowCount - this.validRows : 0}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);

    if (this.brands.size > 0) {
      console.log(`\n🏭 Unique Brands: ${this.brands.size}`);
      console.log(`   ${Array.from(this.brands).join(', ')}`);
    }

    if (this.categories.size > 0) {
      console.log(`\n📁 Unique Categories: ${this.categories.size}`);
      console.log(`   ${Array.from(this.categories).join(', ')}`);
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS (Must Fix):');
      console.log('─────────────────────────────────────────────────────────────');
      this.errors.forEach(({ row, field, message }) => {
        console.log(`  Row ${row}, ${field}: ${message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Review Recommended):');
      console.log('─────────────────────────────────────────────────────────────');
      this.warnings.forEach(({ row, field, message }) => {
        console.log(`  Row ${row}, ${field}: ${message}`);
      });
    }

    if (this.info.length > 0) {
      console.log('\n💡 INFO:');
      console.log('─────────────────────────────────────────────────────────────');
      this.info.forEach(msg => console.log(`  ${msg}`));
    }

    console.log('\n─────────────────────────────────────────────────────────────');
    if (this.isValid()) {
      console.log('✅ VALIDATION PASSED - Ready to import!');
      console.log('\nRun: node importProducts.js <your-file.csv>');
    } else {
      console.log('❌ VALIDATION FAILED - Please fix errors before importing');
    }
    console.log('─────────────────────────────────────────────────────────────\n');
  }
}

const validateRow = (row, rowNum, report) => {
  let hasErrors = false;

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    const value = clean(row[field]);
    if (!value) {
      report.addError(rowNum, field, 'Required field is empty');
      hasErrors = true;
    }
  });

  // Validate Product Name
  const name = clean(row['Product Name']);
  if (name && name.length < 3) {
    report.addWarning(rowNum, 'Product Name', 'Name is very short (< 3 characters)');
  }
  if (name && name.length > 200) {
    report.addError(rowNum, 'Product Name', 'Name is too long (> 200 characters)');
    hasErrors = true;
  }

  // Validate SKU
  const sku = clean(row['SKU']);
  if (sku) {
    if (sku.length < 3) {
      report.addError(rowNum, 'SKU', 'SKU is too short (< 3 characters)');
      hasErrors = true;
    }
    if (report.skus.has(sku.toUpperCase())) {
      report.addError(rowNum, 'SKU', `Duplicate SKU: ${sku}`);
      hasErrors = true;
    } else {
      report.skus.add(sku.toUpperCase());
    }
    if (!/^[A-Z0-9\-_]+$/i.test(sku)) {
      report.addWarning(rowNum, 'SKU', 'SKU contains special characters (only A-Z, 0-9, -, _ recommended)');
    }
  }

  // Validate Brand
  const brand = clean(row['Brand']);
  if (brand) {
    report.brands.add(brand);
  }

  // Validate Category
  const category = clean(row['Category']);
  if (category) {
    report.categories.add(category);
    if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
      report.addWarning(rowNum, 'Category', `Category "${category}" is not in standard list. Will be created as new category.`);
    }
  }

  // Validate Price
  const price = num(row['Price (BDT)']);
  if (isNaN(price)) {
    report.addError(rowNum, 'Price (BDT)', 'Price must be a valid number');
    hasErrors = true;
  } else if (price <= 0) {
    report.addError(rowNum, 'Price (BDT)', 'Price must be greater than 0');
    hasErrors = true;
  } else if (price > 10000000) {
    report.addWarning(rowNum, 'Price (BDT)', 'Price is very high (> 10M BDT)');
  }

  // Validate B2B Price
  const b2bPrice = clean(row['B2B Price (BDT)']);
  if (b2bPrice) {
    const b2bNum = num(b2bPrice);
    if (isNaN(b2bNum)) {
      report.addError(rowNum, 'B2B Price (BDT)', 'B2B Price must be a valid number');
      hasErrors = true;
    } else if (b2bNum > price) {
      report.addWarning(rowNum, 'B2B Price (BDT)', 'B2B Price is higher than retail price');
    }
  }

  // Validate Discount
  const discount = num(row['Discount %']);
  if (!isNaN(discount) && (discount < 0 || discount > 100)) {
    report.addError(rowNum, 'Discount %', 'Discount must be between 0 and 100');
    hasErrors = true;
  }

  // Validate Stock
  const stock = num(row['Stock Qty']);
  if (isNaN(stock)) {
    report.addError(rowNum, 'Stock Qty', 'Stock must be a valid number');
    hasErrors = true;
  } else if (stock < 0) {
    report.addError(rowNum, 'Stock Qty', 'Stock cannot be negative');
    hasErrors = true;
  }

  // Validate Unit
  const unit = clean(row['Unit']);
  if (unit && !VALID_UNITS.includes(unit.toLowerCase())) {
    report.addWarning(rowNum, 'Unit', `Invalid unit "${unit}". Valid: ${VALID_UNITS.join(', ')}`);
  }

  // Validate Storage Temp
  const storageTemp = clean(row['Storage Temp']);
  if (storageTemp && !VALID_STORAGE_TEMPS.includes(storageTemp.toLowerCase())) {
    report.addWarning(rowNum, 'Storage Temp', `Invalid storage temp "${storageTemp}". Valid: ${VALID_STORAGE_TEMPS.join(', ')}`);
  }

  // Validate Hazard Class
  const hazardClass = clean(row['Hazard Class']);
  if (hazardClass && !VALID_HAZARD_CLASSES.includes(hazardClass.toLowerCase())) {
    report.addWarning(rowNum, 'Hazard Class', `Invalid hazard class "${hazardClass}". Valid: ${VALID_HAZARD_CLASSES.join(', ')}`);
  }

  // Validate Certifications
  const certifications = clean(row['Certifications']);
  if (certifications) {
    const certs = certifications.split(',').map(c => c.trim().toUpperCase());
    certs.forEach(cert => {
      if (!VALID_CERTIFICATIONS.includes(cert)) {
        report.addWarning(rowNum, 'Certifications', `Unknown certification "${cert}"`);
      }
    });
  }

  // Validate Specifications format
  const specs = clean(row['Specifications']);
  if (specs) {
    const pairs = specs.split('|');
    pairs.forEach(pair => {
      if (!pair.includes(':')) {
        report.addWarning(rowNum, 'Specifications', `Invalid format: "${pair}". Use Key:Value|Key:Value`);
      }
    });
  }

  // Validate Expiry Date
  const expiryDate = clean(row['Expiry Date']);
  if (expiryDate) {
    const isValidFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate) || /^\d{4}-\d{2}-\d{2}$/.test(expiryDate);
    if (!isValidFormat) {
      report.addError(rowNum, 'Expiry Date', 'Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD');
      hasErrors = true;
    } else {
      // Try to parse the date
      let date;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate)) {
        const [day, month, year] = expiryDate.split('/');
        date = new Date(`${year}-${month}-${day}`);
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
        date = new Date(expiryDate);
      }
      if (date && isNaN(date.getTime())) {
        report.addError(rowNum, 'Expiry Date', 'Invalid date value');
        hasErrors = true;
      } else if (date && date < new Date()) {
        report.addWarning(rowNum, 'Expiry Date', 'Product is already expired');
      }
    }
  }

  // Validate Lot Number for reagents
  if (category && category.toLowerCase() === 'reagent') {
    if (!clean(row['Lot Number'])) {
      report.addWarning(rowNum, 'Lot Number', 'Lot Number recommended for reagent products');
    }
    if (!expiryDate) {
      report.addWarning(rowNum, 'Expiry Date', 'Expiry Date recommended for reagent products');
    }
  }

  return !hasErrors;
};

const validateCSV = (csvFilePath) => {
  const absPath = path.resolve(csvFilePath);
  
  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading: ${absPath}`);
  const content = fs.readFileSync(absPath, 'utf-8');
  
  let rows;
  try {
    rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_quotes: true,
      relax_column_count: true,
    });
  } catch (err) {
    console.error(`❌ CSV Parse Error: ${err.message}`);
    process.exit(1);
  }

  const report = new ValidationReport();
  report.rowCount = rows.length;

  console.log(`📊 Found ${rows.length} rows\n`);
  console.log('🔍 Validating...\n');

  // Check for required columns
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    const missingHeaders = REQUIRED_FIELDS.filter(field => !headers.includes(field));
    
    if (missingHeaders.length > 0) {
      console.error(`❌ Missing required columns: ${missingHeaders.join(', ')}`);
      console.error('\nExpected columns:');
      console.error(REQUIRED_FIELDS.join(', '));
      process.exit(1);
    }
  }

  // Validate each row
  rows.forEach((row, index) => {
    const rowNum = index + 2; // Account for header row
    const isValid = validateRow(row, rowNum, report);
    if (isValid) {
      report.validRows++;
    }
  });

  // Print report
  report.print();

  // Exit with appropriate code
  process.exit(report.isValid() ? 0 : 1);
};

// Main execution
const csvFile = process.argv[2];
if (!csvFile) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Product CSV Validation Tool                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Usage: node validateProducts.js <path-to-csv-file>');
  console.log('Example: node validateProducts.js products.csv\n');
  console.log('This tool validates your CSV file before import to catch errors early.\n');
  process.exit(1);
}

validateCSV(csvFile);
