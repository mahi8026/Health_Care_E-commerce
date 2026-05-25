require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
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

// Initialize express app
const app = express();

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
// Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com"],
      connectSrc: ["'self'", "https://*.cloudinary.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
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

    // Allow requests with no origin (mobile apps, Postman, server-side, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || isVercelPreview) {
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

// ── Passport Initialization ──────────────────────────────────────────────────
app.use(passport.initialize());

// ── Security & Optimization ──────────────────────────────────────────────────
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution
app.use(compression()); // Response compression

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Performance Monitoring ────────────────────────────────────────────────────
app.use(performanceMonitor);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Enhanced rate limiting is applied per-route (see routes files)
// Global API limiter is not needed as we use specific limiters per endpoint

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

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
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
    documentation: '/api/health',
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

// ── Start Server ──────────────────────────────────────────────────────────────
// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    logger.info(`MedCore BD API v2.0 running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    startCronJobs();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
      await redisCache.close();
      logger.info('Server closed. Process terminating...');
      process.exit(0);
    });
  });
}

module.exports = app;
