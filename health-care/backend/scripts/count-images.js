require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Mediport').then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const total = await Product.countDocuments();
  const withImages = await Product.countDocuments({ 'images.0': { $exists: true } });
  console.log(`Total products: ${total}`);
  console.log(`With images: ${withImages}`);
  console.log(`Without images: ${total - withImages}`);
  await mongoose.disconnect();
});
