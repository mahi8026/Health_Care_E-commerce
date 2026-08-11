#!/usr/bin/env node

/**
 * ALPK2 Product Validation Script
 * 
 * Validates ALPK2 product data before import
 * Checks for missing fields, invalid data, and potential issues
 * 
 * Usage:
 *   node src/scripts/validateALPK2Products.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Import the products array from the import script
const { ALPK2_PRODUCTS } = require('./importALPK2Products');

const VALID_UNITS = ['piece', 'box', 'kit', 'pack', 'set'];
const VALID_BADGES = ['sale', 'new', 'bestseller', 'ce_certified', null];

/**
 * Validation results
 */
const results = {
  total: 0,
  valid: 0,
  warnings: 0,
  errors: 0,
  issues: [],
};

/**
 * Add issue to results
 */
function addIssue(product, severity, field, message) {
  results.issues.push({
    product: product.name || 'Unknown Product',
    severity,
    field,
    message,
  });
  
  if (severity === 'error') {
    results.errors++;
  } else {
    results.warnings++;
  }
}

/**
 * Validate required fields
 */
function validateRequiredFields(product, _index) {
  const requiredFields = ['name', 'description', 'category', 'price', 'stock'];
  
  requiredFields.forEach(field => {
    if (!product[field] && product[field] !== 0) {
      addIssue(
        product,
        'error',
        field,
        `Missing required field: ${field}`
      );
    }
  });
}

/**
 * Validate product name
 */
function validateName(product) {
  if (!product.name) {
return;
}
  
  // Check minimum length
  if (product.name.length < 10) {
    addIssue(
      product,
      'warning',
      'name',
      'Product name is very short. Consider making it more descriptive.'
    );
  }
  
  // Check if contains brand name
  if (!product.name.toLowerCase().includes('alpk2')) {
    addIssue(
      product,
      'warning',
      'name',
      'Product name does not include "ALPK2" brand name.'
    );
  }
  
  // Check length
  if (product.name.length > 100) {
    addIssue(
      product,
      'warning',
      'name',
      'Product name is very long (>100 chars). Consider shortening.'
    );
  }
}

/**
 * Validate description
 */
function validateDescription(product) {
  if (!product.description) {
return;
}
  
  // Check minimum length (SEO best practice)
  if (product.description.length < 200) {
    addIssue(
      product,
      'warning',
      'description',
      `Description is short (${product.description.length} chars). Recommended: 200-500 words for SEO.`
    );
  }
  
  // Check for Bangladesh context
  if (!product.description.toLowerCase().includes('bangladesh')) {
    addIssue(
      product,
      'warning',
      'description',
      'Description does not mention "Bangladesh". Consider adding for local SEO.'
    );
  }
}

/**
 * Validate category
 */
async function validateCategory(product, validCategories) {
  if (!product.category) {
return;
}
  
  const categoryExists = validCategories.some(
    cat => cat.name.toLowerCase() === product.category.toLowerCase()
  );
  
  if (!categoryExists) {
    addIssue(
      product,
      'error',
      'category',
      `Invalid category: "${product.category}". Must match existing category exactly.`
    );
  }
}

/**
 * Validate price
 */
function validatePrice(product) {
  if (product.price === undefined || product.price === null) {
return;
}
  
  // Check if price is a number
  if (typeof product.price !== 'number' || isNaN(product.price)) {
    addIssue(
      product,
      'error',
      'price',
      'Price must be a valid number.'
    );
    return;
  }
  
  // Check if price is positive
  if (product.price <= 0) {
    addIssue(
      product,
      'error',
      'price',
      'Price must be greater than 0.'
    );
  }
  
  // Check if price is reasonable (not too high or too low)
  if (product.price < 100) {
    addIssue(
      product,
      'warning',
      'price',
      'Price seems very low (<৳100). Please verify.'
    );
  }
  
  if (product.price > 500000) {
    addIssue(
      product,
      'warning',
      'price',
      'Price seems very high (>৳500,000). Please verify.'
    );
  }
  
  // Validate oldPrice if provided
  if (product.oldPrice) {
    if (typeof product.oldPrice !== 'number' || isNaN(product.oldPrice)) {
      addIssue(
        product,
        'error',
        'oldPrice',
        'Old price must be a valid number.'
      );
    } else if (product.oldPrice <= product.price) {
      addIssue(
        product,
        'warning',
        'oldPrice',
        'Old price should be higher than current price for sale display.'
      );
    }
  }
}

