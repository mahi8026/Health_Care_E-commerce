# Implementation Plan

- [x] 1. Enhance generateMetadata() in Product Detail Page
  - Read the current `src/app/products/[id]/page.jsx` to understand existing `generateMetadata()` implementation
  - Update the fetch call to use `next: { revalidate: 3600, tags: [\`product-${id}\`] }` for caching and on-demand revalidation
  - Implement title generation in format `"{Product_Name} — Price in Bangladesh | MedCore BD"` with fallback to "Product" when name is missing
  - Implement description generation: extract brand name (handle populated object), category name (handle populated object), price (use "Contact for Price" when 0/null/undefined), combine into ≤155 char description with "Buy online in Bangladesh"
  - Implement description sanitization: strip extra whitespace, truncate to 155 characters
  - Implement keyword generation combining product name, brand, category, SKU, "Bangladesh", "buy online BD", "price"
  - Set canonical URL using `product.slug` when available, falling back to MongoDB ID
  - Add Open Graph metadata: title, description, type "website", primary image URL at 1200×630, canonical URL
  - Add Twitter Card metadata: type "summary_large_image", title, description, image matching OG
  - Handle missing product (API error/404): return `{ title: "Product Not Found | MedCore BD", robots: { index: false } }`
  - Handle missing images: fall back to `SITE_CONFIG.ogImage` from `src/config/seo.js`
  - _Requirements: 1, 2, 9, 10_

- [x] 2. Optimize Image Alt Text in ProductImageGallery
  - Read the current `src/components/product/ProductImageGallery.jsx` to understand existing alt text and props
  - Accept `product` prop (containing `name`, `brand`, `price`) in the component if not already present
  - Implement a helper function `generateAltText(product, index)` for primary image (index 0): `"{Product_Name} — {Brand} — Price ৳{Price} Bangladesh"` — omit brand segment when missing, use "Contact for Price" when price is 0/null/undefined
  - Implement secondary image alt text (index > 0): `"{Product_Name} view {index} — MedCore BD"`, truncate to 125 characters maximum
  - Apply generated alt text to all `<Image>` components in the gallery
  - Handle brand as populated object (extract `.name`) or plain string
  - _Requirements: 5, 9_

- [x] 3. Enhance Structured Data Utility (Product and Breadcrumb Schemas)
  - Read the current `src/utils/structuredData.js` to understand existing schema generators
  - Update `generateProductSchema(product)` to include `name`, `description`, `sku`, `url` (using slug when available), `brand` as `{ "@type": "Brand", "name": brandName }`, `image` as array of all image URLs
  - Add `offers` object with `priceCurrency: "BDT"`, `price`, `availability` (InStock/OutOfStock), `priceValidUntil` (1 year from now), `itemCondition: "https://schema.org/NewCondition"`, `seller: { "@type": "Organization", "name": "MedCore BD", "url": SITE_CONFIG.url }`
  - Add `aggregateRating` only when `product.rating` exists (handle both number and `{ average, count }` shapes)
  - Add `additionalProperty` array for each certification in `product.certifications` (DGDA, CE, ISO) as `{ "@type": "PropertyValue", "name": cert, "value": "Certified" }`
  - Update `generateBreadcrumbSchema(breadcrumbs)` to accept array of `{ name, url }` items and generate `BreadcrumbList` with `ListItem` entries at positions 1 (Home), 2 (Category), 3 (Product), using slug in product URL with ID fallback
  - Ensure both functions handle null/undefined inputs gracefully (return null, log error in dev)
  - _Requirements: 3, 4, 7, 10_

- [x] 4. Enhance FAQSchema Component
  - Read the current `src/components/seo/FAQSchema.jsx` to understand existing implementation
  - Ensure the component accepts a `product` prop and returns `null` when product is null/undefined
  - Generate FAQPage JSON-LD with four questions: price in Bangladesh, DGDA registration status, warranty terms (use `product.variants.warranty` when available, otherwise generic "1 year manufacturer warranty"), and where to buy in Bangladesh mentioning MedCore BD and delivery areas
  - Render as `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />`
  - _Requirements: 8_

