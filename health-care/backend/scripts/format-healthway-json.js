#!/usr/bin/env node

/**
 * Healthway JSON Formatter
 * Converts raw Healthway API response to our products.json format
 * 
 * Usage:
 * 1. Copy JSON from Healthway API response
 * 2. Paste into healthway-raw.json
 * 3. Run: node scripts/format-healthway-json.js
 * 4. Output: products.json (ready to import)
 */

const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'healthway-raw.json');
const outputFile = path.join(__dirname, 'products.json');

// Get brand from command line argument or default to 'Tynor'
const args = process.argv.slice(2);
let brandName = 'Tynor';
args.forEach(arg => {
  if (arg.startsWith('--brand=')) {
    brandName = arg.split('=')[1];
  }
});

console.log(`
┌────────────────────────────────────────────────────────────┐
│         Healthway JSON Formatter                           │
└────────────────────────────────────────────────────────────┘
`);

try {
  if (!fs.existsSync(rawFile)) {
    console.log('📋 Creating healthway-raw.json template...\n');
    
    const template = {
      note: "Paste Healthway API response here",
      example: {
        products: [
          {
            id: "12345",
            name: "Product Name",
            price: 850,
            regular_price: 1200,
            description: "Product description",
            images: ["https://image-url.jpg"],
            sku: "SKU-123",
            stock: 100
          }
        ]
      }
    };
    
    fs.writeFileSync(rawFile, JSON.stringify(template, null, 2));
    
    console.log('✅ Created healthway-raw.json');
    console.log('\n📝 Next steps:');
    console.log('   1. Open: healthway-raw.json');
    console.log('   2. Paste Healthway API JSON response');
    console.log('   3. Run this script again\n');
    process.exit(0);
  }

  console.log('📖 Reading healthway-raw.json...\n');
  const rawData = JSON.parse(fs.readFileSync(rawFile, 'utf8'));

  // Try to find products array in various structures
  let products = [];
  
  if (Array.isArray(rawData)) {
    products = rawData;
  } else if (rawData.results && Array.isArray(rawData.results)) {
    products = rawData.results; // Healthway uses "results"
  } else if (rawData.products && Array.isArray(rawData.products)) {
    products = rawData.products;
  } else if (rawData.data && Array.isArray(rawData.data)) {
    products = rawData.data;
  } else if (rawData.data && rawData.data.products) {
    products = rawData.data.products;
  } else if (rawData.items && Array.isArray(rawData.items)) {
    products = rawData.items;
  } else {
    console.log('❌ Could not find products array in JSON');
    console.log('\n📋 JSON structure:');
    console.log(Object.keys(rawData));
    console.log('\n💡 Expected structure: { "products": [...] } or { "results": [...] }');
    process.exit(1);
  }

  if (products.length === 0) {
    console.log('⚠️  No products found in healthway-raw.json');
    console.log('   Make sure you pasted the API response correctly\n');
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products\n`);
  console.log('🔄 Converting to Mediport format...\n');

  // Convert to our format
  const converted = products.map((product, index) => {
    // Extract images
    let images = [];
    if (product.default_image && product.default_image.original && product.default_image.original.src) {
      let imgSrc = product.default_image.original.src;
      // Prepend Healthway domain if relative URL
      if (imgSrc.startsWith('/')) {
        imgSrc = 'https://healthway.com.bd' + imgSrc;
      }
      images.push(imgSrc);
    }
    if (product.image) {
      let imgSrc = product.image;
      if (imgSrc.startsWith('/')) {
        imgSrc = 'https://healthway.com.bd' + imgSrc;
      }
      images.push(imgSrc);
    }
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images.map(img => {
        let src = typeof img === 'string' ? img : (img.src || img.url);
        if (src && src.startsWith('/')) {
          src = 'https://healthway.com.bd' + src;
        }
        return src;
      }));
    }
    if (product.thumbnail) {
      let imgSrc = product.thumbnail;
      if (imgSrc.startsWith('/')) {
        imgSrc = 'https://healthway.com.bd' + imgSrc;
      }
      images.push(imgSrc);
    }

    // Extract prices - Healthway uses variant.price and variant.old_price
    const variant = product.variant || {};
    const price = parseFloat(variant.price || product.price || product.selling_price || product.sale_price || 0);
    const compareAtPrice = parseFloat(variant.old_price || product.regular_price || product.mrp || product.compare_at_price || price);

    // Extract name
    const name = product.name || 
                 product.title || 
                 product.product_name || 
                 `Tynor Product ${index + 1}`;

    // Extract category
    let category = 'Orthopedic Supports';
    if (product.category) {
      category = typeof product.category === 'string' 
        ? product.category 
        : (product.category.name || category);
    }
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      category = typeof product.categories[0] === 'string'
        ? product.categories[0]
        : (product.categories[0].name || category);
    }

    // Extract stock - Healthway uses variant.quantity
    const stock = parseInt(variant.quantity || product.stock || product.quantity || 100);

    return {
      name,
      price,
      compareAtPrice: compareAtPrice > price ? compareAtPrice : null,
      description: product.description || 
                   product.long_description || 
                   product.short_description || 
                   `${name} - High quality product from ${brandName}`,
      brand: brandName,
      category,
      stock,
      sku: product.sku || product.product_code || product.code || product.slug || product.id || '',
      images: images.filter(img => img && img.startsWith('http')),
      specifications: product.specifications || 
                     product.attributes || 
                     product.specs || 
                     {}
    };
  });

  // Save to products.json
  const output = { products: converted };
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  console.log(`✅ Converted ${converted.length} products\n`);
  console.log('📄 Output saved to: products.json\n');
  console.log('Products preview:');
  converted.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (৳${p.price?.toLocaleString()})`);
  });
  if (converted.length > 5) {
    console.log(`  ... and ${converted.length - 5} more\n`);
  }

  console.log('\n🚀 Ready to import!');
  console.log('   Run: npm run import:manual\n');

  // Show statistics
  const withImages = converted.filter(p => p.images.length > 0).length;
  const avgPrice = Math.round(converted.reduce((sum, p) => sum + p.price, 0) / converted.length);
  
  console.log('📊 Statistics:');
  console.log(`   Products with images: ${withImages}/${converted.length}`);
  console.log(`   Average price: ৳${avgPrice.toLocaleString()}`);
  console.log(`   Price range: ৳${Math.min(...converted.map(p => p.price)).toLocaleString()} - ৳${Math.max(...converted.map(p => p.price)).toLocaleString()}`);
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure healthway-raw.json contains valid JSON\n');
  process.exit(1);
}
