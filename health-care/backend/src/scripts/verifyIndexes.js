/**
 * Database Index Verification Script
 * Checks if critical indexes exist for optimal query performance
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Required indexes for optimal performance
 */
const REQUIRED_INDEXES = {
  products: [
    { key: { slug: 1 }, name: 'slug_1', unique: true },
    { key: { category: 1, isActive: 1 }, name: 'category_1_isActive_1' },
    { key: { brand: 1, isActive: 1 }, name: 'brand_1_isActive_1' },
    { key: { isActive: 1, createdAt: -1 }, name: 'isActive_1_createdAt_-1' },
    { key: { isFeatured: 1, isActive: 1 }, name: 'isFeatured_1_isActive_1' },
    { key: { name: 'text', description: 'text', tags: 'text' }, name: 'text_search' }
  ],
  orders: [
    { key: { user: 1, createdAt: -1 }, name: 'user_1_createdAt_-1' },
    { key: { orderNumber: 1 }, name: 'orderNumber_1', unique: true },
    { key: { status: 1, createdAt: -1 }, name: 'status_1_createdAt_-1' }
  ],
  users: [
    { key: { email: 1 }, name: 'email_1', unique: true },
    { key: { role: 1 }, name: 'role_1' }
  ],
  categories: [
    { key: { slug: 1 }, name: 'slug_1', unique: true },
    { key: { isActive: 1 }, name: 'isActive_1' }
  ],
  manufacturers: [
    { key: { slug: 1 }, name: 'slug_1', unique: true },
    { key: { isActive: 1 }, name: 'isActive_1' }
  ],
  reviews: [
    { key: { status: 1, createdAt: -1 }, name: 'status_1_createdAt_-1' }
  ],
  orders: [
    { key: { 'items.product': 1 }, name: 'items.product_1' }
  ]
};

/**
 * Get existing indexes for a collection
 */
async function getCollectionIndexes(collectionName) {
  try {
    const collection = mongoose.connection.db.collection(collectionName);
    const indexes = await collection.indexes();
    return indexes;
  } catch (error) {
    logger.error(`Error getting indexes for ${collectionName}: ${error.message}`);
    return [];
  }
}

/**
 * Check if an index exists
 */
function indexExists(existingIndexes, requiredIndex) {
  // Check by name first
  if (requiredIndex.name) {
    const found = existingIndexes.find(idx => idx.name === requiredIndex.name);
    if (found) {
return true;
}
  }

  // Check by key structure
  return existingIndexes.some(idx => {
    const idxKeys = JSON.stringify(idx.key);
    const reqKeys = JSON.stringify(requiredIndex.key);
    return idxKeys === reqKeys;
  });
}

/**
 * Create missing index
 */
async function createIndex(collectionName, indexSpec) {
  try {
    const collection = mongoose.connection.db.collection(collectionName);
    const options = { name: indexSpec.name };
    
    if (indexSpec.unique) {
      options.unique = true;
    }

    await collection.createIndex(indexSpec.key, options);
    logger.info(`✅ Created index ${indexSpec.name} on ${collectionName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to create index ${indexSpec.name} on ${collectionName}: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyIndexes() {
  try {
    logger.info('🔍 Starting database index verification...\n');

    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB\n');

    let totalRequired = 0;
    let totalExisting = 0;
    let totalCreated = 0;
    let totalFailed = 0;

    // Check each collection
    for (const [collectionName, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
      logger.info(`📊 Checking collection: ${collectionName}`);
      
      const existingIndexes = await getCollectionIndexes(collectionName);
      logger.info(`   Found ${existingIndexes.length} existing indexes`);

      totalRequired += requiredIndexes.length;

      // Check each required index
      for (const requiredIndex of requiredIndexes) {
        if (indexExists(existingIndexes, requiredIndex)) {
          logger.info(`   ✅ ${requiredIndex.name} - exists`);
          totalExisting++;
        } else {
          logger.warn(`   ⚠️  ${requiredIndex.name} - MISSING`);
          
          // Attempt to create missing index
          const created = await createIndex(collectionName, requiredIndex);
          if (created) {
            totalCreated++;
          } else {
            totalFailed++;
          }
        }
      }

      logger.info(''); // Empty line for readability
    }

    // Summary
    logger.info('═══════════════════════════════════════════════════');
    logger.info('📈 INDEX VERIFICATION SUMMARY');
    logger.info('═══════════════════════════════════════════════════');
    logger.info(`Total required indexes: ${totalRequired}`);
    logger.info(`Already existing: ${totalExisting}`);
    logger.info(`Created: ${totalCreated}`);
    logger.info(`Failed: ${totalFailed}`);
    logger.info(`Coverage: ${Math.round(((totalExisting + totalCreated) / totalRequired) * 100)}%`);
    logger.info('═══════════════════════════════════════════════════\n');

    if (totalFailed > 0) {
      logger.warn(`⚠️  ${totalFailed} indexes failed to create. Check error logs above.`);
    } else if (totalCreated > 0) {
      logger.info(`✅ Successfully created ${totalCreated} missing indexes!`);
    } else {
      logger.info('✅ All required indexes already exist!');
    }

  } catch (error) {
    logger.error(`❌ Index verification failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('👋 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  verifyIndexes()
    .then(() => {
      logger.info('✅ Index verification complete');
      process.exit(0);
    })
    .catch(error => {
      logger.error(`❌ Index verification failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { verifyIndexes };
