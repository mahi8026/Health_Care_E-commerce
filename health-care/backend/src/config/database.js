const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { slowQueryPlugin } = require('../utils/mongooseSlowQueryPlugin');

// Apply slow query logging plugin globally to all schemas
// Logs queries exceeding 100ms — Requirements 4.5, 4.8
mongoose.plugin(slowQueryPlugin, {
  threshold: 100, // Log queries slower than 100ms
  logAll: false   // Only log slow queries, not all queries
});

// Connection state tracking
let reconnectionAttempts = 0;
let isReconnecting = false;

// Connection pool options per Requirements 12.1, 12.3, 12.4, 12.6, 12.8
// Reverted to working settings - was stable before optimization
const POOL_OPTIONS = {
  minPoolSize: 10,
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  waitQueueTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

// Helper function to get pool metrics — Requirement 12.8
const getPoolMetrics = () => {
  try {
    const client = mongoose.connection.getClient();
    if (!client) {
      return { active: 0, idle: 0, waiting: 0, available: false };
    }

    const topology = client.topology;
    if (!topology) {
      return { active: 0, idle: 0, waiting: 0, available: false };
    }

    const servers = topology.s && topology.s.servers;
    if (!servers) {
      return { active: 0, idle: 0, waiting: 0, available: false };
    }

    let active = 0;
    let idle = 0;
    let waiting = 0;

    servers.forEach((server) => {
      const pool = server.s && server.s.pool;
      if (pool) {
        active += pool.currentCheckedOutCount || 0;
        idle += (pool.totalConnectionCount || 0) - (pool.currentCheckedOutCount || 0);
        waiting += pool.waitQueueSize || 0;
      }
    });

    return {
      active,
      idle,
      waiting,
      totalConnections: active + idle,
      available: true,
    };
  } catch (err) {
    logger.debug(`Pool metrics unavailable: ${err.message}`);
    return { active: 0, idle: 0, waiting: 0, available: false };
  }
};

// Log connection pool metrics (active, idle, waiting) — Requirement 12.8
const logPoolMetrics = () => {
  const metrics = getPoolMetrics();
  if (metrics.available) {
    logger.info('MongoDB connection pool metrics', {
      active: metrics.active,
      idle: metrics.idle,
      waiting: metrics.waiting,
      totalConnections: metrics.totalConnections,
    });
  }
};

// Exponential backoff reconnection function
const attemptReconnection = () => {
  if (isReconnecting) {
    return;
  }

  isReconnecting = true;
  reconnectionAttempts++;

  // Calculate delay: Math.min(2^attempt * 1000, 30000)
  const delay = Math.min(Math.pow(2, reconnectionAttempts) * 1000, 30000);

  logger.warn(`MongoDB reconnection attempt ${reconnectionAttempts} in ${delay}ms...`);

  setTimeout(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, POOL_OPTIONS);
      logger.info('MongoDB reconnection successful');
      reconnectionAttempts = 0;
      isReconnecting = false;
    } catch (error) {
      logger.error(`MongoDB reconnection attempt ${reconnectionAttempts} failed: ${error.message}`);
      isReconnecting = false;
      attemptReconnection();
    }
  }, delay);
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, POOL_OPTIONS);

    logger.info(`✓ MongoDB Connected: ${conn.connection.host}`, {
      minPoolSize: POOL_OPTIONS.minPoolSize,
      maxPoolSize: POOL_OPTIONS.maxPoolSize,
    });

    // Reset reconnection attempts on successful initial connection
    reconnectionAttempts = 0;

    // Run data synchronization after successful connection
    try {
      logger.info('🔄 Initializing data synchronization...');
      const { syncData } = require('../services/dataSync');
      await syncData();
      logger.info('✅ Data synchronization initialization complete');
    } catch (syncError) {
      logger.error(`❌ Data sync error: ${syncError.message}`);
      logger.error(`   Stack: ${syncError.stack}`);
      // Don't exit - allow server to continue
    }

    // Connection event handlers — Requirements 12.3, 12.4
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
      reconnectionAttempts = 0;
      logPoolMetrics();
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected - attempting reconnection...');
      attemptReconnection();
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
      reconnectionAttempts = 0;
      isReconnecting = false;
      logPoolMetrics();
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error', err);
      // Do not exit process for post-connection errors
    });

    // Log pool metrics on initial connection
    logPoolMetrics();

    // Periodically log connection pool metrics every 60 seconds — Requirement 12.8
    const poolMetricsInterval = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        logPoolMetrics();
      }
    }, 60000);

    // Prevent the interval from keeping the process alive on shutdown
    if (poolMetricsInterval.unref) {
      poolMetricsInterval.unref();
    }

  } catch (error) {
    logger.error(`✗ MongoDB Connection Error: ${error.message}`);
    logger.warn('⚠️  Server will continue without database. Only health-check and cached endpoints will work.');
    logger.warn('⚠️  The server will automatically reconnect when MongoDB becomes available.');
    attemptReconnection();
  }
};

module.exports = connectDB;
module.exports.getPoolMetrics = getPoolMetrics;
