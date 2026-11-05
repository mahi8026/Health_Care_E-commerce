const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../src/models/Product');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const p = await Product.findOne({ sku: 'UM-KSC-F02-M' }, 'sku specifications');
  console.log('Is Map?', p.specifications instanceof Map);
  if (p.specifications instanceof Map) {
    console.log('Entries:', [...p.specifications.entries()].slice(0,3));
  }
  mongoose.connection.close();
});
