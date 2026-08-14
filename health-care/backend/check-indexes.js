require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
const match = uri.match(/mongodb\+srv:\/\/([^@]+)@([^/]+)\/([^?]+)/);
const [, creds, host, dbname] = match;
const shardHosts = ['ac-1xiqjkm-shard-00-00', 'ac-1xiqjkm-shard-00-01', 'ac-1xiqjkm-shard-00-02']
  .map(h => `${h}.rqyzhey.mongodb.net:27017`);

const directUri = `mongodb://${creds}@${shardHosts.join(',')}/${dbname}?ssl=true&authSource=admin&replicaSet=atlas-ac-1xiqjkm&serverSelectionTimeoutMS=15000`;

async function main() {
  await mongoose.connect(directUri);
  const db = mongoose.connection.db;

  const required = {
    products: [
      { key: { createdAt: -1, isActive: 1 }, name: 'createdAt_-1_isActive_1' },
      { key: { isActive: 1, createdAt: -1 }, name: 'isActive_1_createdAt_-1' },
      { key: { category: 1, isActive: 1, price: 1 }, name: 'category_1_isActive_1_price_1' },
      { key: { isActive: 1 }, name: 'isActive_1' },
    ],
    reviews: [
      { key: { status: 1, createdAt: -1 }, name: 'status_1_createdAt_-1' },
    ],
    orders: [
      { key: { 'items.product': 1 }, name: 'items.product_1' },
    ],
  };

  for (const [collName, specs] of Object.entries(required)) {
    const coll = db.collection(collName);
    const count = await coll.countDocuments();
    const indexes = await coll.indexes();
    console.log(`\n=== ${collName} (${count} docs) ===`);
    for (const spec of specs) {
      const exists = indexes.some(idx =>
        JSON.stringify(idx.key) === JSON.stringify(spec.key)
      );
      console.log(`${exists ? 'OK ' : 'MISSING'} ${spec.name}  ${JSON.stringify(spec.key)}`);
    }
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error('FAILED:', err.message); process.exit(1); });