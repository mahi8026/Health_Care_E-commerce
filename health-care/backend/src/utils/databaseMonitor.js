/**
 * Database Monitoring Utilities
 * Monitor MongoDB performance and connection health
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const db = mongoose.connection.db;
    
    // Get database stats
    const dbStats = await db.stats();
    
    // Get collection stats
    const collections = await db.listCollections().toArray();
    const collectionStats = await Promise.all(
      collections.map(async (col) => {
        const stats = await db.collection(col.name).stats();
        return {
          name: col.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes,
          indexSize: stats.totalIndexSize
        };
      })
    );

    // Get connection pool stats
    const connectionStats = {
      readyState: mongoose.connection.readyState,
      readyStateText: getReadyStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };

    return {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
        avgObjSize: dbStats.avgObjSize
      },
      collections: collectionStats,
      connection: connectionStats
    };
  } catch (error) {
    logger.error('Database stats error:', error);
    throw error;
  }
}

/**
 * Get connection ready state text
 */
function getReadyStateText(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return {
        status: 'unhealthy',
        message: 'Database not connected',
        readyState: getReadyStateText(mongoose.connection.readyState)
      };
    }

    // Ping database
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - startTime;

    // Check if ping time is acceptable
    const status = pingTime < 100 ? 'healthy' : pingTime < 500 ? 'warning' : 'unhealthy';

    return {
      status,
      message: `Database ${status}`,
      pingTime: `${pingTime}ms`,
      readyState: 'connected'
    };
  } catch (error) {
    logger.error('Database health check error:', error);
    return {
      status: 'unhealthy',
      message: 'Database health check failed',
      error: error.message
    };
  }
}

/**
 * Get slow queries (requires MongoDB profiling to be enabled)
 */
async function getSlowQueries(limit = 10) {
  try {
    const db = mongoose.connection.db;
    
    // Check if profiling is enabled
    const profilingLevel = await db.command({ profile: -1 });
    
    if (profilingLevel.was === 0) {
      return {
        message: 'Database profiling is not enabled',
        recommendation: 'Enable profiling with: db.setProfilingLevel(1, { slowms: 100 })'
      };
    }

    // Get slow queries from system.profile collection
    const slowQueries = await db.collection('system.profile')
      .find({ millis: { $gt: 100 } })
      .sort({ ts: -1 })
      .limit(limit)
      .toArray();

    return {
      count: slowQueries.length,
      queries: slowQueries.map(q => ({
        operation: q.op,
        namespace: q.ns,
        duration: `${q.millis}ms`,
        timestamp: q.ts,
        command: q.command
      }))
    };
  } catch (error) {
    logger.error('Slow queries retrieval error:', error);
    return {
      error: error.message,
      message: 'Failed to retrieve slow queries'
    };
  }
}

/**
 * Get index usage statistics
 */
async function getIndexStats() {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const indexStats = await Promise.all(
      collections.map(async (col) => {
        const indexes = await db.collection(col.name).indexes();
        const stats = await db.collection(col.name).aggregate([
          { $indexStats: {} }
        ]).toArray();

        return {
          collection: col.name,
          indexes: indexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            unique: idx.unique || false,
            sparse: idx.sparse || false
          })),
          usage: stats.map(s => ({
            name: s.name,
            accesses: s.accesses.ops,
            since: s.accesses.since
          }))
        };
      })
    );

    return indexStats;
  } catch (error) {
    logger.error('Index stats error:', error);
    throw error;
  }
}

/**
 * Monitor database connections
 */
function monitorConnections() {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  // Log connection pool events
  mongoose.connection.on('close', () => {
    logger.info('MongoDB connection closed');
  });
}

module.exports = {
  getDatabaseStats,
  checkDatabaseHealth,
  getSlowQueries,
  getIndexStats,
  monitorConnections
};
