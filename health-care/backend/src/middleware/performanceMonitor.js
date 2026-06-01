/**
 * Performance Monitoring Middleware
 * Tracks API response times, memory usage, and request metrics
 */

const logger = require('../utils/logger');

// Store metrics in memory (in production, use Redis or external service)
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {},
    byMethod: {}
  },
  performance: {
    responseTimes: [],
    slowRequests: []
  },
  system: {
    startTime: Date.now(),
    lastCheck: Date.now()
  }
};

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  SLOW_REQUEST: 1000,      // 1 second
  VERY_SLOW_REQUEST: 3000, // 3 seconds
  CRITICAL_REQUEST: 5000   // 5 seconds
};

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    // Set X-Response-Time header on every response (Req 14.1, 14.8)
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }

    // Update metrics
    updateMetrics(req, res, duration, memoryDelta);

    // Log slow requests (>1s) — Req 14.1
    if (duration > THRESHOLDS.SLOW_REQUEST) {
      logSlowRequest(req, res, duration);
    }

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Update metrics
 */
function updateMetrics(req, res, duration, memoryDelta) {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  const method = req.method;
  const statusCode = res.statusCode;

  // Total requests
  metrics.requests.total++;

  // Success/Error count
  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.errors++;
  }

  // By endpoint
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = {
      count: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errors: 0
    };
  }
  const endpointMetrics = metrics.requests.byEndpoint[endpoint];
  endpointMetrics.count++;
  endpointMetrics.avgResponseTime = 
    (endpointMetrics.avgResponseTime * (endpointMetrics.count - 1) + duration) / endpointMetrics.count;
  endpointMetrics.minResponseTime = Math.min(endpointMetrics.minResponseTime, duration);
  endpointMetrics.maxResponseTime = Math.max(endpointMetrics.maxResponseTime, duration);
  if (statusCode >= 400) {
    endpointMetrics.errors++;
  }

  // By method
  if (!metrics.requests.byMethod[method]) {
    metrics.requests.byMethod[method] = 0;
  }
  metrics.requests.byMethod[method]++;

  // Response times (keep last 1000)
  metrics.performance.responseTimes.push({
    endpoint,
    duration,
    timestamp: Date.now(),
    statusCode,
    memoryDelta
  });
  if (metrics.performance.responseTimes.length > 1000) {
    metrics.performance.responseTimes.shift();
  }

  // Slow requests (keep last 100)
  if (duration > THRESHOLDS.SLOW_REQUEST) {
    metrics.performance.slowRequests.push({
      endpoint,
      duration,
      timestamp: Date.now(),
      statusCode,
      memoryDelta,
      query: req.query,
      params: req.params
    });
    if (metrics.performance.slowRequests.length > 100) {
      metrics.performance.slowRequests.shift();
    }
  }
}

/**
 * Log slow requests
 */
function logSlowRequest(req, res, duration) {
  const level = 
    duration > THRESHOLDS.CRITICAL_REQUEST ? 'error' :
    duration > THRESHOLDS.VERY_SLOW_REQUEST ? 'warn' : 'warn';

  logger[level]('SLOW_REQUEST', {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration,
    query: req.query,
    params: req.params,
    user: req.user?.id
  });
}

/**
 * Get metrics summary
 */
function getMetrics() {
  const uptime = Date.now() - metrics.system.startTime;
  const memory = process.memoryUsage();

  // Calculate average response time
  const avgResponseTime = metrics.performance.responseTimes.length > 0
    ? metrics.performance.responseTimes.reduce((sum, r) => sum + r.duration, 0) / metrics.performance.responseTimes.length
    : 0;

  // Calculate percentiles
  const sortedTimes = [...metrics.performance.responseTimes]
    .map(r => r.duration)
    .sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

  // Top 10 slowest endpoints
  const slowestEndpoints = Object.entries(metrics.requests.byEndpoint)
    .map(([endpoint, data]) => ({ endpoint, ...data }))
    .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
    .slice(0, 10);

  // Top 10 most used endpoints
  const mostUsedEndpoints = Object.entries(metrics.requests.byEndpoint)
    .map(([endpoint, data]) => ({ endpoint, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Error rate
  const errorRate = metrics.requests.total > 0
    ? (metrics.requests.errors / metrics.requests.total * 100).toFixed(2)
    : 0;

  return {
    uptime: {
      milliseconds: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000)
    },
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate: `${errorRate}%`,
      byMethod: metrics.requests.byMethod
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      slowRequestsCount: metrics.performance.slowRequests.length,
      recentSlowRequests: metrics.performance.slowRequests.slice(-10)
    },
    endpoints: {
      slowest: slowestEndpoints,
      mostUsed: mostUsedEndpoints
    },
    memory: {
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage()
    }
  };
}

/**
 * Reset metrics
 */
function resetMetrics() {
  metrics.requests = {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {},
    byMethod: {}
  };
  metrics.performance = {
    responseTimes: [],
    slowRequests: []
  };
  metrics.system.lastCheck = Date.now();
}

/**
 * Get health status (uses RSS vs system RAM — Node heap % alone is misleading)
 */
function getHealthStatus(serviceChecks = {}) {
  const os = require('os');
  const memory = process.memoryUsage();
  const totalMem = os.totalmem() || 1;
  const rssPercent = (memory.rss / totalMem) * 100;
  const heapUsedPercent = (memory.heapUsed / memory.heapTotal) * 100;
  const errorRate = metrics.requests.total > 0
    ? (metrics.requests.errors / metrics.requests.total * 100)
    : 0;

  const avgResponseTime = metrics.performance.responseTimes.length > 0
    ? metrics.performance.responseTimes.reduce((sum, r) => sum + r.duration, 0) / metrics.performance.responseTimes.length
    : 0;

  let status = 'healthy';
  const issues = [];

  if (serviceChecks.database === 'down') {
    status = 'critical';
    issues.push('Database disconnected');
  }

  if (rssPercent > 92) {
    status = 'critical';
    issues.push(`High process memory (${rssPercent.toFixed(1)}% of system RAM)`);
  } else if (rssPercent > 80) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Elevated process memory (${rssPercent.toFixed(1)}% of system RAM)`);
  }

  if (metrics.requests.total >= 10 && errorRate > 10) {
    status = 'critical';
    issues.push(`High error rate (${errorRate.toFixed(1)}%)`);
  } else if (metrics.requests.total >= 10 && errorRate > 5) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Elevated error rate (${errorRate.toFixed(1)}%)`);
  }

  if (metrics.requests.total >= 5 && avgResponseTime > THRESHOLDS.VERY_SLOW_REQUEST) {
    status = 'critical';
    issues.push(`Very slow responses (avg ${Math.round(avgResponseTime)}ms)`);
  } else if (metrics.requests.total >= 5 && avgResponseTime > THRESHOLDS.SLOW_REQUEST) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Slow responses (avg ${Math.round(avgResponseTime)}ms)`);
  }

  if (serviceChecks.redis === 'degraded' && status === 'healthy') {
    status = 'warning';
    issues.push('Redis cache unavailable (using memory fallback)');
  }

  return {
    status,
    issues,
    metrics: {
      memoryRss: `${rssPercent.toFixed(1)}%`,
      memoryHeap: `${heapUsedPercent.toFixed(1)}%`,
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      errorRate: `${errorRate.toFixed(1)}%`,
      avgResponseTime: `${Math.round(avgResponseTime)}ms`,
      totalRequests: metrics.requests.total,
    },
  };
}

module.exports = {
  performanceMonitor,
  getMetrics,
  resetMetrics,
  getHealthStatus
};
