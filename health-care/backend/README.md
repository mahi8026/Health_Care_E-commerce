# MedCore BD — Backend API

Express.js REST API for the MedCore BD medical equipment e-commerce platform.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **Database**: MongoDB 7+ (Mongoose ODM)
- **Cache**: Redis (ioredis) with in-memory fallback
- **Auth**: JWT (access: 15 min, refresh: 7 d)
- **Logging**: Winston + DailyRotateFile
- **Monitoring**: Sentry
- **Docs**: Swagger UI at `/api-docs`

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | ✅ | JWT signing secret (≥32 chars) | `your-secret-key` |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret | `your-refresh-secret` |
| `REDIS_HOST` | ⚠️ | Redis host | `localhost` |
| `REDIS_PORT` | ⚠️ | Redis port | `6379` |
| `REDIS_PASSWORD` | ⚠️ | Redis password | `your-password` |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS | `http://localhost:3000` |
| `PORT` | ❌ | Server port (default: 5000) | `5000` |
| `NODE_ENV` | ❌ | Environment | `development` |
| `SENTRY_DSN` | ⚠️ | Sentry DSN for error tracking | `https://...@sentry.io/...` |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Cloudinary for image uploads | `your-cloud` |
| `CLOUDINARY_API_KEY` | ⚠️ | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | ⚠️ | Cloudinary API secret | `your-secret` |

✅ Required  ⚠️ Recommended  ❌ Optional

## API Documentation

Swagger UI is available at: `http://localhost:5000/api-docs`

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (DB + Redis status) |
| `/api/monitoring/metrics` | GET | Performance metrics (Admin) |
| `/api/products` | GET | List products with filtering |
| `/api/products/:id` | GET | Get product by ID or slug |
| `/api/categories` | GET | List all categories |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login (returns JWT) |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/orders` | GET | List orders (authenticated) |
| `/api/cart` | GET | Get cart |

## Architecture

```
src/
├── config/         # Database, Passport, Sentry, Swagger config
├── controllers/    # Route handler logic
├── middleware/     # Auth, rate limiting, error handling, caching
├── models/         # Mongoose schemas with indexes
├── routes/         # Express route definitions
├── services/       # Business logic (Redis, email, SMS, WhatsApp)
└── utils/          # Helpers (logger, email, cron jobs)
```

## Security Features

- Helmet.js (CSP, HSTS, X-Frame-Options)
- Rate limiting: 5 req/15 min (auth), 100 req/15 min (API)
- JWT with 15 min access tokens + 7 d refresh tokens (httpOnly cookie)
- MongoDB injection prevention (express-mongo-sanitize)
- XSS protection (xss-clean)
- HTTP Parameter Pollution prevention (hpp)
- CORS with whitelist validation

## Performance Features

- Redis caching with TTLs (products: 1 h, categories: 24 h)
- Cache warming on startup (featured products, categories)
- ETag middleware for conditional GET responses
- Response compression (gzip, >1 KB threshold)
- MongoDB compound indexes on all query patterns
- Connection pooling (min: 10, max: 50)
- Slow query logging (>100 ms)
- Performance metrics at `/api/monitoring/metrics`

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage

# Load testing
npm run load-test
```

## Deployment

The backend is deployed on **Render**. See `render.yaml` for configuration.

```bash
# Production start
npm start
```
