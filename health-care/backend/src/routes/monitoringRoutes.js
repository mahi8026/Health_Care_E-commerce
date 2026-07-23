/**

 * Monitoring Routes

 * Endpoints for system monitoring, metrics, and health checks

 */



const express = require('express');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const { resetMetrics } = require('../middleware/performanceMonitor');

const {

  getMonitoringDashboard,

  getServiceChecks,

  getSystemInfoPayload,

} = require('../controllers/monitoringController');

const { getHealthStatus } = require('../middleware/performanceMonitor');

const logger = require('../utils/logger');



/**

 * @route   GET /api/monitoring/health

 * @desc    Get system health status

 * @access  Public

 */

router.get('/health', (req, res) => {

  try {

    const services = getServiceChecks();

    const health = getHealthStatus(services);

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 503;



    res.status(statusCode).json({

      success: true,

      data: health,

    });

  } catch (error) {

    logger.error('Health check error:', error);

    res.status(500).json({

      success: false,

      message: 'Health check failed',

      error: error.message,

    });

  }

});



/**

 * @route   GET /api/monitoring/dashboard

 * @desc    Combined health, metrics, system info (admin)

 * @access  Admin only

 */

router.get('/dashboard', protect, authorize('admin'), getMonitoringDashboard);



/**

 * @route   GET /api/monitoring/metrics

 * @desc    Get detailed performance metrics

 * @access  Admin only

 */

router.get('/metrics', protect, authorize('admin'), (req, res) => {

  try {

    const { getMetrics } = require('../middleware/performanceMonitor');

    res.status(200).json({

      success: true,

      data: getMetrics(),

    });

  } catch (error) {

    logger.error('Metrics retrieval error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to retrieve metrics',

      error: error.message,

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

      message: 'Metrics reset successfully',

    });

  } catch (error) {

    logger.error('Metrics reset error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to reset metrics',

      error: error.message,

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

    res.status(200).json({

      success: true,

      data: getSystemInfoPayload(),

    });

  } catch (error) {

    logger.error('System info retrieval error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to retrieve system information',

      error: error.message,

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

    res.status(200).json({

      success: true,

      message: 'Logs endpoint - integrate with Winston file transport or external service',

      data: {

        note: 'Configure Winston file transport to store logs',

        recommendation: 'Use external logging service like Loggly, Papertrail, or CloudWatch',

      },

    });

  } catch (error) {

    logger.error('Logs retrieval error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to retrieve logs',

      error: error.message,

    });

  }

});



module.exports = router;

