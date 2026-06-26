/**
 * MedCore BD Backend API Server
 * Production-ready Express.js server with MongoDB, Redis, and comprehensive security
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const { dbHealthCheck } = require('./middleware/dbHealthCheck');
const errorHandler = require('./middleware/errorHandler');
const { startCronJobs } = require('./utils/stockAlertCron');
const logger = require('./utils/logger');
const { performanceMonitor } = require('./middleware/performanceMonitor');
const { monitorConnections } = require('./utils/databaseMonitor');
const redisCache = require('./services/redisCache');
const { initSentry, sentryErrorHandler } = require('./config/sentry');
const requestId = require('./middleware/requestId');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const http = require('http');
const chatSocketService = require('./services/chatSocketService');
const chatRoutingService = require('./services/chatRoutingService');
const { etagMiddleware } = require('./middleware/etag');

// Initialize express app
const app = express();

// Create HTTP server (needed for Socket.IO)
const httpServer = http.createServer(app);

// Initialize Sentry (must be before other middleware)
initSentry(app);

// Connect to database
connectDB();

// Initialize Redis cache
(async () => {
  try {
    const client = redisCache.getRedisClient();
    if (client && redisCache.isRedisConnected()) {
      logger.info('✅ Redis cache initialized successfully');
    } else {
      logger.warn('⚠️  Redis connection failed. Continuing without cache.');
    }
  } catch (error) {
    logger.warn(`⚠️  Redis connection failed: ${error.message}. Continuing without cache.`);
  }
})();

// Start database monitoring
monitorConnections();

// ── Security Middleware ──────────────────────────────────────────────────────
// Helmet: sets security-related HTTP response headers.
// Covers: CSP (10.5), HSTS (10.5), X-Frame-Options (10.5), X-Content-Type-Options,
//         X-XSS-Protection, Referrer-Policy, and Permissions-Policy.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'", "https://*.cloudinary.com"],
      upgradeInsecureRequests: [],
    }
  },
  // HSTS: enforce HTTPS for 1 year, include subdomains, allow preload list
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  // X-Frame-Options: DENY — prevents clickjacking
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff — prevents MIME-type sniffing
  noSniff: true,
  // X-XSS-Protection: legacy header for older browsers
  xssFilter: true,
  // Referrer-Policy: limit referrer information sent to third parties
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
    ].filter(Boolean);

    // Allow all Vercel preview URLs
    const isVercelPreview = origin && origin.includes('.vercel.app');

    // Allow all Cloudflare Workers/Pages preview URLs
    const isCloudflarePreview = origin && (
      origin.includes('.workers.dev') ||
      origin.includes('.pages.dev')
    );

    // Allow requests with no origin (mobile apps, Postman, server-side, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || isVercelPreview || isCloudflarePreview) {
      callback(null, true);
    } else {
      logger.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Explicitly handle preflight for all routes
app.options('*', cors(corsOptions));

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Cookie Parser ─────────────────────────────────────────────────────────────
// Required to read httpOnly cookies (e.g. refresh token) via req.cookies.
// CSRF note: This API uses stateless JWT authentication. csurf middleware is NOT
// applied because all state-changing endpoints require a Bearer token in the
// Authorization header (which cross-origin requests cannot set without CORS
// pre-flight approval). The refresh token cookie uses SameSite=strict (prod) /
// SameSite=lax (dev) + httpOnly, which provides equivalent CSRF protection for
// cookie-based flows. See Req 10.4.
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ── Passport Initialization ──────────────────────────────────────────────────
app.use(passport.initialize());

// ── Security & Optimization ──────────────────────────────────────────────────
// These three middleware MUST be applied after body parsers and BEFORE all routes.
app.use(mongoSanitize()); // Req 10.6 — strip MongoDB operators ($gt, $ne, etc.) from req.body/params/query
app.use(xssClean());      // Req 10.7 — HTML-encode dangerous characters in req.body/params/query
app.use(hpp());           // Req 10.8 — collapse duplicate query-string params to prevent HPP attacks
app.use(compression({ threshold: 1024, level: 6 })); // Compress responses >1KB (Req 6.1)

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Request ID Middleware ─────────────────────────────────────────────────────
// Generate UUID v4 for each request and set X-Request-ID header
app.use(requestId);

// ── Performance Monitoring ────────────────────────────────────────────────────
app.use(performanceMonitor);

// ── API Documentation (Swagger) ───────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MedCore BD API Documentation',
  customfavIcon: '/favicon.ico'
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// General API limiter: 100 requests per 15 minutes per IP (Req 10.2)
// Applied before all /api/* routes so every endpoint is covered.
// Auth-specific limiter (5 req/15 min) is applied directly on login/register routes.
const { apiLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);

// ── Static files (local upload fallback — dev only) ──────────────────────────
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ── Routes ───────────────────────────────────────────────────────────────────
// Note: Rate limiting is applied per-route in individual route files
// Health check and monitoring endpoints (no database health check middleware)
app.use('/api/monitoring', require('./routes/monitoringRoutes'));

// Database-dependent routes (protected by dbHealthCheck middleware)
app.use('/api/auth', dbHealthCheck, require('./routes/authRoutes')); // Has its own rate limiters
app.use('/api/products', dbHealthCheck, require('./routes/productRoutes'));
app.use('/api/orders', dbHealthCheck, require('./routes/orderRoutes'));
app.use('/api/payments', dbHealthCheck, require('./routes/paymentRoutes')); // Has its own rate limiters
app.use('/api/analytics', dbHealthCheck, require('./routes/analyticsRoutes'));
app.use('/api/quotes', dbHealthCheck, require('./routes/quoteRoutes'));
app.use('/api/notifications', dbHealthCheck, require('./routes/notificationRoutes'));
app.use('/api/admin', dbHealthCheck, require('./routes/adminRoutes')); // Has its own rate limiters
app.use('/api/invoices', dbHealthCheck, require('./routes/invoiceRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes')); // Has its own rate limiters (no DB check needed for uploads)
app.use('/api/returns', dbHealthCheck, require('./routes/returnRoutes'));
app.use('/api/coupons', dbHealthCheck, require('./routes/couponRoutes'));
app.use('/api/categories', dbHealthCheck, require('./routes/categoryRoutes'));
app.use('/api/manufacturers', dbHealthCheck, require('./routes/manufacturerRoutes'));
app.use('/api/reviews', dbHealthCheck, require('./routes/reviewRoutes'));
app.use('/api/wishlist', dbHealthCheck, require('./routes/wishlistRoutes'));
app.use('/api/cart', dbHealthCheck, require('./routes/cartRoutes'));
app.use('/api/newsletter', dbHealthCheck, require('./routes/newsletterRoutes'));
app.use('/api/activity-logs', dbHealthCheck, require('./routes/activityLogRoutes'));
app.use('/api/sms', dbHealthCheck, require('./routes/smsRoutes'));
app.use('/api/settings', dbHealthCheck, require('./routes/settings')); // Site settings
app.use('/api/search', dbHealthCheck, require('./routes/search')); // Search and trending
app.use('/api/data-sync', dbHealthCheck, require('./routes/dataSyncRoutes')); // Data synchronization
app.use('/api/product-sync', dbHealthCheck, require('./routes/productSyncRoutes')); // Product import/sync
app.use('/api/whatsapp', require('./routes/whatsappRoutes')); // WhatsApp automation (webhook is public, others protected)
app.use('/api/chat', require('./routes/chatRoutes')); // Live chat integration
app.use('/api/loyalty', dbHealthCheck, require('./routes/loyaltyRoutes')); // Loyalty program
app.use('/api/flash-deals', dbHealthCheck, require('./routes/flashDealRoutes')); // Flash deals management

// ── One-time slug migration endpoint (admin, secret-protected) ───────────────
// Regenerates all product slugs using the clean name-only format.
// Hit once after deploy: GET /api/fix-slugs?secret=medcore-test-2026
app.get('/api/fix-slugs', async (req, res) => {
  if (req.query.secret !== 'medcore-test-2026') {
    return res.status(401).json({ success: false, message: 'Invalid secret' });
  }
  try {
    const Product = require('./models/Product');
    const products = await Product.find({});
    const results = [];
    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products) {
      const oldSlug = product.slug;
      try {
        product.slug = undefined;
        product.markModified('name');
        await product.save();
        if (oldSlug !== product.slug) {
          results.push({ name: product.name, old: oldSlug, new: product.slug });
          fixed++;
        } else {
          skipped++;
        }
      } catch (err) {
        results.push({ name: product.name, error: err.message });
        errors++;
      }
    }

    res.json({
      success: true,
      summary: { total: products.length, fixed, skipped, errors },
      changes: results.filter(r => r.old !== r.new || r.error),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin Email Test ──────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
  if (req.query.secret !== 'medcore-test-2026') {
    return res.status(401).json({ success: false, message: 'Invalid secret' });
  }
  const emailService = require('./services/emailService');
  const to = req.query.to || 'test@example.com';
  try {
    const info = await emailService.sendTestEmail(to);
    if (info.error) {
      return res.status(400).json({ success: false, error: info.error, resend: { apiKey: process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing', fromEmail: process.env.RESEND_FROM_EMAIL } });
    }
    res.json({ success: true, message: `Test email sent to ${to}`, messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, resend: { apiKey: process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing', provider: 'Resend' } });
  }
});

// ── Email Status Debug (admin only) ──────────────────────────────────────────
app.get('/api/email-debug', async (req, res) => {
  if (req.query.secret !== 'medcore-test-2026') {
    return res.status(401).json({ success: false, message: 'Invalid secret' });
  }
  res.json({
    success: true,
    email: {
      resendApiKey: process.env.RESEND_API_KEY ? `✓ Configured (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : '✗ MISSING',
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)',
      emailFromName: process.env.EMAIL_FROM_NAME || 'MedCore BD',
      frontendUrl: process.env.FRONTEND_URL || 'https://medcorebd.pages.dev'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5000
    },
    message: 'If resendApiKey is MISSING, add RESEND_API_KEY to Render environment variables'
  });
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbState] || 'unknown';

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    status: isHealthy ? 'healthy' : 'degraded',
    message: 'MedCore BD API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: {
        status: dbStatus,
        connected: dbState === 1,
        host: dbState === 1 ? mongoose.connection.host : null
      },
      redis: {
        status: redisCache.isRedisConnected() ? 'connected' : 'disconnected',
        fallback: !redisCache.isRedisConnected() ? 'memory-store' : null
      }
    }
  });
});

// ── Public Stats ──────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const User = require('./models/User');
    const Order = require('./models/Order');
    const Manufacturer = require('./models/Manufacturer');

    const [totalProducts, totalB2BClients, totalOrders, totalBrands] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'b2b_customer' }),
      Order.countDocuments(),
      Manufacturer.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalBrands,
        totalOrders,
        totalB2BClients,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ── Root Route ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MedCore BD API Server',
    version: '2.0.0',
    status: 'operational',
    documentation: '/api-docs',
    health: '/api/health',
    endpoints: {
      health: '/api/health',
      stats: '/api/stats',
      products: '/api/products',
      categories: '/api/categories',
      manufacturers: '/api/manufacturers',
      auth: '/api/auth',
      orders: '/api/orders',
      cart: '/api/cart',
      wishlist: '/api/wishlist'
    },
    timestamp: new Date().toISOString()
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Centralised Error Handler ─────────────────────────────────────────────────
// Sentry error handler (must be before custom error handler)
app.use(sentryErrorHandler());
app.use(errorHandler);

// ── Cache Warming ─────────────────────────────────────────────────────────────
/**
 * Pre-populate Redis with high-traffic data on server startup.
 * Called 3 seconds after listen() to allow the DB to be fully ready.
 * Requirements: 5.1, 5.4, 6.2
 */
