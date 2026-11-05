const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const products = await Product.find(
    { sku: { $in: ['CMF-EXG-M-100', 'CMF-EXG-L-100', 'CMF-SRG-1PR'] } },
    'name sku images'
  );
  products.forEach(p => {
    console.log('\n' + p.name + ' (' + p.sku + ')');
    if (p.images.length === 0) {
      console.log('  ⚠️  No images!');
    } else {
      p.images.forEach((img, i) => console.log('  Image ' + (i+1) + ': ' + img.url));
    }
  });
  mongoose.connection.close();
});
