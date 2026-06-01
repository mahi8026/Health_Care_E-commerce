# SEO Strategy & Implementation Guide

## Goal

Rank on Google Bangladesh for medical equipment searches targeting keywords like:
- Primary: "medical equipment Bangladesh", "diagnostic equipment Dhaka", "reagent supplier BD"
- Long-tail: "ECG machine price Bangladesh", "HbA1c kit price BD", "surgical instruments supplier Dhaka"

## Current Implementation Status

### ✅ Already Implemented

1. **Centralized SEO Config** (`src/config/seo.js`)
   - SITE_CONFIG with organization details
   - PAGE_SEO for page-specific metadata
   - CATEGORY_SEO for category pages
   - CATEGORY_CONTENT for long-form SEO text

2. **Root Layout Metadata** (`src/app/layout.jsx`)
   - Complete metadata configuration
   - Open Graph tags
   - Twitter Card tags
   - Robots configuration
   - Verification tags (Google, Bing)
   - Canonical URLs and hreflang
   - Google Analytics 4 integration

3. **Structured Data Schemas**
   - OrganizationSchema (in layout)
   - WebsiteSchema with SearchAction (in layout)
   - LocalBusinessSchema (in layout)
   - StructuredData utility (`src/utils/structuredData.js`)

4. **Image Optimization**
   - Next.js Image component configured
   - Cloudinary remote patterns in next.config.mjs
   - AVIF and WebP formats enabled
   - Font preloading (Plus Jakarta Sans, Lora)

5. **Performance Optimizations**
   - Preconnect to critical origins (fonts, Cloudinary)
   - SWC minification enabled
   - Console.log removal in production
   - Compression middleware on backend

6. **Dynamic Routes**
   - `src/app/sitemap.js` exists
   - `src/app/robots.js` exists

### ⚠️ Needs Review/Enhancement

1. **Page-Specific Metadata**
   - Verify all pages export metadata or generateMetadata()
   - Check product detail pages use dynamic metadata from API
   - Ensure category pages use CATEGORY_SEO config

2. **Additional Schema Components**
   - ProductSchema component (for product detail pages)
   - BreadcrumbSchema component (for navigation)
   - FAQSchema component (for product pages)

3. **Image Alt Text**
   - Audit all images for descriptive alt text
   - Ensure ProductCard uses SEO-friendly alt text
   - Check category cards have proper alt attributes

4. **URL Structure**
   - Verify products use slugs instead of MongoDB IDs
   - Check if slug generation exists in backend
   - Add redirects for old ID-based URLs if needed

5. **Content SEO**
   - Add category content blocks to products page
   - Add product SEO sections (price, where to buy)
   - Implement related products sections

6. **Heading Hierarchy**
   - Audit pages for single H1 per page
   - Verify proper H2/H3 nesting

## Implementation Checklist

### Week 1: Foundation (Highest Impact)

- [x] ~~Create src/config/seo.js~~ (Already exists)
- [x] ~~Update root layout.jsx metadata~~ (Already configured)
- [ ] Add dynamic generateMetadata to product detail pages
- [ ] Audit and fix all image alt text across components
- [ ] Verify sitemap.js includes all products with proper fields
- [ ] Verify robots.js disallows admin/account/checkout routes

### Week 2: Structured Data

- [ ] Create ProductSchema component (`src/components/seo/ProductSchema.jsx`)
- [x] ~~Add OrganizationSchema to layout~~ (Already in layout)
- [ ] Create FAQSchema component (`src/components/seo/FAQSchema.jsx`)
- [ ] Create BreadcrumbSchema component (`src/components/seo/BreadcrumbSchema.jsx`)
- [x] ~~Add LocalBusinessSchema to layout~~ (Already in layout)

### Week 3: Performance & Content

- [ ] Replace remaining `<img>` tags with Next.js `<Image>` component
- [ ] Add CATEGORY_CONTENT blocks to products page
- [ ] Add product SEO content sections (price, where to buy)
- [ ] Verify next.config.mjs image optimization settings

### Week 4: Search Console & Analytics

- [ ] Submit site to Google Search Console
- [ ] Submit sitemap.xml to Google and Bing
- [x] ~~Set up Google Analytics 4~~ (Already integrated)
- [ ] Create Google Business Profile
- [ ] Start tracking target keywords

## SEO Best Practices for This Project

### Metadata Export Pattern

Every page should export metadata:

```javascript
// Static metadata
export const metadata = {
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  alternates: { canonical: `${SITE_CONFIG.url}/` },
};

// OR dynamic metadata
export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.id);
  return {
    title: `${product.name} — Price in Bangladesh | MedCore BD`,
    description: `Buy ${product.name} in Bangladesh...`,
    alternates: { canonical: `${SITE_CONFIG.url}/products/${product.slug}` },
  };
}
```

