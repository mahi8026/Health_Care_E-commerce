# Technical Design Document: Product Detail SEO Enhancement

## Overview

This design enhances SEO metadata and structured data on product detail pages for MedCore BD to improve search engine visibility for Bangladesh-specific medical equipment searches. The enhancement implements dynamic metadata generation from product API data, comprehensive Product schema with rich snippet support, optimized image alt text, BreadcrumbList structured data, FAQ schema, and canonical URL slug-based routing.

### Goals

- Achieve rich search results in Google Bangladesh showing price, availability, ratings, and breadcrumb navigation
- Target keywords: "{product name} price Bangladesh", "buy {product name} online BD", "{brand} {product name} Bangladesh"
- Improve organic search rankings for medical equipment searches in Bangladesh
- Ensure all product pages have unique, keyword-rich metadata
- Implement proper URL structure using SEO-friendly slugs instead of MongoDB IDs

### Current State Analysis

**Already Implemented:**
- Basic `generateMetadata()` function in `/products/[id]/page.jsx`
- Product schema generation in `src/utils/structuredData.js`
- Breadcrumb schema generation
- FAQ schema component (`src/components/seo/FAQSchema.jsx`)
- SEO content blocks in ProductDetailPage
- Centralized SEO configuration in `src/config/seo.js`

**Needs Enhancement:**
- Image alt text is not SEO-optimized (missing product name, brand, price, location keywords)
- Slug-based routing exists but redirect logic needs verification
- Metadata validation and error handling needs strengthening
- Performance optimization with proper cache configuration
- Enhanced Product schema with certifications and seller information

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                        │
│                  /products/[id]/page.jsx                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├─► generateMetadata() ──► API Fetch ──► Product Data
             │                              │
             │                              ├─► Title Generation
             │                              ├─► Description Generation
             │                              ├─► Keywords Generation
             │                              ├─► Canonical URL (slug)
             │                              ├─► Open Graph Tags
             │                              └─► Twitter Card Tags
             │
             ├─► Page Component ──► Structured Data Generation
             │                         │
             │                         ├─► ProductSchema
             │                         ├─► BreadcrumbSchema
             │                         └─► FAQSchema
             │
             └─► ProductDetailPage (Client Component)
                      │
                      ├─► ProductImageGallery ──► SEO Alt Text
                      ├─► ProductInfoPanel
                      ├─► ProductReviews
                      └─► SEO Content Block
