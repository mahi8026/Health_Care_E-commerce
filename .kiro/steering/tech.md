# Technology Stack

## Architecture

**Full-stack monorepo** with separate frontend and backend in `health-care/` directory.

### Frontend Stack

- **Framework**: Next.js 16.2.3 (App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4 with PostCSS
- **Fonts**: Plus Jakarta Sans (body), Lora (headings) via next/font
- **State Management**: React Context API (AuthContext, CartContext, WishlistContext)
- **Image Optimization**: Next.js Image component + Cloudinary
- **Analytics**: Google Analytics 4 (react-ga4)
- **Error Tracking**: Sentry (@sentry/nextjs)
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Icons**: react-icons
- **Date Handling**: date-fns

### Backend Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (ioredis) with in-memory fallback
- **Authentication**: Passport.js (JWT + Google OAuth 2.0)
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, express-mongo-sanitize, hpp, xss-clean
- **Rate Limiting**: express-rate-limit with Redis store
- **Validation**: express-validator
- **Email**: Nodemailer
- **Logging**: Winston + Morgan
- **Cron Jobs**: node-cron (stock alerts)
- **Error Tracking**: Sentry (@sentry/node)
- **PDF Generation**: PDFKit
- **QR Codes**: qrcode
- **2FA**: speakeasy

### Development Tools

- **Testing**: Jest + @testing-library/react (frontend), Jest + Supertest (backend)
- **Linting**: ESLint with Next.js config
- **Git Hooks**: Husky + Commitlint (conventional commits)
- **Performance**: Lighthouse CI (@lhci/cli)
- **Bundle Analysis**: @next/bundle-analyzer

### Deployment

- **Frontend**: Vercel (production + preview deployments)
- **Backend**: Render.com or Heroku (see render.yaml, Procfile)
- **Database**: MongoDB Atlas
- **Cache**: Redis Cloud or Upstash
- **CDN**: Cloudinary for images

## Common Commands

### Frontend (run from `health-care/`)

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Performance
npm run lighthouse       # Run Lighthouse CI audit
npm run analyze          # Analyze bundle size
```

### Backend (run from `health-care/backend/`)

```bash
# Development
npm run dev              # Start with nodemon (localhost:5000)

# Production
npm start                # Start production server

# Database
npm run seed             # Seed database with sample data
npm run fix:categories   # Fix product categories
npm run fix:brands       # Fix product brands
npm run diagnose         # Diagnose MongoDB connection

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues

# Testing
npm test                 # Run Jest tests with coverage
npm run test:watch       # Run tests in watch mode
```

## Configuration Files

### Frontend

- **next.config.mjs**: Next.js configuration (API proxy, image optimization, compiler options)
- **tailwind.config.js**: Tailwind CSS configuration
- **jsconfig.json**: Path aliases (`@/*` → `./src/*`)
- **.env.local**: Development environment variables
- **.env.production**: Production environment variables
- **commitlint.config.js**: Commit message linting
- **jest.config.js**: Jest testing configuration
- **lighthouserc.js**: Lighthouse CI configuration

### Backend

- **.env**: Backend environment variables (MongoDB URI, JWT secret, API keys)
- **.eslintrc.js**: ESLint configuration
- **jest.config.js**: Jest testing configuration
- **render.yaml**: Render.com deployment config
- **Procfile**: Heroku deployment config

## Environment Variables

### Frontend Required

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx
NEXT_PUBLIC_BING_SITE_VERIFICATION=xxx
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

### Backend Required

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medcore
JWT_SECRET=xxx
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FRONTEND_URL=http://localhost:3000
```

## Path Aliases

Use `@/` prefix for all imports:
- `@/components` → `src/components`
- `@/config` → `src/config`
- `@/utils` → `src/utils`
- `@/context` → `src/context`
- `@/hooks` → `src/hooks`
- `@/services` → `src/services`
- `@/views` → `src/views`

## API Integration

Frontend communicates with backend via:
- **Development**: `/api/*` proxied to `http://localhost:5000/api/*` (see next.config.mjs rewrites)
- **Production**: Direct calls to `NEXT_PUBLIC_API_URL`

## Performance Optimizations

- **Image Optimization**: Use Next.js `<Image>` component, not `<img>` tags
- **Font Loading**: Fonts preloaded via next/font with `display: 'swap'`
- **Code Splitting**: Automatic via Next.js App Router
- **Compression**: Enabled on backend (compression middleware)
- **Caching**: Redis for API responses, Next.js fetch cache with revalidation
- **Minification**: SWC minifier (default in Next.js 16+)
- **Console Removal**: Production builds remove console.log (keep error/warn)

## SEO Configuration

- **Centralized Config**: `src/config/seo.js` (SITE_CONFIG, PAGE_SEO, CATEGORY_SEO)
- **Metadata**: Export `metadata` object or `generateMetadata()` function in page files
- **Structured Data**: JSON-LD schemas in `src/components/seo/` and `src/utils/structuredData.js`
- **Sitemap**: Dynamic generation in `src/app/sitemap.js`
- **Robots**: Configuration in `src/app/robots.js`
- **Image Alt Text**: Always provide descriptive alt text for SEO
- **Canonical URLs**: Set via `alternates.canonical` in metadata
