# MediportBD Backend API

Production-ready Express.js backend for MediportBD medical equipment e-commerce platform.

---

## 🚀 Deployment

### Railway.app (Recommended - No Card Required)

**Quick Deploy:**
```bash
# 1. Sign up: https://railway.app (use GitHub)
# 2. New Project → Deploy from GitHub → Health_Care_E-commerce
# 3. Settings → Root Directory: health-care/backend
# 4. Variables → RAW EDITOR → Paste from RAILWAY_ENV_VARIABLES.env
# 5. Settings → Generate Domain
# 6. Done! 🎉
```

**Guides:**
- 📖 Quick Start: `RAILWAY_QUICK_START.md`
- 📖 Full Guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
- 📖 Simple Guide: `DEPLOY.md`

**Free Tier:** $5 credit/month (runs 24/7, no card required)

---

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.22
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis (ioredis) with in-memory fallback
- **Auth:** Passport.js (JWT + Google OAuth 2.0)
- **Security:** Helmet, CORS, Rate Limiting, XSS Protection
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer
- **SMS:** Twilio
- **Testing:** Jest + Supertest
- **Logging:** Winston + Morgan
- **Error Tracking:** Sentry

---

## 📦 Installation

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your credentials

# Start development server
npm run dev
```

Server runs on: http://localhost:5001

---

## 🔐 Environment Variables

Required variables in `.env`:

```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

**Generate secrets:**
```bash
node ../generate-secrets.js
```

See `.env.example` for all variables.

---

## 📋 Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start with nodemon (development)
npm test               # Run tests with coverage
npm run test:watch     # Run tests in watch mode
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run seed           # Seed database with sample data
npm run diagnose       # Check MongoDB connection
```

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/google
```

### Products
```
GET    /api/products
GET    /api/products/:id
POST   /api/products (admin)
PUT    /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

### Orders
```
GET    /api/orders (authenticated)
GET    /api/orders/:id (authenticated)
POST   /api/orders (authenticated)
PUT    /api/orders/:id/status (admin)
```

**Full API Documentation:** `/api-docs` (Swagger UI)

---

## 🗄️ Database

### MongoDB Collections

- **users** - User accounts (B2C, B2B, Admin)
- **products** - Product catalog
- **categories** - Product categories
- **brands** - Product brands
- **orders** - Customer orders
- **carts** - Shopping carts
- **quotes** - B2B quote requests
- **reviews** - Product reviews
- **wishlist** - User wishlists
- **notifications** - User notifications
- **settings** - System settings

---

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Rate limiting (900 requests per 15 min)
- ✅ Helmet security headers
- ✅ CORS protection
- ✅ XSS protection
- ✅ MongoDB injection prevention
- ✅ HPP (HTTP Parameter Pollution) prevention
- ✅ CSRF protection
- ✅ Input validation (express-validator)
- ✅ Password hashing (bcrypt)
- ✅ Two-factor authentication (2FA)

---

## 📊 Monitoring

### Health Check Endpoint
```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67,
  "mongodb": "connected",
  "redis": "connected"
}
```

### Logs

- **Development:** Console output
- **Production:** Winston (file + console)
- **HTTP Logs:** Morgan

### Error Tracking

- Sentry integration for error monitoring
- Automatic error reporting in production

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Coverage Thresholds:**
- Branches: 60%
- Functions: 60%
- Lines: 60%

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Express app entry point
├── tests/               # Test files
├── .env.example         # Environment template
├── package.json         # Dependencies
├── railway.toml         # Railway configuration
└── nixpacks.toml        # Build configuration
```

---

## 🔄 Deployment Files

- **Railway:** `railway.toml`, `nixpacks.toml`, `.railwayignore`
- **Environment:** `RAILWAY_ENV_VARIABLES.env`
- **Guides:** `DEPLOY.md`, `RAILWAY_QUICK_START.md`

---

## 📞 Support

### Documentation
- Quick Start: `RAILWAY_QUICK_START.md`
- Full Guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
- Comparison: `DEPLOYMENT_COMPARISON.md`

### External Resources
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Express.js: https://expressjs.com

---

## 📄 License

MIT License - MediportBD

---

## 👨‍💻 Author

MediportBD Team
- Email: mahimrahman07@gmail.com
- Phone: +880 1646-886795

---

**Ready to deploy? Open `DEPLOY.md` for quick start! 🚀**
