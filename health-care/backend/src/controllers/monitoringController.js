const mongoose = require('mongoose');
const { getMetrics, getHealthStatus } = require('../middleware/performanceMonitor');
const redisCache = require('../services/redisCache');
const logger = require('../utils/logger');

function getServiceChecks() {
  const dbState = mongoose.connection.readyState;
  return {
    database: dbState === 1 ? 'up' : dbState === 2 ? 'connecting' : 'down',
    redis: redisCache.isRedisConnected() ? 'up' : 'degraded',
    api: 'up',
  };
}

function getSystemInfoPayload() {
  const memory = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const os = require('os');

  return {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
    },
    memory: {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss,
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      rssMB: Math.round(memory.rss / 1024 / 1024),
      systemTotalMB: Math.round(os.totalmem() / 1024 / 1024),
      heapUsedPercent: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1),
      rssPercent: ((memory.rss / os.totalmem()) * 100).toFixed(1),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
    },
  };
}

/**
 * @desc    Combined monitoring payload for admin UI
 */
exports.getMonitoringDashboard = (req, res) => {
  try {
    const services = getServiceChecks();
    const health = getHealthStatus(services);
    const metrics = getMetrics();
    const system = getSystemInfoPayload();

    res.status(200).json({
      success: true,
      data: {
        health,
        services,
        metrics,
        system,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Monitoring dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load monitoring data',
      error: error.message,
    });
  }
};

exports.getServiceChecks = getServiceChecks;
exports.getSystemInfoPayload = getSystemInfoPayload;
