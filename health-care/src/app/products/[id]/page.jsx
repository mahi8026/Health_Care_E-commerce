import { generateProductMetadata } from '@/utils/metadata';
import StructuredData, {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import { siteConfig } from '@/config/seo';
import ProductDetailPage from '@/views/ProductDetailPage';

// ---------------------------------------------------------------------------
// Hardcoded product data (mirrors ProductDetailPage.jsx until API is wired up)
// ---------------------------------------------------------------------------

const HARDCODED_PRODUCT = {
  _id: 'SIE-ECG-12L-PRO',
  id: 'SIE-ECG-12L-PRO',
  name: 'Siemens Cardiostat 12-lead ECG machine with thermal printer',
  brand: 'Siemens Healthineers',
  category: 'ECG Machines',
  sku: 'SIE-ECG-12L-PRO',
  description:
    'Professional 12-lead ECG machine with integrated thermal printer, large colour display, and wireless connectivity. Ideal for cardiology clinics and hospital wards.',
  price: 95000,
  priceCurrency: 'BDT',
  inStock: true,
  image: null, // No real image URL yet; falls back to default OG image
};

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------

/**
 * Attempt to fetch a product from the backend API.
 * Falls back to the hardcoded product when the API is unavailable or the id
 * matches the demo product.
 *
 * @param {string} id - Product ID from the URL params
 * @returns {Promise<Object|null>} Product object or null if not found
 */
async function fetchProduct(id) {
  // Return hardcoded data for the demo product or when no real API is available
  if (id === HARDCODED_PRODUCT._id || id === HARDCODED_PRODUCT.id) {
    return { ...HARDCODED_PRODUCT, _id: id };
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products/${id}`,
      {
        next: { revalidate: 3600 }, // ISR: revalidate every hour
      }
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    // API unavailable — return null so the page renders a not-found state
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dynamic metadata (Requirement 4.3, 4.4, 4.7, 5.1, 5.2)
// ---------------------------------------------------------------------------

/**
 * Generate per-product metadata for the Next.js App Router.
 * Returns noindex metadata when the product is not found (Requirement 4.4).
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  return generateProductMetadata(product);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

/**
 * Product detail page — App Router server component.
 *
 * Renders:
 * - Product JSON-LD structured data (Requirement 6.1)
 * - BreadcrumbList JSON-LD structured data (Requirement 6.3)
 * - The existing ProductDetailPage client component
 *
 * The hero product image is marked with priority={true} via the
 * `heroPriority` prop passed down to ProductDetailPage (Requirement 2.4).
 */
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  // Build breadcrumb data for JSON-LD
  const breadcrumbs = [
    { name: 'Home', url: siteConfig.url },
    {
      name: 'Diagnostic Machines',
      url: `${siteConfig.url}/categories/diagnostics`,
    },
    {
      name: 'ECG Machines',
      url: `${siteConfig.url}/categories/diagnostics/ecg`,
    },
    {
      name: product?.name ?? 'Product',
      url: `${siteConfig.url}/products/${id}`,
    },
  ];

  const productSchema = product ? generateProductSchema(product) : null;
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      {/* Product JSON-LD — Requirement 6.1 */}
      {productSchema && <StructuredData schema={productSchema} />}

      {/* BreadcrumbList JSON-LD — Requirement 6.3 */}
      {breadcrumbSchema && <StructuredData schema={breadcrumbSchema} />}

      {/*
       * Render the existing ProductDetailPage component.
       * heroPriority={true} signals that the main product image should be
       * loaded with priority (disables lazy loading, triggers <link rel="preload">)
       * to satisfy Requirement 2.4 / 1.6.
       */}
      <ProductDetailPage heroPriority={true} />
    </>
  );
}
