const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHelper');

/**
 * @desc    Get activity logs with filters
 * @route   GET /api/activity-logs
 * @access  Private/Admin
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      category,
      userId,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    const query = {};

    // Filter by action
    if (action) {
      query.action = action;
    }

    // Filter by category (action prefix)
    if (category) {
      query.action = { $regex: `^${category}`, $options: 'i' };
    }

    // Filter by user
    if (userId) {
      query.user = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = end;
      }
    }

    // Search by user email or target name
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      query.$or = [
        { userEmail: { $regex: escaped, $options: 'i' } },
        { targetName: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get logs
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    return paginatedResponse(res, logs, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1
    });
  } catch (error) {
    logger.error(`[getActivityLogs] ${error.message}`);
    return errorResponse(res, 'Failed to fetch activity logs', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get activity log statistics
 * @route   GET /api/activity-logs/stats
 * @access  Private/Admin
 */
exports.getActivityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalToday,
      adminActionsToday,
      failedToday,
      activeUsersToday,
      actionBreakdown
    ] = await Promise.all([
      // Total actions today
      ActivityLog.countDocuments({
        createdAt: { $gte: today }
      }),

      // Admin actions today
      ActivityLog.countDocuments({
        createdAt: { $gte: today },
        userRole: 'admin'
      }),

      // Failed actions today
      ActivityLog.countDocuments({
        createdAt: { $gte: today },
        status: 'failed'
      }),

      // Active users today (distinct)
      ActivityLog.distinct('user', {
        createdAt: { $gte: today },
        user: { $ne: null }
      }).then(users => users.length),

      // Action breakdown by category
      ActivityLog.aggregate([
        {
          $match: {
            createdAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    return successResponse(res, {
      totalToday,
      adminActionsToday,
      failedToday,
      activeUsersToday,
      actionBreakdown
    });
  } catch (error) {
    logger.error(`[getActivityStats] ${error.message}`);
    return errorResponse(res, 'Failed to fetch activity statistics', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Export activity logs to CSV
 * @route   GET /api/activity-logs/export
 * @access  Private/Admin
 */
exports.exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 7 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    const logs = await ActivityLog.find({
      createdAt: { $gte: start, $lte: end }
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Build CSV
    const headers = [
      'Timestamp',
      'User Email',
      'User Role',
      'Action',
      'Target Model',
      'Target Name',
      'IP Address',
      'Status',
      'Error Message'
    ];

    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.userEmail || 'N/A',
      log.userRole || 'N/A',
      log.action,
      log.targetModel || 'N/A',
      log.targetName || 'N/A',
      log.ipAddress || 'N/A',
      log.status,
      log.errorMessage || 'N/A'
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`);

    res.status(200).send(csvContent);
  } catch (error) {
    logger.error(`[exportActivityLogs] ${error.message}`);
    return errorResponse(res, 'Failed to export activity logs', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};

/**
 * @desc    Get single activity log by ID
 * @route   GET /api/activity-logs/:id
 * @access  Private/Admin
 */
exports.getActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('user', 'name email role phone company')
      .lean();

    if (!log) {
      return errorResponse(res, 'Activity log not found', null, 404);
    }

    return successResponse(res, log);
  } catch (error) {
    logger.error(`[getActivityLog] ${error.message}`);
    return errorResponse(res, 'Failed to fetch activity log', process.env.ERROR_DETAIL_ENABLED === 'true' ? [error.message] : null, 500);
  }
};
