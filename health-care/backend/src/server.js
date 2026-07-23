/**
 * MediportBD Backend API Server
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

// ── Global unhandled rejection handler ─────────────────────────────────────────
// Prevents the process from crashing on unhandled promise rejections (Node.js default)
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason?.message || reason}`);
});

// Initialize express app
const app = express();

// Create HTTP server (needed for Socket.IO)
const httpServer = http.createServer(app);

// ── EARLY HEALTH CHECK (Railway) ─────────────────────────────────────────────
// This MUST be before all middleware to ensure Railway healthcheck passes
// Returns 200 immediately if server is running, regardless of DB/Redis status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'MediportBD API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Initialize Sentry (must be before other middleware)
initSentry(app);

// Connect to database
connectDB().catch((err) => {
  logger.error(`Unhandled error in connectDB: ${err.message}`);
});

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

// ── CRITICAL: Handle CORS preflight OPTIONS requests FIRST ──────────────────
// OPTIONS requests MUST be handled before any other middleware (including dbHealthCheck)
// This ensures preflight requests always get proper CORS headers, even if DB is down
app.options('*', (req, res) => {
  const origin = req.headers.origin;
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

  // In development, allow all localhost origins
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isLocalhost = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));

  if (!origin || allowedOrigins.includes(origin) || isVercelPreview || isCloudflarePreview || (isDevelopment && isLocalhost)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // OPTIONS requests should always return 204 No Content
  res.status(204).end();
});

app.use(cors(corsOptions));

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

// ── Request Timeout Middleware ────────────────────────────────────────────────
// Prevent requests from hanging for 120+ seconds
// Requirement: 12.3 - Prevent indefinite request hangs
app.use((req, res, next) => {
  // Set 30-second timeout for all requests
  req.setTimeout(30000, () => {
    logger.error(`Request timeout: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - operation took too long',
        error: 'ETIMEDOUT'
      });
    }
  });

  res.setTimeout(30000, () => {
    logger.error(`Response timeout: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        message: 'Gateway timeout - server took too long to respond',
        error: 'GATEWAY_TIMEOUT'
      });
    }
  });

  next();
});

// ── Performance Monitoring ────────────────────────────────────────────────────
app.use(performanceMonitor);

// ── API Documentation (Swagger) ───────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MediportBD API Documentation',
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
app.use('/api/home', require('./routes/homeRoutes')); // Aggregated homepage data - handles DB errors gracefully
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
app.use('/api/settings', require('./routes/settings')); // Site settings - handles DB errors gracefully
app.use('/api/search', dbHealthCheck, require('./routes/search')); // Search and trending
app.use('/api/recommendations', dbHealthCheck, require('./routes/recommendationRoutes')); // AI-powered recommendations
app.use('/api/data-sync', dbHealthCheck, require('./routes/dataSyncRoutes')); // Data synchronization
app.use('/api/product-sync', dbHealthCheck, require('./routes/productSyncRoutes')); // Product import/sync
app.use('/api/whatsapp', require('./routes/whatsappRoutes')); // WhatsApp automation (webhook is public, others protected)
app.use('/api/chat', require('./routes/chatRoutes')); // Live chat integration
app.use('/api/loyalty', dbHealthCheck, require('./routes/loyaltyRoutes')); // Loyalty program
app.use('/api/admin/b2b', dbHealthCheck, require('./routes/b2bRoutes')); // B2B management (admin only)
app.use('/api/flash-deals', require('./routes/flashDealRoutes')); // Flash deals - handles DB errors gracefully
app.use('/api/test', dbHealthCheck, require('./routes/testRoutes')); // Test and debugging endpoints (admin only)
app.use('/api/utils', dbHealthCheck, require('./routes/adminUtilRoutes')); // Utility endpoints (fix category counts, etc.)

// ── One-time slug migration endpoint (admin, secret-protected) ───────────────
// Regenerates all product slugs using the clean name-only format.
// Hit once after deploy: GET /api/fix-slugs?secret=<ADMIN_SECRET>
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.warn('⚠️  ADMIN_SECRET not set - admin utility routes will not work');
}
app.get('/api/fix-slugs', async (req, res) => {
  if (!ADMIN_SECRET || req.query.secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid secret or ADMIN_SECRET not configured' });
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

// ── Seed Sample Products ───────────────────────────────────────────────────────
app.get('/api/seed-products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const Manufacturer = require('./models/Manufacturer');
    const Category = require('./models/Category');

    async function ensureManufacturer(name) {
      let m = await Manufacturer.findOne({ name });
      if (!m) m = await Manufacturer.create({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), description: `${name} - Medical equipment manufacturer`, isActive: true });
      return m._id;
    }
    async function ensureCategory(name) {
      let c = await Category.findOne({ name });
      if (!c) c = await Category.create({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), description: `${name} category`, isActive: true });
      return c._id;
    }

    const productData = [
      { name: 'Siemens Cardiostat ECG 12-lead', brand: 'Siemens Healthineers', category: 'Diagnostic Equipment', sku: 'SIE-ECG-001', price: 95000, oldPrice: 110000, stock: 45, description: 'Professional 12-lead ECG machine', isFeatured: true, badge: 'sale' },
      { name: 'GE Vivid E95 Ultrasound System', brand: 'GE Healthcare', category: 'Diagnostic Equipment', sku: 'GE-US-002', price: 2850000, stock: 3, description: 'Premium cardiovascular ultrasound system', isFeatured: true, badge: 'new' },
      { name: 'Philips IntelliVue MX40 Monitor', brand: 'Philips', category: 'Diagnostic Equipment', sku: 'PHI-MON-003', price: 185000, stock: 28, description: 'Portable patient monitoring system' },
      { name: 'Omron Digital Blood Pressure Monitor', brand: 'Omron', category: 'Diagnostic Equipment', sku: 'OMR-BP-004', price: 3500, oldPrice: 4200, stock: 150, description: 'Automatic upper arm BP monitor', isFeatured: true, badge: 'bestseller' },
      { name: 'Beurer Infrared Thermometer', brand: 'Beurer', category: 'Diagnostic Equipment', sku: 'BEU-TH-005', price: 2800, stock: 95, description: 'Non-contact infrared thermometer' },
      { name: 'Surgical Scissor Set 5-pc', brand: 'Aesculap', category: 'Surgical Instruments', sku: 'AES-SCI-006', price: 12500, stock: 65, description: 'Premium surgical scissors set' },
      { name: 'Disposable Surgical Blade Box 100', brand: 'Swann-Morton', category: 'Surgical Instruments', sku: 'SWA-BLA-007', price: 4500, stock: 8, minOrderQty: 10, description: 'Sterile surgical blades, box of 100' },
      { name: 'Surgical Forceps Set 8-pc', brand: 'KLS Martin', category: 'Surgical Instruments', sku: 'KLS-FOR-008', price: 18500, stock: 42, description: 'Precision titanium forceps set' },
      { name: 'Electrosurgical Pencil', brand: 'Medtronic', category: 'Surgical Instruments', sku: 'MED-ESP-009', price: 8500, stock: 55, description: 'Reusable electrosurgical pencil' },
      { name: 'Surgical Suture Kit Absorbable', brand: 'Ethicon', category: 'Surgical Instruments', sku: 'ETH-SUT-010', price: 6500, stock: 120, description: 'Absorbable sutures assorted', badge: 'bestseller' },
      { name: 'Roche Cobas HbA1c Reagent Kit', brand: 'Roche Diagnostics', category: 'Laboratory Reagents', sku: 'ROC-HBA-011', price: 8500, stock: 8, minOrderQty: 5, description: 'HbA1c testing reagent', isFeatured: true, badge: 'new' },
      { name: 'Abbott Troponin I Reagent', brand: 'Abbott Laboratories', category: 'Laboratory Reagents', sku: 'ABB-TRO-012', price: 22000, stock: 15, minOrderQty: 2, description: 'Cardiac marker reagent', isFeatured: true },
      { name: 'Beckman CBC Reagent Pack', brand: 'Beckman Coulter', category: 'Laboratory Reagents', sku: 'BEC-CBC-013', price: 18000, stock: 62, description: 'CBC reagent pack' },
      { name: 'Siemens Liver Function Panel', brand: 'Siemens Healthineers', category: 'Laboratory Reagents', sku: 'SIE-LFP-014', price: 14500, stock: 30, description: 'Liver function testing panel' },
      { name: 'Bio-Rad Lipid Profile Reagent', brand: 'Bio-Rad', category: 'Laboratory Reagents', sku: 'BIO-LIP-015', price: 16500, stock: 35, description: 'Lipid profile testing reagent' },
      { name: 'Sysmex Hematology Reagent', brand: 'Sysmex', category: 'Laboratory Reagents', sku: 'SYS-HEM-016', price: 19500, stock: 28, description: 'Hematology analyzer reagent' },
      { name: 'Ortho Immunoassay Reagent', brand: 'Ortho Clinical', category: 'Laboratory Reagents', sku: 'ORT-IMM-017', price: 24500, stock: 18, minOrderQty: 2, description: 'Immunoassay reagent' },
      { name: 'Randox Creatinine Reagent', brand: 'Randox', category: 'Laboratory Reagents', sku: 'RAN-CRE-018', price: 9500, stock: 48, description: 'Creatinine testing reagent' },
      { name: 'Mindray BeneVision N12 Monitor', brand: 'Mindray', category: 'Hospital Machines', sku: 'MIN-PM-019', price: 285000, stock: 12, description: 'Multi-parameter patient monitor' },
      { name: 'Dräger Savina 300 Ventilator', brand: 'Dräger', category: 'Hospital Machines', sku: 'DRA-VEN-020', price: 1850000, stock: 5, description: 'ICU ventilator', badge: 'new' },
      { name: 'Fresenius 4008S Dialysis Machine', brand: 'Fresenius', category: 'Hospital Machines', sku: 'FRE-DIA-021', price: 1250000, stock: 8, description: 'Hemodialysis machine' },
      { name: 'Medtronic PB 980 Ventilator', brand: 'Medtronic', category: 'Hospital Machines', sku: 'MED-VEN-022', price: 2150000, stock: 4, description: 'Advanced ICU ventilator' },
      { name: 'Eppendorf Centrifuge 5810R', brand: 'Eppendorf', category: 'Lab Equipment', sku: 'EPP-CEN-023', price: 485000, stock: 6, description: 'Refrigerated benchtop centrifuge' },
      { name: 'Thermo Fisher PCR Cycler', brand: 'Thermo Fisher', category: 'Lab Equipment', sku: 'THE-PCR-024', price: 625000, stock: 4, description: 'PCR thermal cycler', badge: 'new' },
      { name: 'Mettler Toledo Analytical Balance', brand: 'Mettler Toledo', category: 'Lab Equipment', sku: 'MET-BAL-025', price: 185000, stock: 15, description: 'Precision analytical balance' },
      { name: 'Labconco Biosafety Cabinet II', brand: 'Labconco', category: 'Lab Equipment', sku: 'LAB-BSC-026', price: 725000, stock: 3, description: 'Class II biosafety cabinet' },
      { name: '3M N95 Respirator Mask Box 20', brand: '3M', category: 'PPE', sku: '3M-N95-027', price: 2500, stock: 250, minOrderQty: 10, description: 'N95 respirator masks', badge: 'bestseller' },
      { name: 'Ansell Surgical Gloves Sterile 50pr', brand: 'Ansell', category: 'PPE', sku: 'ANS-GLV-028', price: 3500, stock: 180, minOrderQty: 5, description: 'Sterile latex surgical gloves' },
      { name: 'Stryker Hip Implant System', brand: 'Stryker', category: 'Implants', sku: 'STR-HIP-029', price: 385000, stock: 12, description: 'Total hip replacement system' },
      { name: 'Zimmer Knee Implant', brand: 'Zimmer Biomet', category: 'Implants', sku: 'ZIM-KNE-030', price: 425000, stock: 8, description: 'Total knee replacement implant' },
    ];

    let created = 0;
    for (const data of productData) {
      const [brandId, categoryId] = await Promise.all([
        ensureManufacturer(data.brand),
        ensureCategory(data.category),
      ]);
      const exists = await Product.findOne({ sku: data.sku });
      if (!exists) {
        await Product.create({ ...data, brand: brandId, category: categoryId, isActive: true });
        created++;
      }
    }

    res.json({ success: true, productsCreated: created, total: await Product.countDocuments() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Admin Email Test ──────────────────────────────────────────────────────────
app.get('/api/test-email', async (req, res) => {
  if (req.query.secret !== ADMIN_SECRET) {
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
  if (!ADMIN_SECRET || req.query.secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid secret or ADMIN_SECRET not configured' });
  }
  res.json({
    success: true,
    email: {
      resendApiKey: process.env.RESEND_API_KEY ? `✓ Configured (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : '✗ MISSING',
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)',
      emailFromName: process.env.EMAIL_FROM_NAME || 'MediportBD',
      frontendUrl: process.env.FRONTEND_URL || 'https://health-care-e-commerce-murex.vercel.app'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5000
    },
    message: 'If resendApiKey is MISSING, add RESEND_API_KEY to Render environment variables'
  });
});

// ── Detailed Health Check (with DB status) ───────────────────────────────────
// This provides detailed status info but is not used by Railway healthcheck
app.get('/api/health/detailed', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }[dbState] || 'unknown';

  // Health check passes if API is running, even if DB is still connecting
  // This prevents Railway deployment failures during startup
  const isHealthy = dbState === 1 || dbState === 2;

  res.status(isHealthy ? 200 : 503).json({
    success: true,
    status: isHealthy ? 'healthy' : 'degraded',
    message: 'MediportBD API is running',
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
    message: 'MediportBD API Server',
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
  const HOST = process.env.HOST || '0.0.0.0'; // Railway requires 0.0.0.0
  
  httpServer.listen(PORT, HOST, () => {
    logger.info(`MediportBD API v2.0 running on ${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    
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
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Promise Rejection detected:', {
      error: err.message,
      stack: err.stack,
      promise: promise
    });
    console.error('❌ UNHANDLED REJECTION:', err);
    console.error('Stack:', err.stack);
    httpServer.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception detected:', {
      error: err.message,
      stack: err.stack
    });
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    console.error('Stack:', err.stack);
    process.exit(1);
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