### Image Alt Text Pattern

Always provide descriptive, keyword-rich alt text:

```javascript
// Product cards
alt={`${product.name} — ${product.brand} — Price ৳${product.price?.toLocaleString()} Bangladesh`}

// Category cards
alt={`${category.name} supplier Bangladesh — MedCore BD`}

// Product gallery
alt={`${product.name} ${index === 0 ? 'front view' : `view ${index + 1}`} — MedCore BD`}
```

### Heading Hierarchy Pattern

- **One H1 per page**: Main page title only
- **H2 for major sections**: "Shop by Category", "Featured Products", "Technical Specifications"
- **H3 for subsections**: Product names in grids, card titles

### Internal Linking Strategy

1. **Breadcrumbs**: Home → Category → Product
2. **Category links**: Link to filtered product pages
3. **Brand links**: "View all {brand} products"
4. **Related products**: Same category products at bottom
5. **Cross-category**: Link between related categories

### URL Structure

- **Use slugs**: `/products/siemens-ecg-12-lead-cardiostat-pro`
- **Not IDs**: ~~`/products/68a2f49b3c12085714c729f1`~~
- **Clean URLs**: No query params in canonical
- **Consistent**: Always use slug in links

### Caching Strategy

```javascript
// Product pages: 1 hour revalidation
fetch(url, { next: { revalidate: 3600 } })

// Homepage featured: 5 minutes
fetch(url, { next: { revalidate: 300 } })

// Categories: 24 hours
fetch(url, { next: { revalidate: 86400 } })
```

### Schema.org Structured Data

Required schemas per page type:

- **All pages**: Organization, Website, LocalBusiness (in layout)
- **Product pages**: Product, FAQ, Breadcrumb
- **Category pages**: Breadcrumb, CollectionPage (optional)
- **Homepage**: Organization, Website, LocalBusiness

## Target Keywords by Page

### Homepage
- medical equipment Bangladesh
- buy medical equipment online BD
- DGDA certified medical equipment

### Products Page
- medical supplies Bangladesh
- buy surgical instruments online
- lab equipment price BD

### Reagent Store
- laboratory reagents Bangladesh
- HbA1c kit price BD
- CBC reagent supplier Dhaka

### B2B Page
- B2B medical supplier Bangladesh
- hospital equipment supplier Dhaka
- bulk medical supplies BD

### Product Detail Pages
- {product name} price Bangladesh
- buy {product name} online BD
- {product name} {brand} Bangladesh

### Category Pages
- {category} Bangladesh
- {category} supplier Dhaka
- buy {category} online BD

## Performance Targets

- **Lighthouse Score**: >90 (desktop), >80 (mobile)
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)
- **TTI**: <3.8s (Time to Interactive)

## Ranking Targets (4-8 weeks)

- "medical equipment Bangladesh" → Top 20
- "diagnostic equipment Dhaka" → Top 10
- "reagent supplier Bangladesh" → Top 5
- "ECG machine price Bangladesh" → Top 10
- "HbA1c kit Bangladesh" → Top 5
- "[specific product] Bangladesh" → Top 3

## Tools for Verification

- **Rich Results Test**: search.google.com/test/rich-results
- **Schema Validator**: validator.schema.org
- **PageSpeed Insights**: pagespeed.web.dev
- **Google Search Console**: search.google.com/search-console
- **Lighthouse CI**: Run `npm run lighthouse` in frontend

## Common SEO Mistakes to Avoid

❌ Empty alt attributes on images
❌ Multiple H1 tags on same page
❌ Using MongoDB IDs in URLs instead of slugs
❌ Missing canonical URLs on paginated/filtered pages
❌ Duplicate meta descriptions across pages
❌ Missing structured data on product pages
❌ Not using Next.js Image component
❌ Blocking important pages in robots.txt
❌ Missing Open Graph images
❌ Not setting up Google Search Console

## Environment Variables Required

```bash
# Frontend .env.local
NEXT_PUBLIC_SITE_URL=https://medcorebd.com
NEXT_PUBLIC_API_URL=https://api.medcorebd.com/api
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxx
NEXT_PUBLIC_BING_SITE_VERIFICATION=xxx
```

## Quick Commands

```bash
# Build and check for errors
cd health-care && npm run build

# Run Lighthouse audit
npm run lighthouse

# Analyze bundle size
npm run analyze

# Test sitemap locally
curl http://localhost:3000/sitemap.xml

# Test robots.txt locally
curl http://localhost:3000/robots.txt
```