async function warmCache() {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.info('[Cache Warming] DB not ready — skipping warm-up');
      return;
    }
    if (!redisCache.isRedisConnected()) {
      logger.info('[Cache Warming] Redis not connected — skipping warm-up');
      return;
    }

    logger.info('[Cache Warming] Starting cache warm-up...');
    
    // Use centralized cache warming from redisCache service
    const result = await redisCache.warmAllCaches();
    
    if (result.successful > 0) {
      logger.info(`[Cache Warming] ✅ Warm-up complete: ${result.successful}/${result.successful + result.failed} caches warmed in ${result.duration}ms`);
    } else {
      logger.warn(`[Cache Warming] ⚠️  Warm-up failed: ${result.failed} caches failed`);
    }
  } catch (err) {
    logger.warn(`[Cache Warming] Failed: ${err.message}`);
  }
}

// ── Start Server ──────────────────────────────────────────────────────────────
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    logger.info(`MedCore BD API v2.0 running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    
    // Initialize Socket.IO
    chatSocketService.initialize(httpServer);
    
    // Start chat queue processor
    chatRoutingService.startQueueProcessor();
    
    // Start cron jobs
    startCronJobs();

    // Warm critical caches after DB is ready (3s delay for stability)
    setTimeout(warmCache, 3000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });

  // Shared graceful shutdown logic — Requirements 12.2, 12.9, 12.10
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
      } catch (err) {
        logger.error(`Error closing MongoDB connection: ${err.message}`);
      }
      try {
        await redisCache.close();
        logger.info('Redis connection closed.');
      } catch (err) {
        logger.error(`Error closing Redis connection: ${err.message}`);
      }
      logger.info('Server closed. Process terminating...');
      process.exit(0);
    });
  };

  // SIGTERM: sent by process managers (Render, Heroku, Docker, PM2) on deploy/scale-down
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // SIGINT: sent by Ctrl+C in development
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