```

### Data Flow

1. **Request Phase**: User/crawler requests `/products/[id]` or `/products/[slug]`
2. **Metadata Generation Phase**: 
   - `generateMetadata()` fetches product data from API
   - Generates title, description, keywords, canonical URL
   - Creates Open Graph and Twitter Card metadata
3. **Rendering Phase**:
   - Server component generates JSON-LD schemas (Product, Breadcrumb, FAQ)
   - Client component renders product UI with SEO-optimized alt text
   - SEO content blocks rendered below reviews
4. **Redirect Phase** (if needed):
   - If accessed via MongoDB ID and slug exists, redirect to slug URL

### Technology Stack

- **Framework**: Next.js 16.2.3 App Router with React Server Components
- **Data Fetching**: Native `fetch()` with Next.js cache (`revalidate: 3600`)
- **Structured Data**: JSON-LD schemas following schema.org specifications
- **Image Optimization**: Next.js Image component with Cloudinary
- **Routing**: Dynamic routes with slug/ID parameter support

## Components and Interfaces

### 1. Metadata Generator (`generateMetadata()`)

**Location**: `src/app/products/[id]/page.jsx`

**Interface**:
```typescript
async function generateMetadata({ params }): Promise<Metadata>
```

**Inputs**:
- `params.id`: Product slug or MongoDB ID

**Outputs**:
- `Metadata` object with title, description, keywords, alternates, openGraph, twitter

**Responsibilities**:
- Fetch product data from API with caching
- Generate SEO-optimized title in format: "{Product_Name} — Price in Bangladesh | MedCore BD"
- Generate description with product name, brand, category, price, "Buy online in Bangladesh"
- Extract keywords from product name, brand, category, SKU
- Set canonical URL using slug (fallback to ID)
- Handle missing/malformed data gracefully
- Return "Product Not Found" metadata with noindex for missing products

### 2. Product Schema Generator

**Location**: `src/utils/structuredData.js`

**Interface**:
```typescript
function generateProductSchema(product: Product): Object
```

**Inputs**:
- `product`: Product object from API

**Outputs**:
- JSON-LD Product schema object

**Responsibilities**:
- Generate Product schema with name, description, brand, SKU, category
- Include Offers object with price (BDT), availability, priceValidUntil
- Include all product images as array
- Include AggregateRating when ratings exist
- Include additionalProperty for certifications (DGDA, CE, ISO)
- Set itemCondition to "NewCondition"
- Include seller Organization information

### 3. Breadcrumb Schema Generator

**Location**: `src/utils/structuredData.js`

**Interface**:
```typescript
function generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>): Object
```

**Inputs**:
- `breadcrumbs`: Array of breadcrumb items

**Outputs**:
- JSON-LD BreadcrumbList schema object

**Responsibilities**:
- Generate BreadcrumbList with Home → Category → Product
- Use slug in product URL when available
- Handle missing category data (fallback to "Products")

### 4. FAQ Schema Component

**Location**: `src/components/seo/FAQSchema.jsx`

**Interface**:
```typescript
function FAQSchema({ product: Product }): JSX.Element
```

**Inputs**:
- `product`: Product object

**Outputs**:
- `<script type="application/ld+json">` element

**Responsibilities**:
- Generate FAQPage schema with product-specific questions
- Include price question with BDT amount
- Include DGDA registration question
- Include warranty question
- Include "where to buy" question
- Use product-specific warranty data when available

### 5. Product Image Gallery (Enhanced)

**Location**: `src/components/product/ProductImageGallery.jsx`

**Interface**:
```typescript
function ProductImageGallery({ 
  images: Array<Image>, 
  product: Product, 
  badges: Array<string>,
  heroPriority: boolean 
}): JSX.Element
```

**Inputs**:
- `images`: Array of product images
- `product`: Product object
- `badges`: Certification badges
- `heroPriority`: Whether to prioritize loading

**Outputs**:
- React component with SEO-optimized image alt text

**Responsibilities**:
- Generate alt text for primary image: "{Product_Name} — {Brand} — Price ৳{Price} Bangladesh"
- Generate alt text for secondary images: "{Product_Name} view {Index} — MedCore BD"
- Handle missing brand (omit brand segment)
- Handle missing/zero price (use "Contact for Price")
- Ensure all alt text under 125 characters

### 6. SEO Content Block

**Location**: `src/views/ProductDetailPage.jsx`

**Interface**:
Rendered as part of ProductDetailPage component

**Responsibilities**:
- Render H2 heading: "About {Product_Name}"
- Render H3 heading: "{Product_Name} Price in Bangladesh"
- Include text with price in BDT and B2B discount mention
- Render H3 heading: "Buy {Product_Name} in Bangladesh"
- Include text with MedCore BD as authorized distributor, DGDA registration, delivery coverage
- Mention brand name when available

## Data Models

### Product Data Model (API Response)

```typescript
interface Product {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  brand?: string | { _id: string; name: string };
  category?: string | { _id: string; name: string };
  sku?: string;
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
    publicId?: string;
  }>;
  rating?: number | { average: number; count: number };
  reviewCount?: number;
  certifications?: Array<string>;
  inStock?: boolean;
  compatibleWith?: Array<string>;
  specifications?: Record<string, string>;
  variants?: {
    connectivity?: Array<string>;
    warranty?: Array<string>;
  };
}
```

### Metadata Object Model

```typescript
interface Metadata {
  title: string;
  description: string;
  keywords?: string;
  alternates: {
    canonical: string;
  };
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: Array<string>;
  };
  robots?: {
    index: boolean;
  };
}
```

### Product Schema Model (JSON-LD)

```typescript
interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image?: string | Array<string>;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  sku?: string;
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: number;
    bestRating: string;
    worstRating: string;
  };
  offers: {
    '@type': 'Offer';
    url: string;
    priceCurrency: string;
    price: string;
    availability: string;
    itemCondition: string;
    priceValidUntil: string;
    seller: {
      '@type': 'Organization';
      name: string;
      url: string;
    };
  };
  url: string;
  additionalProperty?: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string;
  }>;
}
```

## Error Handling

### Metadata Generation Error Handling

**Missing Product Data**:
- **Scenario**: Product not found or API returns error
- **Handling**: Return metadata with title "Product Not Found | MedCore BD" and `robots: { index: false }`
- **User Impact**: Page renders with error message, not indexed by search engines

**Missing Product Name**:
- **Scenario**: Product object exists but name field is missing
- **Handling**: Use "Product" as fallback in title and description
- **User Impact**: Generic metadata, page still indexed

**Missing Description**:
- **Scenario**: Product description field is empty or undefined
- **Handling**: Generate description from available fields (name, brand, category, price)
- **User Impact**: Shorter but valid description

**Missing Images**:
- **Scenario**: Product has no images array or empty array
- **Handling**: Use default OG image from `SITE_CONFIG.ogImage` ("/og-default.png")
- **User Impact**: Default image shown in social shares

**Populated Brand/Category Objects**:
- **Scenario**: Brand or category is populated object instead of string
- **Handling**: Extract `.name` property from object
- **User Impact**: Correct brand/category name in metadata

**Missing or Zero Price**:
- **Scenario**: Price is null, undefined, or 0
- **Handling**: Display "Contact for Price" in metadata and alt text
- **User Impact**: Clear indication that pricing requires inquiry

**Missing Slug**:
- **Scenario**: Product has no slug field
- **Handling**: Use MongoDB ID in canonical URL as fallback
- **User Impact**: Less SEO-friendly URL but page still accessible

### Image Alt Text Error Handling

**Missing Brand**:
- **Scenario**: Brand field is empty or undefined
- **Handling**: Omit brand segment from alt text
- **Format**: "{Product_Name} — Price ৳{Price} Bangladesh"

**Missing Price**:
- **Scenario**: Price is 0, null, or undefined
- **Handling**: Replace price segment with "Contact for Price"
- **Format**: "{Product_Name} — {Brand} — Contact for Price Bangladesh"

**Alt Text Too Long**:
- **Scenario**: Generated alt text exceeds 125 characters
- **Handling**: Truncate description while preserving key elements (name, brand, location)
- **User Impact**: Optimized for SEO character limits

### Structured Data Error Handling

**Invalid Schema**:
- **Scenario**: Required fields missing from schema object
- **Handling**: Log error in development mode, return null to prevent rendering
- **User Impact**: Page renders without that specific schema (graceful degradation)

**Missing Product for FAQ**:
- **Scenario**: FAQSchema component receives null product
- **Handling**: Return null, no FAQ schema rendered
- **User Impact**: Page renders without FAQ rich snippet eligibility

## Testing Strategy

This feature is **NOT suitable for property-based testing** because:
1. **Infrastructure/Configuration**: SEO metadata generation is primarily configuration and data transformation
2. **UI Rendering**: Image alt text and content blocks are UI rendering concerns
3. **External Dependencies**: Relies on API responses and Next.js framework behavior
4. **Deterministic Behavior**: Metadata generation doesn't vary meaningfully with randomized inputs

### Unit Testing Approach

**Test Coverage Areas**:
1. **Metadata Generation**:
   - Test title format with valid product data
   - Test description generation with all fields present
   - Test description generation with missing fields
   - Test keyword extraction from product data
   - Test canonical URL generation with slug
   - Test canonical URL fallback to ID
   - Test "Product Not Found" metadata for missing products
   - Test Open Graph image fallback to default

2. **Image Alt Text Generation**:
   - Test primary image alt text with all fields
   - Test alt text with missing brand
   - Test alt text with missing/zero price
   - Test secondary image alt text format
   - Test alt text character limit enforcement

3. **Structured Data Generation**:
   - Test Product schema with complete data
   - Test Product schema with missing optional fields
   - Test AggregateRating inclusion when ratings exist
   - Test certification additionalProperty generation
   - Test Breadcrumb schema with category
   - Test Breadcrumb schema without category (fallback)
   - Test FAQ schema question generation
   - Test FAQ schema with category-specific questions

4. **Error Handling**:
   - Test graceful handling of null product
   - Test handling of populated brand/category objects
   - Test handling of missing images array
   - Test sanitization of description text

**Test Framework**: Jest with @testing-library/react

**Example Unit Test**:
```javascript
describe('generateMetadata', () => {
  it('should generate title with product name and location', async () => {
    const product = {
      name: 'Siemens ECG Machine',
      price: 150000,
      brand: 'Siemens',
      slug: 'siemens-ecg-machine'
    };
    
    const metadata = await generateMetadata({ params: { id: 'siemens-ecg-machine' } });
    
    expect(metadata.title).toBe('Siemens ECG Machine — Price in Bangladesh | MedCore BD');
  });
  
  it('should use "Contact for Price" when price is zero', async () => {
    const product = {
      name: 'Custom Medical Device',
      price: 0,
      slug: 'custom-device'
    };
    
    const metadata = await generateMetadata({ params: { id: 'custom-device' } });
    
    expect(metadata.description).toContain('Contact for Price');
  });
});
```

### Integration Testing

**Test Scenarios**:
1. **Full Page Render**: Verify product page renders with all SEO elements
2. **Schema Validation**: Validate JSON-LD schemas against schema.org validator
3. **Image Loading**: Verify images load with correct alt text
4. **Slug Redirect**: Verify redirect from ID-based URL to slug-based URL
5. **Cache Behavior**: Verify API responses are cached for 1 hour

**Tools**:
- Supertest for API endpoint testing
- Puppeteer for full page rendering tests
- Google Rich Results Test for schema validation

### Manual Testing Checklist

- [ ] Verify rich snippets in Google Rich Results Test
- [ ] Verify Open Graph preview in Facebook Sharing Debugger
- [ ] Verify Twitter Card preview in Twitter Card Validator
- [ ] Verify breadcrumb display in Google Search Console
- [ ] Verify FAQ rich snippet eligibility
- [ ] Test product page with missing images
- [ ] Test product page with missing brand
- [ ] Test product page with zero price
- [ ] Test slug-based URL access
- [ ] Test ID-based URL redirect to slug
- [ ] Verify page load performance (<2.5s LCP)

## Performance Optimization

### Caching Strategy

**Product Data Fetch**:
```javascript
fetch(`${API_BASE}/products/${id}`, {
  next: { 
    revalidate: 3600,  // 1 hour cache
    tags: [`product-${id}`]  // On-demand revalidation
  }
})
```

**Benefits**:
- Reduces API calls for frequently accessed products
- Enables on-demand revalidation when product data changes
- Improves Time to First Byte (TTFB)

### Request Deduplication

**Implementation**: Next.js automatically deduplicates identical fetch requests within the same render cycle

**Benefit**: `generateMetadata()` and page component share the same fetch call, preventing duplicate API requests

### Image Optimization

**Next.js Image Component**:
- Automatic format optimization (WebP, AVIF)
- Lazy loading for non-priority images
- Responsive image sizing
- Cloudinary CDN delivery

**Priority Loading**:
```javascript
<Image priority={heroPriority} />
```
- Primary product image loaded with priority on initial page load
- Improves Largest Contentful Paint (LCP)

### Synchronous Schema Generation

**Implementation**: All structured data generation (Product, Breadcrumb, FAQ) executes synchronously without additional API calls

**Benefit**: Schemas generated from already-fetched product data, no additional latency

### Bundle Size Optimization

**Code Splitting**: Client components automatically code-split by Next.js App Router

**Tree Shaking**: Unused exports from `src/utils/structuredData.js` eliminated in production build

### Performance Targets

- **Time to First Byte (TTFB)**: <600ms
- **Largest Contentful Paint (LCP)**: <2.5s
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1
- **Total Blocking Time (TBT)**: <300ms

## Implementation Plan

### Phase 1: Metadata Enhancement (Priority: High)

**Tasks**:
1. Enhance `generateMetadata()` with robust error handling
2. Implement description sanitization (remove extra whitespace, limit to 155 chars)
3. Add keyword generation from product fields
4. Verify canonical URL uses slug with ID fallback
5. Add unit tests for metadata generation

**Files Modified**:
- `src/app/products/[id]/page.jsx`

**Estimated Effort**: 4 hours

### Phase 2: Image Alt Text Optimization (Priority: High)

**Tasks**:
1. Update `ProductImageGallery` to generate SEO-optimized alt text
2. Implement primary image alt text format: "{Product_Name} — {Brand} — Price ৳{Price} Bangladesh"
3. Implement secondary image alt text format: "{Product_Name} view {Index} — MedCore BD"
4. Handle missing brand and price gracefully
5. Enforce 125-character limit
6. Add unit tests for alt text generation

**Files Modified**:
- `src/components/product/ProductImageGallery.jsx`

**Estimated Effort**: 3 hours

### Phase 3: Structured Data Enhancement (Priority: Medium)

**Tasks**:
1. Verify Product schema includes all required fields
2. Add certifications as additionalProperty
3. Verify AggregateRating inclusion logic
4. Verify seller Organization information
5. Test schemas with Google Rich Results Test
6. Add unit tests for schema generation

**Files Modified**:
- `src/utils/structuredData.js`

**Estimated Effort**: 3 hours

### Phase 4: Slug-Based Routing (Priority: Medium)

**Tasks**:
1. Verify backend API returns slug in product response
2. Implement redirect logic in ProductDetailPage when accessed via ID
3. Verify canonical URL always uses slug
4. Verify breadcrumb URL uses slug
5. Test redirect behavior
6. Add integration tests

**Files Modified**:
- `src/views/ProductDetailPage.jsx`
- `src/app/products/[id]/page.jsx`

**Estimated Effort**: 4 hours

### Phase 5: Performance Optimization (Priority: Low)

**Tasks**:
1. Verify cache configuration (revalidate: 3600)
2. Verify cache tags for on-demand revalidation
3. Verify request deduplication
4. Run Lighthouse audit
5. Optimize bundle size if needed
6. Document performance metrics

**Files Modified**:
- `src/app/products/[id]/page.jsx`

**Estimated Effort**: 2 hours

### Phase 6: Testing & Validation (Priority: High)

**Tasks**:
1. Write unit tests for all components
2. Write integration tests for full page render
3. Validate schemas with Google Rich Results Test
4. Test Open Graph with Facebook Sharing Debugger
5. Test Twitter Cards with Twitter Card Validator
6. Submit updated sitemap to Google Search Console
7. Monitor search performance in GSC

**Files Modified**:
- New test files in `__tests__/` directories

**Estimated Effort**: 6 hours

**Total Estimated Effort**: 22 hours

## Deployment Considerations

### Environment Variables

No new environment variables required. Existing variables used:
- `NEXT_PUBLIC_SITE_URL`: Base URL for canonical links
- `NEXT_PUBLIC_API_URL`: Backend API endpoint

### Database Changes

No database schema changes required. Feature relies on existing product data structure.

### API Changes

**Recommended Enhancement** (not required for MVP):
- Backend API should return `slug` field in product response
- If slug doesn't exist, backend should generate from product name

### Cache Invalidation

**On-Demand Revalidation**:
```javascript
// When product is updated in admin panel
await fetch(`/api/revalidate?tag=product-${productId}`, {
  method: 'POST'
});
```

### Monitoring

**Metrics to Track**:
- Google Search Console: Impressions, clicks, CTR for product pages
- Core Web Vitals: LCP, FID, CLS for product pages
- Rich Results: Appearance of Product, FAQ, Breadcrumb rich snippets
- Organic Traffic: Sessions from organic search to product pages

### Rollback Plan

**If Issues Occur**:
1. Revert changes to `generateMetadata()` function
2. Revert changes to `ProductImageGallery` component
3. Clear Next.js cache: `rm -rf .next/cache`
4. Redeploy previous version

**No Data Loss Risk**: Feature only affects rendering, no database changes

## Security Considerations

### XSS Prevention

**Structured Data**: JSON-LD schemas use `dangerouslySetInnerHTML` with `JSON.stringify()` to prevent XSS

**User Input Sanitization**: Product data from API should be sanitized on backend before storage

### Information Disclosure

**Price Visibility**: All product prices are public information, no sensitive data exposed

**DGDA Registration**: Certification information is public and required for transparency

### Rate Limiting

**API Calls**: Product detail pages use Next.js cache (1 hour revalidation) to prevent excessive API calls

**No User Input**: Feature doesn't accept user input, only renders server-fetched data

## Future Enhancements

### Phase 2 Enhancements (Post-MVP)

1. **Video Schema**: Add VideoObject schema for product demo videos
2. **Review Schema**: Add individual Review schemas for product reviews
3. **Offer Schema**: Add multiple Offer objects for B2B vs B2C pricing
4. **HowTo Schema**: Add HowTo schema for product installation guides
5. **Organization Schema**: Add Organization schema for brand manufacturers
6. **AggregateOffer**: Use AggregateOffer for products with variants
7. **Product Availability**: Real-time stock status in schema
8. **Shipping Details**: Add shippingDetails to Offer schema
9. **Return Policy**: Add hasReturnPolicy to Offer schema
10. **Warranty Schema**: Add WarrantyPromise schema

### Analytics Integration

1. **Structured Data Tracking**: Track which schemas appear in search results
2. **Rich Snippet CTR**: Measure CTR improvement from rich snippets
3. **Keyword Ranking**: Track ranking for target keywords
4. **Conversion Attribution**: Attribute conversions to organic search

### A/B Testing Opportunities

1. **Title Format**: Test different title formats for CTR
2. **Description Length**: Test 120 vs 155 character descriptions
3. **Image Alt Text**: Test different alt text formats
4. **FAQ Questions**: Test different FAQ question sets

## Appendix

### SEO Best Practices Reference

**Title Tag**:
- Length: 50-60 characters (MedCore BD format: ~45-55 chars)
- Include primary keyword at beginning
- Include location (Bangladesh)
- Include brand (MedCore BD)

**Meta Description**:
- Length: 150-160 characters
- Include primary and secondary keywords
- Include call-to-action ("Buy online", "Free delivery")
- Include unique selling points (DGDA certified, B2B discounts)

**Image Alt Text**:
- Length: 100-125 characters
- Describe image content
- Include product name and brand
- Include location keyword
- Avoid keyword stuffing

**Structured Data**:
- Use JSON-LD format (preferred by Google)
- Validate with Google Rich Results Test
- Include all required properties
- Use specific types (Product, not Thing)

### Target Keywords by Product Category

**Diagnostic Equipment**:
- ECG machine price Bangladesh
- ultrasound machine price BD
- patient monitor price Dhaka

**Laboratory Reagents**:
- HbA1c kit price Bangladesh
- CBC reagent price BD
- biochemistry reagent Dhaka

**Surgical Instruments**:
- surgical scissors price Bangladesh
- forceps price BD
- trocar set price Dhaka

### Competitor Analysis

**Key Competitors**:
1. GhoreBazar.com (general medical equipment)
2. Local medical equipment suppliers (offline)
3. International suppliers (Alibaba, IndiaMART)

**MedCore BD Advantages**:
- DGDA registration verification
- Local presence and support
- B2B credit terms
- Free installation in Dhaka
- Cold chain delivery for reagents

### Schema.org Resources

- Product: https://schema.org/Product
- Offer: https://schema.org/Offer
- AggregateRating: https://schema.org/AggregateRating
- BreadcrumbList: https://schema.org/BreadcrumbList
- FAQPage: https://schema.org/FAQPage
- Organization: https://schema.org/Organization

### Google Rich Results Documentation

- Product Rich Results: https://developers.google.com/search/docs/appearance/structured-data/product
- FAQ Rich Results: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Breadcrumb Rich Results: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb

