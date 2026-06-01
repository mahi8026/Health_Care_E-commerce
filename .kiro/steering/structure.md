# Project Structure

## Repository Layout

```
Health Care/
├── .github/              # GitHub Actions workflows (CI/CD, security scans)
├── .kiro/                # Kiro AI configuration
│   ├── specs/            # Feature specifications
│   └── steering/         # AI guidance documents (this file)
├── health-care/          # Main application directory
│   ├── backend/          # Express.js API server
│   ├── src/              # Next.js frontend source
│   ├── public/           # Static assets
│   └── [config files]    # next.config.mjs, tailwind.config.js, etc.
└── [root config files]   # Git, deployment configs
```

## Frontend Structure (`health-care/src/`)

### App Router (`src/app/`)

Next.js 16 App Router with file-based routing:

```
app/
├── layout.jsx            # Root layout (metadata, providers, schemas)
├── page.jsx              # Homepage (/)
├── globals.css           # Global styles
├── robots.js             # Dynamic robots.txt
├── sitemap.js            # Dynamic sitemap.xml
├── about/                # /about
├── account/              # /account (user dashboard)
├── admin/                # /admin (admin dashboard, protected)
├── auth/                 # /auth (OAuth callbacks)
├── b2b/                  # /b2b (B2B portal)
├── cart/                 # /cart
├── checkout/             # /checkout
├── login/                # /login
├── register/             # /register
├── forgot-password/      # /forgot-password
├── reset-password/       # /reset-password
├── orders/               # /orders (order history)
├── products/             # /products (listing + [id] detail)
├── reagent-store/        # /reagent-store (specialized reagent catalog)
├── returns/              # /returns (return requests)
├── search/               # /search
├── track/                # /track (order tracking)
└── wishlist/             # /wishlist
```

**Routing Conventions:**
- Each folder = route segment
- `page.jsx` = route UI
- `layout.jsx` = shared layout
- `[id]/page.jsx` = dynamic route
- Export `metadata` or `generateMetadata()` for SEO

### Components (`src/components/`)

Organized by feature/domain:

```
components/
├── admin/                # Admin dashboard components
├── auth/                 # Login, register, OAuth components
├── b2b/                  # B2B-specific components
├── checkout/             # Checkout flow components
├── layout/               # Header, Footer, TopBar, BottomNav
├── mobile/               # Mobile-specific components
├── payment/              # Payment integration components
├── product/              # Product cards, filters, gallery
├── reagent/              # Reagent store components
├── search/               # Search UI components
├── seo/                  # SEO components (schemas, metadata)
├── ui/                   # Reusable UI primitives (buttons, modals, etc.)
├── wishlist/             # Wishlist components
├── ProductCard.jsx       # Shared product card
└── PhoneVerification.jsx # Phone verification modal
```

**Component Conventions:**
- Use `.jsx` extension for React components
- PascalCase for component files
- Co-locate tests in `__tests__/` subdirectories
- Keep components focused and composable

### Configuration (`src/config/`)

```
config/
└── seo.js                # SEO configuration (SITE_CONFIG, PAGE_SEO, CATEGORY_SEO)
```

### Constants (`src/constants/`)

```
constants/
├── api.js                # API endpoints
├── colors.js             # Color palette
├── config.js             # App configuration
├── images.js             # Image paths
└── index.js              # Barrel export
```

### Context (`src/context/`)

React Context providers for global state:

```
context/
├── AuthContext.jsx       # Authentication state
├── CartContext.jsx       # Shopping cart state
└── WishlistContext.jsx   # Wishlist state
```

### Hooks (`src/hooks/`)

Custom React hooks:

```
hooks/
├── useApi.js             # API call wrapper
├── useDebounce.js        # Debounce hook
├── useLocalStorage.js    # LocalStorage hook
├── useOrders.js          # Order management
└── useProducts.js        # Product fetching
```

### Services (`src/services/`)

External service integrations:

```
services/
└── GA4Tracker.js         # Google Analytics 4 tracking
```

### Utils (`src/utils/`)

Utility functions:

```
utils/
├── api.js                # API client
├── exportService.js      # Data export utilities
├── helpers.js            # General helpers
├── invoiceGenerator.js   # Invoice PDF generation
├── metadata.js           # Metadata generation helpers
├── payment.js            # Payment utilities
├── structuredData.js     # JSON-LD schema generators
├── validation.js         # Form validation
└── validators.js         # Input validators
```

### Views (`src/views/`)

Page-level view components (imported by `app/*/page.jsx`):

```
views/
├── HomePage.jsx
├── ProductsPage.jsx
├── ProductDetailPage.jsx
├── ReagentStorePage.jsx
├── SearchPage.jsx
├── CartPage.jsx
├── CheckoutPage.jsx
├── LoginPage.jsx
├── RegisterPage.jsx
├── AccountPage.jsx
├── OrderHistoryPage.jsx
├── OrderTrackingPage.jsx
├── B2BDashboardPage.jsx
├── AdminDashboardPage.jsx
└── [other pages]
```

