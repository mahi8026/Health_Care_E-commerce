#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Test 1: exact name lookup (what backend does when category name is passed)
  const categoryName = 'IV & Infusion Therapy';
  const cat1 = await Category.findOne({
    name: { $regex: new RegExp('^' + escapeRegex(categoryName) + '$', 'i') }
  }).lean();
  console.log('1. Name lookup for "' + categoryName + '":', cat1 ? '✅ Found: ' + cat1.name : '❌ NOT FOUND');

  // Test 2: slug lookup
  const cat2 = await Category.findOne({ slug: 'iv-and-infusion-therapy' }).lean();
  console.log('2. Slug lookup "iv-and-infusion-therapy":', cat2 ? '✅ Found: ' + cat2.name : '❌ NOT FOUND');

  // Test 3: products count
  if (cat2) {
    const count = await Product.countDocuments({ category: cat2._id, isActive: true });
    console.log('3. Products in category:', count);
    const prods = await Product.find({ category: cat2._id, isActive: true }).select('name').lean();
    prods.forEach(p => console.log('   -', p.name));
  }

  // Test 4: What does the category page pass? Check CATEGORY_SLUG_MAP resolution
  // URL: /products/category/iv-and-infusion-therapy
  // CategoryPage resolves: CATEGORY_SLUG_MAP['iv-and-infusion-therapy'] = 'IV & Infusion Therapy'
  // ProductsPage gets initialCategory = 'IV & Infusion Therapy'
  // productFilters.category = 'IV & Infusion Therapy'
  // API sends: GET /products?category=IV+%26+Infusion+Therapy
  // Backend decodes: 'IV & Infusion Therapy' — then does name regex lookup
  
  console.log('\n4. Checking if & causes regex escape issue:');
  const escaped = escapeRegex('IV & Infusion Therapy');
  console.log('   Escaped pattern:', escaped);
  const testRegex = new RegExp('^' + escaped + '$', 'i');
  console.log('   Regex:', testRegex.toString());
  
  const cat3 = await Category.findOne({
    name: { $regex: testRegex }
  }).lean();
  console.log('   Result:', cat3 ? '✅ Found: ' + cat3.name : '❌ NOT FOUND');

  // Test 5: try finding all categories with IV in name
  const ivCats = await Category.find({ name: /IV/i }).lean();
  console.log('\n5. All categories with "IV" in name:');
  ivCats.forEach(c => console.log('   -', c.name, '| slug:', c.slug, '| id:', c._id));

  await mongoose.connection.close();
});
