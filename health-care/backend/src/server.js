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
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { startCronJobs } = require('./utils/stockAlertCron');
const logger = require('./utils/logger');
const { performanceMonitor } = require('./middleware/performanceMonitor');
const { monitorConnections } = require('./utils/databaseMonitor');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Start database monitoring
monitorConnections();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3002'
  ],
  credentials: true
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
// Skip rate limiting in development
if (process.env.NODE_ENV !== 'development') {
  app.use('/api/', apiLimiter);
}

// ── Static files (local upload fallback — dev only) ──────────────────────────
const path = require('path');
const fs = require('fs');
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/monitoring', require('./routes/monitoringRoutes'));
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MedCore BD API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
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

module.exports = app;