/**
 * Validate stock
 */
function validateStock(product) {
  if (product.stock === undefined || product.stock === null) {
return;
}
  
  // Check if stock is a number
  if (typeof product.stock !== 'number' || isNaN(product.stock)) {
    addIssue(
      product,
      'error',
      'stock',
      'Stock must be a valid number.'
    );
    return;
  }
  
  // Check if stock is non-negative
  if (product.stock < 0) {
    addIssue(
      product,
      'error',
      'stock',
      'Stock cannot be negative.'
    );
  }
  
  // Check if lowStockThreshold is reasonable
  if (product.lowStockThreshold && product.lowStockThreshold > product.stock) {
    addIssue(
      product,
      'warning',
      'lowStockThreshold',
      `Low stock threshold (${product.lowStockThreshold}) is higher than current stock (${product.stock}).`
    );
  }
}

/**
 * Validate images
 */
function validateImages(product) {
  if (!product.images || product.images.length === 0) {
    addIssue(
      product,
      'warning',
      'images',
      'No images provided. At least 1 image is recommended.'
    );
    return;
  }
  
  // Check number of images
  if (product.images.length > 5) {
    addIssue(
      product,
      'warning',
      'images',
      `${product.images.length} images provided. Only first 5 will be used.`
    );
  }
  
  // Validate each image URL
  product.images.forEach((imageUrl, index) => {
    if (typeof imageUrl !== 'string') {
      addIssue(
        product,
        'error',
        'images',
        `Image ${index + 1} is not a valid URL string.`
      );
      return;
    }
    
    // Check if URL is valid
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      addIssue(
        product,
        'error',
        'images',
        `Image ${index + 1} URL must start with http:// or https://.`
      );
    }
    
    // Check if example URL
    if (imageUrl.includes('example.com')) {
      addIssue(
        product,
        'warning',
        'images',
        `Image ${index + 1} is using example.com placeholder. Replace with actual image URL.`
      );
    }
  });
}

/**
 * Validate specifications
 */
function validateSpecifications(product) {
  if (!product.specifications) {
    addIssue(
      product,
      'warning',
      'specifications',
      'No specifications provided. Technical specs are recommended for medical equipment.'
    );
    return;
  }
  
  const specCount = Object.keys(product.specifications).length;
  
  if (specCount === 0) {
    addIssue(
      product,
      'warning',
      'specifications',
      'Specifications object is empty.'
    );
  } else if (specCount < 3) {
    addIssue(
      product,
      'warning',
      'specifications',
      `Only ${specCount} specification(s) provided. Consider adding more technical details.`
    );
  }
}

/**
 * Validate certifications
 */
function validateCertifications(product) {
  if (!product.certifications || product.certifications.length === 0) {
    addIssue(
      product,
      'warning',
      'certifications',
      'No certifications provided. Consider adding CE, ISO 13485, or DGDA certifications.'
    );
    return;
  }
  
  // Check for common medical device certifications
  const hasCE = product.certifications.some(cert => cert.toUpperCase().includes('CE'));
  const hasISO = product.certifications.some(cert => cert.toUpperCase().includes('ISO'));
  
  if (!hasCE && !hasISO) {
    addIssue(
      product,
      'warning',
      'certifications',
      'No CE or ISO certification found. These are important for medical equipment.'
    );
  }
}

/**
 * Validate unit
 */
function validateUnit(product) {
  if (product.unit && !VALID_UNITS.includes(product.unit)) {
    addIssue(
      product,
      'error',
      'unit',
      `Invalid unit: "${product.unit}". Must be one of: ${VALID_UNITS.join(', ')}.`
    );
  }
}

/**
 * Validate badge
 */
function validateBadge(product) {
  if (product.badge !== undefined && !VALID_BADGES.includes(product.badge)) {
    addIssue(
      product,
      'error',
      'badge',
      `Invalid badge: "${product.badge}". Must be one of: ${VALID_BADGES.filter(b => b !== null).join(', ')}, or null.`
    );
  }
}

/**
 * Validate single product
 */
