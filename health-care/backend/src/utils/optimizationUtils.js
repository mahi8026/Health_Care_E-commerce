/**
 * Optimization Utilities
 * Performance optimization helpers and best practices
 */

const logger = require('./logger');

/**
 * Database Query Optimization Tips
 */
const queryOptimization = {
  // Use lean() for read-only queries
  useLean: (query) => query.lean(),

  // Select only needed fields
  selectFields: (query, fields) => query.select(fields),

  // Use indexes for frequently queried fields
  ensureIndexes: async (Model, indexes) => {
    try {
      for (const index of indexes) {
        await Model.createIndexes(index);
      }
      logger.info(`Indexes created for ${Model.modelName}`);
    } catch (error) {
      logger.error(`Index creation error for ${Model.modelName}:`, error);
    }
  },

  // Pagination helper
  paginate: (query, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  },

  // Batch operations
  batchInsert: async (Model, documents, batchSize = 1000) => {
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await Model.insertMany(batch, { ordered: false });
      results.push(...result);
    }

    return results;
  }
};

/**
 * Memory Optimization
 */
const memoryOptimization = {
  // Clear require cache (use with caution)
  clearRequireCache: (modulePath) => {
    delete require.cache[require.resolve(modulePath)];
  },

  // Force garbage collection (if --expose-gc flag is set)
  forceGC: () => {
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    } else {
      logger.warn('Garbage collection not exposed. Run with --expose-gc flag');
    }
  },

  // Monitor memory usage
  checkMemoryUsage: () => {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      logger.error('Critical memory usage:', {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        percent: `${heapUsedPercent.toFixed(2)}%`
      });
    } else if (heapUsedPercent > 75) {
      logger.warn('High memory usage:', {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        percent: `${heapUsedPercent.toFixed(2)}%`
      });
    }

    return usage;
  }
};

/**
 * Response Optimization
 */
const responseOptimization = {
  // Compress large responses
  shouldCompress: (req, _res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return true;
  },

  // Cache headers for static content
  setCacheHeaders: (res, maxAge = 3600) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
  },

  // ETag support
  setETag: (res, data) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.set('ETag', hash);
    return hash;
  }
};

/**
 * API Optimization Best Practices
 */
const apiOptimization = {
  // Implement pagination
  paginationDefaults: {
    page: 1,
    limit: 20,
    maxLimit: 100
  },

  // Rate limiting recommendations
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  },

  // Response time targets
  performanceTargets: {
    fast: 100,      // < 100ms
    acceptable: 500, // < 500ms
    slow: 1000,     // < 1s
    critical: 3000  // < 3s
  }
};

/**
 * Database Connection Pool Optimization
 */
const connectionPoolOptimization = {
  // Recommended MongoDB connection options
  mongooseOptions: {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000
  },

  // Monitor connection pool
  monitorPool: (mongoose) => {
    const db = mongoose.connection;
    
    db.on('connected', () => {
      logger.info('MongoDB connection pool established');
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB connection pool disconnected');
    });

    db.on('error', (err) => {
      logger.error('MongoDB connection pool error:', err);
    });
  }
};

/**
 * Image Optimization Recommendations
 */
const imageOptimization = {
  // Cloudinary transformation presets
  presets: {
    thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
    small: 'w_300,h_300,c_fill,q_auto,f_auto',
    medium: 'w_600,h_600,c_fill,q_auto,f_auto',
    large: 'w_1200,h_1200,c_fill,q_auto,f_auto'
  },

  // Generate optimized URL
  getOptimizedUrl: (cloudinaryUrl, preset = 'medium') => {
    if (!cloudinaryUrl) {
return null;
}
    
    const transformation = imageOptimization.presets[preset];
    return cloudinaryUrl.replace('/upload/', `/upload/${transformation}/`);
  }
};

/**
 * Caching Strategies
 */
const cachingStrategies = {
  // Cache TTL recommendations (in seconds)
  ttl: {
    static: 86400,      // 24 hours
    semiStatic: 3600,   // 1 hour
    dynamic: 300,       // 5 minutes
    realtime: 60        // 1 minute
  },

  // Cache key patterns
  keyPatterns: {
    product: (id) => `product:${id}`,
    products: (page, limit) => `products:${page}:${limit}`,
    user: (id) => `user:${id}`,
    order: (id) => `order:${id}`
  }
};

/**
 * Security Optimization
 */
const securityOptimization = {
  // Helmet configuration
  helmetConfig: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // CORS configuration
  corsConfig: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  }
};

/**
 * Logging Optimization
 */
const loggingOptimization = {
  // Log levels by environment
  logLevels: {
    development: 'debug',
    staging: 'info',
    production: 'warn'
  },

  // Structured logging format
  formatLog: (level, message, meta = {}) => {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
  }
};

module.exports = {
  queryOptimization,
  memoryOptimization,
  responseOptimization,
  apiOptimization,
  connectionPoolOptimization,
  imageOptimization,
  cachingStrategies,
  securityOptimization,
  loggingOptimization
};
