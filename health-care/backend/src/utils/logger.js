const winston = require('winston');
require('winston-daily-rotate-file');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// ─── Formats ────────────────────────────────────────────────────────────────

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `${timestamp} ${level}: ${message}${metaStr}\n${stack}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// ─── Transports ─────────────────────────────────────────────────────────────

const transports = [];

// Console transport — always present; colorized in development
transports.push(
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : jsonFormat,
    silent: isTest,
  })
);

// File transport with daily rotation — skip in test environment
if (!isTest) {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonFormat,
      // Create the logs directory automatically if it doesn't exist
      createSymlink: true,
      symlinkName: 'app-current.log',
    })
  );

  // Separate file for errors only
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: jsonFormat,
    })
  );
}

// ─── Logger instance ─────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'warn'),
  format: jsonFormat,
  defaultMeta: { service: 'medcore-api' },
  transports,
});

// ─── Helper: slow query logging ──────────────────────────────────────────────

/**
 * Log a slow MongoDB query (>100ms).
 * @param {Object} params
 * @param {string} params.query      - Query description or filter JSON
 * @param {number} params.duration   - Query duration in milliseconds
 * @param {string} params.collection - MongoDB collection name
 */
logger.slowQuery = function slowQuery({ query, duration, collection }) {
  logger.warn('SLOW_QUERY', {
    query,
    duration,
    collection,
    threshold: 100,
    timestamp: new Date().toISOString(),
  });
};

// ─── Helper: cache miss logging ───────────────────────────────────────────────

/**
 * Log a Redis cache miss.
 * @param {Object} params
 * @param {string} params.key       - Cache key that was missed
 * @param {string} params.operation - Operation that triggered the miss (e.g. 'getProducts')
 */
logger.cacheMiss = function cacheMiss({ key, operation }) {
  logger.debug('CACHE_MISS', {
    key,
    operation,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