**View Conventions:**
- Views are "smart" components that fetch data and manage state
- App Router pages are thin wrappers that import views
- Views handle client-side interactivity (`'use client'` directive)

## Backend Structure (`health-care/backend/src/`)

```
backend/src/
├── config/               # Configuration
│   ├── constants.js      # App constants
│   ├── database.js       # MongoDB connection
│   ├── passport.js       # Passport.js strategies
│   └── sentry.js         # Sentry error tracking
├── constants/            # Shared constants
├── controllers/          # Route controllers (business logic)
│   ├── authController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── cartController.js
│   ├── [20+ controllers]
│   └── __tests__/        # Controller tests
├── middleware/           # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── cache.js          # Redis caching
│   ├── rateLimiter.js    # Rate limiting
│   ├── validation.js     # Request validation
│   ├── errorHandler.js   # Error handling
│   └── __tests__/        # Middleware tests
├── models/               # Mongoose models
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Category.js
│   ├── [15+ models]
│   └── __tests__/        # Model tests
├── routes/               # Express routes
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── [20+ route files]
│   └── __tests__/        # Route tests
├── services/             # Business logic services
│   ├── redisCache.js     # Redis cache service
│   ├── dataSync.js       # Data synchronization
│   └── __tests__/        # Service tests
├── utils/                # Utility functions
│   ├── logger.js         # Winston logger
│   ├── emailService.js   # Email sending
│   ├── smsService.js     # SMS sending
│   └── [other utils]
└── server.js             # Express app entry point
```

**Backend Conventions:**
- Controllers handle request/response logic
- Services contain reusable business logic
- Models define data schemas and methods
- Middleware handles cross-cutting concerns
- Routes define API endpoints and apply middleware

## Key Architectural Patterns

### Frontend Patterns

1. **Server Components by Default**: Use React Server Components unless client interactivity needed
2. **Client Components**: Add `'use client'` directive for interactive components
3. **Data Fetching**: Use `fetch()` with Next.js cache in Server Components
4. **Metadata**: Export `metadata` object or `generateMetadata()` function per page
5. **Context Providers**: Wrap app in providers at root layout level
6. **Path Aliases**: Always use `@/` imports, never relative paths

### Backend Patterns

1. **Route → Controller → Service → Model**: Clear separation of concerns
2. **Middleware Chain**: Rate limiting → Auth → Validation → Controller
3. **Error Handling**: Centralized error handler catches all errors
4. **Caching Strategy**: Redis cache with in-memory fallback
5. **Database Health**: `dbHealthCheck` middleware on all DB-dependent routes
6. **Logging**: Winston for structured logging, Morgan for HTTP logs

### SEO Patterns

1. **Centralized Config**: All SEO data in `src/config/seo.js`
2. **Dynamic Metadata**: Generate metadata from API data in `generateMetadata()`
3. **Structured Data**: JSON-LD schemas in `<script>` tags
4. **Image Optimization**: Always use Next.js `<Image>` component
5. **Canonical URLs**: Set canonical for all pages to prevent duplicates
6. **Sitemap Generation**: Dynamic sitemap from database products

## File Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.jsx`)
- **Utilities**: camelCase (e.g., `helpers.js`)
- **Routes**: camelCase with "Routes" suffix (e.g., `productRoutes.js`)
- **Controllers**: camelCase with "Controller" suffix (e.g., `productController.js`)
- **Models**: PascalCase singular (e.g., `Product.js`)
- **Hooks**: camelCase with "use" prefix (e.g., `useProducts.js`)
- **Context**: PascalCase with "Context" suffix (e.g., `AuthContext.jsx`)
- **Tests**: Same name with `.test.js` or in `__tests__/` directory

## Import Order Convention

```javascript
// 1. External dependencies
import React from 'react';
import { useState } from 'react';
import Image from 'next/image';

// 2. Internal modules (using @/ alias)
import { SITE_CONFIG } from '@/config/seo';
import ProductCard from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/utils/helpers';

// 3. Relative imports (avoid when possible)
import './styles.css';
```

## Testing Structure

- **Unit Tests**: Co-located in `__tests__/` directories
- **Integration Tests**: In route/controller `__tests__/` directories
- **Test Files**: `*.test.js` or `*.test.jsx`
- **Coverage**: Run `npm run test:coverage` to generate reports

## Environment-Specific Behavior

- **Development**: API proxied through Next.js, verbose logging, no minification
- **Production**: Direct API calls, minimal logging, optimized builds, Sentry enabled
- **Test**: Mocked services, in-memory database, no external calls
