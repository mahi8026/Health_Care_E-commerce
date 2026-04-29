require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { startCronJobs } = require('./utils/stockAlertCron');
const logger = require('./utils/logger');
const { performanceMonitor } = require('./middleware/performanceMonitor');
const { monitorConnections } = require('./utils/databaseMonitor');
const redisCache = require('./services/redisCache');

// Initialize express app
const app = express();

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
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.google.com", "https://www.gstatic.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.google.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.cloudinary.com"]
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
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3000'
    ];
    
    // Allow all Vercel preview URLs
    const isVercelPreview = origin && origin.includes('.vercel.app');
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
}));

// ── Body Parsers ─────────────────────────────────────────────────────────────
// Raw body for Stripe webhooks (must come before express.json())
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── Routes ───────────────────────────────────────────────────────────────────
// Note: Rate limiting is applied per-route in individual route files
app.use('/api/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/auth', require('./routes/authRoutes')); // Has its own rate limiters
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes')); // Has its own rate limiters
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes')); // Has its own rate limiters
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes')); // Has its own rate limiters
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/manufacturers', require('./routes/manufacturerRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api/sms', require('./routes/smsRoutes'));
app.use('/api/migration', require('./routes/migrationRoutes')); // Database migration endpoints

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MedCore BD API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
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

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Centralised Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
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

module.exports = app;