- [x] 5. Wire Structured Data Schemas into Product Detail Page
  - In the server component page (`src/app/products/[id]/page.jsx`), call `generateProductSchema(product)` and render as `<script type="application/ld+json">` in the page JSX
  - Build breadcrumb data array `[{ name: "Home", url: "/" }, { name: categoryName, url: "/products?category=..." }, { name: product.name, url: "/products/" + (product.slug || product._id) }]` and call `generateBreadcrumbSchema(breadcrumbs)`, render as `<script type="application/ld+json">`
  - Pass `product` prop to `<FAQSchema product={product} />` component in the page
  - Ensure schemas are only rendered when product data is available (guard against null)
  - _Requirements: 3, 4, 8, 10_
  - _Dependencies: 3, 4_

- [x] 6. Implement SEO Content Block in ProductDetailPage
  - Read the current `src/views/ProductDetailPage.jsx` to understand existing layout and where reviews are rendered
  - Add an SEO content section rendered below the product reviews section
  - Render `<h2>About {product.name}</h2>`
  - Render `<h3>{product.name} Price in Bangladesh</h3>` followed by a paragraph mentioning the BDT price (or "Contact for Price") and B2B bulk discount availability (8–30%)
  - Render `<h3>Buy {product.name} in Bangladesh</h3>` followed by a paragraph mentioning MedCore BD as authorized distributor, DGDA registration, free delivery in Dhaka for orders over ৳50,000, and nationwide shipping — include brand name when available
  - Apply Tailwind CSS classes consistent with the existing page styling
  - _Requirements: 6_

- [x] 7. Implement Slug-Based Redirect in ProductDetailPage
  - Read the current routing/redirect logic in `src/views/ProductDetailPage.jsx` and `src/app/products/[id]/page.jsx`
  - In the client component (`ProductDetailPage`), after product data loads, check if the current URL param (`id`) looks like a MongoDB ObjectId (24-char hex) and `product.slug` exists
  - If condition is true, call `router.replace(\`/products/${product.slug}\`)` to redirect to the slug-based URL
  - Ensure the redirect does not cause an infinite loop (only redirect when current param is an ID, not a slug)
  - _Requirements: 7_
  - _Dependencies: 6_

- [x] 8. Write Unit Tests for Metadata Generation
  - Set up test file `src/__tests__/productMetadata.test.js` with Jest, mock `fetch` to return controlled product data
  - Test title format `"{name} — Price in Bangladesh | MedCore BD"` with valid product
  - Test title fallback to "Product" when name is missing
  - Test "Product Not Found | MedCore BD" title and `robots: { index: false }` when product is null
  - Test description contains product name, brand, category, price, "Buy online in Bangladesh" and is ≤155 chars
  - Test description uses "Contact for Price" when price is 0 or null
  - Test canonical URL uses slug when available and falls back to MongoDB ID when slug is missing
  - Test Open Graph image falls back to `SITE_CONFIG.ogImage` when product has no images
  - Test brand and category extracted from populated objects (`.name` property)
  - _Requirements: 1, 2, 9_
  - _Dependencies: 1_

- [x] 9. Write Unit Tests for Alt Text and Structured Data
  - Set up test file `src/__tests__/productSeo.test.js` with Jest and @testing-library/react
  - Test `generateAltText`: primary image format with all fields, omits brand when missing, uses "Contact for Price" when price is 0/null, secondary image format, truncates to 125 characters
  - Test `generateProductSchema`: includes all required fields, includes `aggregateRating` only when rating exists, includes `additionalProperty` for certifications, returns null gracefully when product is null
  - Test `generateBreadcrumbSchema`: generates 3 ListItems with correct positions and URLs, uses "Products" as fallback category name
  - Test `FAQSchema` component: renders `<script>` tag with valid JSON-LD when product provided, returns null when product is null
  - _Requirements: 3, 4, 5, 8_
  - _Dependencies: 2, 3, 4_
