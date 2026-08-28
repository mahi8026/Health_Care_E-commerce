require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const human = await Manufacturer.findOne({ slug: 'human' });
  const products = await Product.find({ brand: human._id }, 'sku name tests price').lean();

  const targets = ['Thromboplastin', 'Fibrinogen', 'CA 125'];
  const matches = products.filter(p => targets.some(t => p.name.includes(t)));
  if (matches.length === 0) {
    console.log('None of the 3 products exist in the database at all.');
  } else {
    matches.forEach(p => console.log(`SKU: ${p.sku} | Price: ${p.price} | Pack: ${p.tests} | Name: ${p.name}`));
  }
  await mongoose.connection.close();
}
main();