async function validateProduct(product, index, validCategories) {
  console.log(`\n→ Validating Product ${index + 1}: ${product.name || 'Unknown'}`);
  
  validateRequiredFields(product, index);
  validateName(product);
  validateDescription(product);
  await validateCategory(product, validCategories);
  validatePrice(product);
  validateStock(product);
  validateImages(product);
  validateSpecifications(product);
  validateCertifications(product);
  validateUnit(product);
  validateBadge(product);
}

/**
 * Print validation report
 */
function printReport() {
  console.log('\n' + '═'.repeat(70));
  console.log('  VALIDATION REPORT');
  console.log('═'.repeat(70));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total products validated: ${results.total}`);
  console.log(`   ✓ Valid products:         ${results.valid}`);
  console.log(`   ⚠ Products with warnings: ${results.warnings}`);
  console.log(`   ✗ Products with errors:   ${results.errors}`);
  
  if (results.issues.length === 0) {
    console.log('\n✅ All products passed validation!\n');
    console.log('   You can proceed with the import.\n');
    return;
  }
  
  // Group issues by product
  const issuesByProduct = {};
  results.issues.forEach(issue => {
    if (!issuesByProduct[issue.product]) {
      issuesByProduct[issue.product] = [];
    }
    issuesByProduct[issue.product].push(issue);
  });
  
  // Print issues by product
  console.log('\n📋 Issues Found:\n');
  console.log('─'.repeat(70));
  
  Object.keys(issuesByProduct).forEach((productName, index) => {
    const productIssues = issuesByProduct[productName];
    const errorCount = productIssues.filter(i => i.severity === 'error').length;
    const warningCount = productIssues.filter(i => i.severity === 'warning').length;
    
    console.log(`\n${index + 1}. ${productName}`);
    console.log(`   Errors: ${errorCount}, Warnings: ${warningCount}`);
    console.log('');
    
    productIssues.forEach(issue => {
      const icon = issue.severity === 'error' ? '✗' : '⚠';
      const severity = issue.severity.toUpperCase();
      console.log(`   ${icon} [${severity}] ${issue.field}:`);
      console.log(`      ${issue.message}`);
    });
    
    console.log('');
  });
  
  console.log('─'.repeat(70));
  
  // Print recommendations
  console.log('\n💡 Recommendations:\n');
  
  if (results.errors > 0) {
    console.log('   ⚠ ERRORS MUST BE FIXED before import:');
    console.log('      - Missing required fields');
    console.log('      - Invalid data types or values');
    console.log('      - Invalid category names');
    console.log('      - Invalid image URLs\n');
  }
  
  if (results.warnings > 0) {
    console.log('   ℹ WARNINGS are suggestions for improvement:');
    console.log('      - Add more descriptive text for SEO');
    console.log('      - Include technical specifications');
    console.log('      - Add certifications');
    console.log('      - Use actual images instead of placeholders\n');
  }
  
  console.log('═'.repeat(70));
  
  if (results.errors > 0) {
    console.log('\n❌ VALIDATION FAILED');
    console.log('   Please fix all errors before running the import.\n');
  } else {
    console.log('\n✅ VALIDATION PASSED (with warnings)');
    console.log('   You can proceed with import, but consider fixing warnings.\n');
  }
}

/**
 * Main validation function
 */
async function validateALPK2Products() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ALPK2 Product Data Validation');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Connect to MongoDB
    console.log('→ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Get valid categories
    console.log('→ Fetching available categories...');
    const validCategories = await Category.find({ isActive: true })
      .select('name')
      .lean();
    console.log(`✓ Found ${validCategories.length} active categories`);
    
    // Validate products
    results.total = ALPK2_PRODUCTS.length;
    console.log(`\n→ Validating ${results.total} product(s)...`);
    console.log('─'.repeat(70));
    
    for (let i = 0; i < ALPK2_PRODUCTS.length; i++) {
      await validateProduct(ALPK2_PRODUCTS[i], i, validCategories);
    }
    
    // Calculate valid count
    const productsWithErrors = new Set(
      results.issues
        .filter(i => i.severity === 'error')
        .map(i => i.product)
    );
    results.valid = results.total - productsWithErrors.size;
    
    // Print report
    printReport();
    
  } catch (error) {
    console.error('\n❌ Validation Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
  
  // Exit with error code if validation failed
  if (results.errors > 0) {
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateALPK2Products().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { validateALPK2Products };
