/**
 * Monitoring Routes
 * Endpoints for system monitoring, metrics, and health checks
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getMetrics, resetMetrics, getHealthStatus } = require('../middleware/performanceMonitor');
const logger = require('../utils/logger');

/**
 * @route   GET /api/monitoring/health
 * @desc    Get system health status
 * @access  Public
 */
router.get('/health', (req, res) => {
  try {
    const health = getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get detailed performance metrics
 * @access  Admin only
 */
router.get('/metrics', protect, authorize('admin'), (req, res) => {
  try {
    const metrics = getMetrics();

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Metrics retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/monitoring/metrics/reset
 * @desc    Reset performance metrics
 * @access  Admin only
 */
router.post('/metrics/reset', protect, authorize('admin'), (req, res) => {
  try {
    resetMetrics();
    logger.info('Performance metrics reset by admin', { admin: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error('Metrics reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/monitoring/system
 * @desc    Get system information
 * @access  Admin only
 */
router.get('/system', protect, authorize('admin'), (req, res) => {
  try {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime()
      },
      memory: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        heapUsedPercent: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(2)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001
      }
    };

    res.status(200).json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    logger.error('System info retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system information',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/monitoring/logs
 * @desc    Get recent logs (last 100)
 * @access  Admin only
 */
router.get('/logs', protect, authorize('admin'), (req, res) => {
  try {
    // In production, this would read from log files or external logging service
    // For now, return a placeholder
    res.status(200).json({
      success: true,
      message: 'Logs endpoint - integrate with Winston file transport or external service',
      data: {
        note: 'Configure Winston file transport to store logs',
        recommendation: 'Use external logging service like Loggly, Papertrail, or CloudWatch'
      }
    });
  } catch (error) {
    logger.error('Logs retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      error: error.message
    });
  }
});

module.exports = router;
