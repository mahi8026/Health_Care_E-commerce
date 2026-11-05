require('dotenv').config();
const redisClient = require('./src/services/redisCache');

async function clearCache() {
  console.log('\n🗑️  Clearing product cache...\n');
  
  try {
    // Clear all product-related cache keys
    const patterns = [
      'products:*',
      'product:*',
      'categories:*',
      'brands:*',
      'manufacturers:*'
    ];

    let totalCleared = 0;

    for (const pattern of patterns) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          console.log(`✅ Cleared ${keys.length} keys matching: ${pattern}`);
          totalCleared += keys.length;
        } else {
          console.log(`ℹ️  No keys found for: ${pattern}`);
        }
      } catch (err) {
        console.log(`⚠️  Could not clear ${pattern}: ${err.message}`);
      }
    }

    console.log(`\n✅ Total cache entries cleared: ${totalCleared}\n`);
    console.log('💡 Now refresh your frontend to see the new images!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Cache might not be running, but that\'s okay!');
    console.log('   Just refresh your browser to see the new images.\n');
    process.exit(0);
  }
}

clearCache();
