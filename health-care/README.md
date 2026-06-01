# MedCore BD — Frontend

Next.js 16 storefront for the MedCore BD medical equipment e-commerce platform serving the Bangladesh healthcare sector.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Fonts**: Plus Jakarta Sans + Lora (via `next/font`)
- **State**: React Context (Auth, Cart, Wishlist)
- **Forms**: Controlled components with `validation.js`
- **Analytics**: Google Analytics 4 + Web Vitals
- **SEO**: Dynamic `generateMetadata`, Schema.org structured data, `sitemap.js`, `robots.js`
- **Images**: `next/image` with AVIF/WebP, Cloudinary CDN

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Analyze bundle size
ANALYZE=true npm run build
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL (e.g. `https://api.medcorebd.com/api`) |
| `NEXT_PUBLIC_GA_ID` | ⚠️ | Google Analytics 4 Measurement ID |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ⚠️ | Cloudinary cloud for image transforms |

✅ Required  ⚠️ Recommended

## Architecture

```
src/
├── app/                 # Next.js App Router pages & layouts
│   ├── layout.jsx       # Root layout (fonts, metadata, analytics)
│   ├── page.jsx         # Home page
│   ├── products/        # Product listing & detail pages
│   ├── admin/           # Admin dashboard (protected)
│   └── ...
├── components/
│   ├── ui/              # Reusable UI (Modal, ProductCardSkeleton, …)
│   ├── product/         # Product-specific components
│   ├── checkout/        # Checkout flow
│   └── admin/           # Admin management tables
├── config/
│   └── seo.js           # SITE_CONFIG, CATEGORY_SEO, PAGE_SEO
├── constants/           # API endpoints, category maps
├── context/             # Auth, Cart, Wishlist providers
├── hooks/               # Custom React hooks
├── utils/               # API client, helpers, validation, webVitals
└── views/               # Full-page view components
```

## Key Features

- **SSR / SSG** — Product detail and category pages use `generateStaticParams` for build-time generation
- **Redis-backed API** — Product and category listings are cached; avg TTFB < 100 ms
- **Core Web Vitals** — LCP target < 2.5 s; CLS < 0.1 via `ProductCardSkeleton` placeholders
- **Accessibility** — Skip-to-content link, `focus-visible` outlines, ARIA dialog roles, focus trap in modals
- **SEO** — Per-page `generateMetadata`, Product/Breadcrumb/FAQ JSON-LD, canonical URLs, OG/Twitter cards
- **Bundle size** — `optimizePackageImports` for react-icons, recharts, date-fns; console stripped in production

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm test -- --coverage` | Tests + coverage report |
| `npm run lighthouse` | Run Lighthouse CI performance audit |
| `npm run analyze` | Analyze bundle size with webpack-bundle-analyzer |

## Performance Testing

### Lighthouse CI

Automated performance audits run on every pull request via GitHub Actions. The configuration enforces:

**Performance Budgets:**
- Desktop: Performance score ≥85%
- Mobile: Performance score ≥80%

**Core Web Vitals Thresholds:**
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- TTI (Time to Interactive): <3.8s

**Run locally:**
```bash
# Build and start the production server
npm run build
npm start

# In another terminal, run Lighthouse CI
npm run lighthouse
```

Results are uploaded to temporary public storage and available in the GitHub Actions artifacts.

Configuration: `lighthouserc.js`

## Deployment

The frontend is deployed on **Vercel**. Environment variables are configured in the Vercel dashboard.

```bash
# Vercel CLI deploy
vercel --prod
```
