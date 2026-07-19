# MedCore BD — Medical Equipment E-Commerce Platform

<div align="center">

![MedCore BD](https://img.shields.io/badge/MedCore-BD-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A comprehensive B2B and B2C e-commerce platform for medical equipment, surgical instruments, laboratory reagents, and hospital supplies in Bangladesh.

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [SEO & Performance](#seo--performance)
- [Contributing](#contributing)
- [License](#license)

---

## 🏥 Overview

MedCore BD is a full-stack medical equipment e-commerce platform serving Bangladesh's healthcare sector. The platform connects hospitals, clinics, diagnostic centers, and healthcare professionals with DGDA-certified medical equipment from global brands like Siemens, GE, Roche, Abbott, and Mindray.

### Core Business Model

- **Primary Market**: Bangladesh healthcare sector
- **Customer Segments**:
  - B2B customers (hospitals, clinics) with bulk discounts (8-30%) and credit terms (30-90 days)
  - B2C retail customers (healthcare professionals, small clinics)
- **Product Range**: 10,000+ products across 8 major categories
- **Key Differentiators**: DGDA registration, ISO 13485 certification, free installation in Dhaka, cold chain delivery for reagents

### Target Keywords

- **Primary**: "medical equipment Bangladesh", "diagnostic equipment Dhaka", "reagent supplier BD"
- **Long-tail**: "ECG machine price Bangladesh", "HbA1c kit price BD", "surgical instruments supplier Dhaka"

---

## ✨ Features

### Customer Features
- 🛒 **Product Catalog**: Browse 10,000+ medical products with advanced filtering
- 🔍 **Smart Search**: Real-time search with debouncing and category filtering
- 💳 **Multiple Payment Options**: bKash, Nagad, credit card, bank transfer
- 📦 **Order Tracking**: Real-time order status with SMS/email notifications
- 💝 **Wishlist & Compare**: Save products and compare specifications
- 🔄 **Returns Management**: Easy return request system with status tracking
- 📱 **Mobile Responsive**: Optimized mobile experience with bottom navigation

### B2B Portal Features
- 🏢 **Dedicated Dashboard**: Account management with order history
- 💰 **Bulk Pricing**: Tiered discounts (8-30%) based on order value
- 📄 **Quote Requests**: Submit RFQs for custom orders
- 💳 **Credit Terms**: 30-90 day payment terms for verified accounts
- 📊 **Purchase Analytics**: Track spending and order patterns
- 👤 **Account Manager**: Dedicated support for enterprise clients

### Admin Features
- 📊 **Analytics Dashboard**: Sales, revenue, and user metrics
- 📦 **Inventory Management**: Stock tracking with low-stock alerts
- 👥 **User Management**: Customer and B2B account administration
- 🏷️ **Category Management**: Dynamic category and brand management
- 📧 **Communication Tools**: Email/SMS marketing campaigns
- 🔐 **Role-Based Access**: Admin, manager, and staff roles

### Technical Features
- ⚡ **Performance**: 90+ Lighthouse score, optimized images, lazy loading
- 🔒 **Security**: JWT authentication, rate limiting, XSS protection, CSRF tokens
- 📱 **PWA Ready**: Installable progressive web app
- 🌐 **SEO Optimized**: Dynamic sitemaps, structured data, Open Graph tags
- 📈 **Analytics**: Google Analytics 4, conversion tracking
- 🚨 **Error Tracking**: Sentry integration for error monitoring
- 🔄 **Redis Caching**: API response caching for improved performance
- 📧 **Email Notifications**: Order confirmations, tracking updates

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.2.3](https://nextjs.org/) (App Router)
- **React**: 19.2.4 with Server Components
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with PostCSS
- **Fonts**: Plus Jakarta Sans (body), Lora (headings) via next/font
- **State Management**: React Context API (Auth, Cart, Wishlist, Language, Compare, Theme)
- **Image Optimization**: Next.js Image + [Cloudinary](https://cloudinary.com/)
- **Analytics**: Google Analytics 4 (react-ga4)
- **Error Tracking**: [Sentry](https://sentry.io/) (@sentry/nextjs)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Icons**: react-icons
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js with [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **Cache**: [Redis](https://redis.io/) (ioredis) with in-memory fallback
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

### DevOps & Tools
- **Testing**: Jest + @testing-library/react (frontend), Jest + Supertest (backend)
- **Linting**: ESLint 9 (frontend flat config), ESLint 8 (backend legacy)
- **Git Hooks**: Husky + Commitlint (conventional commits)
- **Performance**: Lighthouse CI (@lhci/cli)
- **Bundle Analysis**: @next/bundle-analyzer
- **API Documentation**: Swagger UI at `/api-docs`

### Deployment
- **Frontend**: [Vercel](https://vercel.com/) (production + preview)
- **Backend**: [Render.com](https://render.com/) (see `render.yaml`)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Cache**: Redis Cloud or Upstash
- **CDN**: Cloudinary for images

---

## 📁 Project Structure

```
Health Care/               # Root (husky + lint-staged only)
├── .github/              # GitHub Actions workflows (CI/CD, security scans)
├── .kiro/                # Kiro AI configuration and specs
├── health-care/          # Main application directory
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/           # Configuration (database, passport, sentry)
│   │   │   ├── controllers/      # Route controllers (20+ controllers)
│   │   │   ├── middleware/       # Express middleware (auth, cache, rate limiting)
│   │   │   ├── models/           # Mongoose models (23 models)
│   │   │   ├── routes/           # Express routes (20+ route files)
│   │   │   ├── services/         # Business logic services
│   │   │   ├── utils/            # Utility functions (logger, email, SMS)
│   │   │   └── server.js         # Express app entry point
│   │   ├── load-tests/           # Artillery load tests
│   │   └── package.json
│   │
│   ├── src/              # Next.js frontend source
│   │   ├── app/                  # Next.js App Router (file-based routing)
│   │   │   ├── layout.jsx        # Root layout (metadata, providers)
│   │   │   ├── page.jsx          # Homepage
│   │   │   ├── sitemap.js        # Dynamic sitemap
│   │   │   ├── robots.js         # Dynamic robots.txt
│   │   │   ├── about/            # Static pages
│   │   │   ├── account/          # User dashboard
│   │   │   ├── admin/            # Admin dashboard
│   │   │   ├── b2b/              # B2B portal
│   │   │   ├── products/         # Product listing + [id] detail
│   │   │   ├── reagent-store/    # Specialized reagent catalog
│   │   │   └── [other routes]/
│   │   ├── components/           # React components (organized by feature)
│   │   ├── config/               # Configuration (SEO)
│   │   ├── constants/            # App constants
│   │   ├── context/              # React Context providers (Auth, Cart, Wishlist)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # External service integrations (GA4)
│   │   ├── utils/                # Utility functions
│   │   └── views/                # Page-level view components
│   │
│   ├── public/           # Static assets
│   ├── next.config.mjs   # Next.js configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── jest.config.js    # Jest testing configuration
│   ├── commitlint.config.js # Commit message linting
│   └── package.json
│
├── check-tasks.js        # Reads .kiro tasks
├── update-info.js        # Interactive script to update company info
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (recommended: v20)
- **npm**: v9+ or yarn
- **MongoDB**: v6+ (local or Atlas)
- **Redis**: v7+ (optional, falls back to in-memory cache)
- **Git**: For version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/health-care.git
   cd "Health Care"
   ```

2. **Install root dependencies** (for Husky)
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd health-care
   npm install
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

5. **Set up environment variables**
   
   **Frontend** (`health-care/.env.local`):
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
   ```
   
   **Backend** (`health-care/backend/.env`):
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/medcore
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here
   REDIS_URL=redis://localhost:6379
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Generate JWT secrets**:
   ```bash
   node ../generate-secrets.js
   ```

6. **Seed the database** (optional)
   ```bash
   cd backend
   npm run seed
   ```

7. **Start development servers**
   
   **Terminal 1** (Backend):
   ```bash
   cd health-care/backend
   npm run dev
   ```
   
   **Terminal 2** (Frontend):
   ```bash
   cd health-care
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - API Documentation: http://localhost:3001/api-docs

---

## 💻 Development

### Frontend Commands

Run from `health-care/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lighthouse` | Run Lighthouse CI audit |
| `ANALYZE=true npm run build` | Analyze bundle size |

### Backend Commands

Run from `health-care/backend/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (port 3001) |
| `npm start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm run diagnose` | MongoDB connection diagnostic |
| `npm run verify-indexes` | Verify MongoDB indexes |
| `npm run fix:categories` | Fix product category data |
| `npm run fix:brands` | Fix product brand data |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm test` | Run Jest tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run load-test` | Run Artillery load tests |

### Code Quality

#### ESLint Configuration
- **Frontend**: ESLint 9 flat config (`eslint.config.mjs`)
- **Backend**: ESLint 8 legacy (`.eslintrc.js`)

#### Commit Conventions
This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new payment gateway
fix: resolve cart calculation bug
docs: update README
style: format code with prettier
refactor: simplify auth logic
test: add unit tests for product service
chore: update dependencies
```

Husky pre-commit hook runs:
- ESLint on staged files
- Commitlint on commit messages

---

## 🧪 Testing

### Frontend Testing

```bash
cd health-care
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

**Coverage Thresholds**:
- Branches: 50%
- Lines: 60%
- Functions: 60%

**Test Setup**:
- Jest with jsdom environment
- @testing-library/react for component tests
- next/jest for Next.js transformations

### Backend Testing

```bash
cd health-care/backend
npm test                    # Run all tests with coverage
npm run test:watch          # Watch mode
```

**Coverage Thresholds**:
- Branches: 60%
- Lines: 60%

**Test Requirements**:
- MongoDB running at `mongodb://localhost:27017/medcore-test`
- Tests run in `NODE_ENV=test` (server won't listen)
- Console output suppressed (see `src/tests/setup.js`)

### Load Testing

```bash
cd health-care/backend
npm run load-test           # Artillery load tests
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. **Connect repository to Vercel**
   ```bash
   vercel
   ```

2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - `NEXT_PUBLIC_BING_SITE_VERIFICATION`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Backend (Render.com)

1. **Create new Web Service** on Render

2. **Configure** using `render.yaml`:
   - Build Command: `cd health-care/backend && npm install`
   - Start Command: `cd health-care/backend && npm start`

3. **Set environment variables**:
   - `NODE_ENV=production`
   - `MONGODB_URI` (MongoDB Atlas connection string)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `REDIS_URL`
   - `CLOUDINARY_*` variables
   - `FRONTEND_URL`

4. **Deploy** from GitHub

### Database (MongoDB Atlas)

1. **Create cluster** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Whitelist IP addresses** (0.0.0.0/0 for development)
3. **Create database user** with read/write permissions
4. **Get connection string** and set as `MONGODB_URI`

### Cache (Redis Cloud)

1. **Create database** at [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. **Get connection URL** and set as `REDIS_URL`

---

## 🔐 Environment Variables

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001/api` |
| `NEXT_PUBLIC_SITE_URL` | Frontend URL | `https://medcorebd.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary preset | `your_preset` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console | `xxx` |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster | `xxx` |

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/medcore` |
| `JWT_SECRET` | JWT signing secret | Generate with `generate-secrets.js` |
| `JWT_REFRESH_SECRET` | Refresh token secret | Generate with `generate-secrets.js` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | `your_secret` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `your_email@gmail.com` |
| `EMAIL_PASS` | SMTP password | `your_password` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | For Google OAuth |

---

## 📚 API Documentation

### Accessing Swagger UI

Start the backend server and visit:
```
http://localhost:3001/api-docs
```

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/google` - Google OAuth login

#### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (admin)

#### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item
- `DELETE /api/cart/items/:productId` - Remove from cart

#### B2B
- `POST /api/b2b/quotes` - Submit quote request
- `GET /api/b2b/quotes` - List quotes
- `GET /api/b2b/pricing/:productId` - Get bulk pricing

---

## ⚡ SEO & Performance

### SEO Implementation

- ✅ **Centralized SEO Config** (`src/config/seo.js`)
- ✅ **Dynamic Metadata** (generateMetadata in pages)
- ✅ **Structured Data** (Organization, LocalBusiness, Product schemas)
- ✅ **Dynamic Sitemap** (`src/app/sitemap.js`)
- ✅ **Dynamic Robots.txt** (`src/app/robots.js`)
- ✅ **Open Graph Tags** (social sharing)
- ✅ **Image Optimization** (Next.js Image + Cloudinary)
- ✅ **Google Analytics 4** (react-ga4)

### Performance Targets

- **Lighthouse Score**: >90 (desktop), >80 (mobile)
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)
- **TTI**: <3.8s (Time to Interactive)

### Performance Optimizations

- Server Components by default
- Next.js Image component with AVIF/WebP
- Font preloading (Plus Jakarta Sans, Lora)
- Redis caching for API responses
- Code splitting via App Router
- SWC minification
- Compression middleware
- Console.log removal in production

### Run Performance Audits

```bash
cd health-care
npm run lighthouse       # Lighthouse CI audit
ANALYZE=true npm run build  # Bundle analysis
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feat/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   # Frontend
   cd health-care
   npm run lint
   npm test
   
   # Backend
   cd backend
   npm run lint
   npm test
   ```
5. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feat/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Follow ESLint rules (auto-fix with `npm run lint:fix`)
- Use path aliases (`@/` for frontend imports)
- Write descriptive commit messages (Conventional Commits)
- Add tests for new features
- Update documentation

### Pull Request Guidelines

- Describe what changes you made and why
- Reference related issues
- Ensure all tests pass
- Keep PRs focused and atomic
- Update README if needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Development**: MedCore BD Development Team
- **Contact**: info@medcorebd.com
- **Phone**: +8801800000000
- **Address**: Nawabpur Road, Dhaka, Bangladesh

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vercel](https://vercel.com/) - Frontend hosting
- [Render](https://render.com/) - Backend hosting
- [Cloudinary](https://cloudinary.com/) - Image CDN

---

## 📞 Support

For support, email info@medcorebd.com or call +8801800000000.

---

<div align="center">

**[⬆ back to top](#medcore-bd--medical-equipment-e-commerce-platform)**

Made with ❤️ by MedCore BD Team

</div>
