import { generateProductMetadata } from '@/utils/metadata';
import StructuredData, {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';
import { SITE_CONFIG } from '@/config/seo';
import ProductDetailPage from '@/views/ProductDetailPage';
import { API as API_BASE } from '@/constants/api';

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------
async function fetchProduct(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      next: { revalidate: 3600, tags: [`product-${id}`] },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || data.data || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Metadata helpers
// ---------------------------------------------------------------------------

/**
 * Extract a plain string name from a field that may be a populated Mongoose
 * object ({ _id, name, … }) or already a plain string.
 */
function extractName(field) {
  if (!field) return '';
  if (typeof field === 'object' && field.name) return String(field.name);
  if (typeof field === 'string') return field;
  return '';
}

/**
 * Format a price value.  Returns "Contact for Price" when the value is
 * falsy (0, null, undefined).
 */
function formatPrice(price) {
  if (!price) return 'Contact for Price';
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

/**
 * Build a ≤155-character meta description from product fields.
 * Format: "Buy {name} online in Bangladesh. Brand: {brand}. Category: {cat}. Price: {price}."
 * Falls back gracefully when individual fields are missing.
 */
function buildDescription(name, brandName, catName, price) {
  const priceStr = formatPrice(price);

  const parts = [`Buy ${name} online in Bangladesh.`];
  if (brandName) parts.push(`Brand: ${brandName}.`);
  if (catName)   parts.push(`Category: ${catName}.`);
  parts.push(`Price: ${priceStr}.`);

  // Join, collapse extra whitespace, then truncate to 155 chars
  const raw = parts.join(' ').replace(/\s+/g, ' ').trim();
  return raw.length <= 155 ? raw : raw.slice(0, 152) + '…';
}

/**
 * Build a comma-separated keywords string from product fields.
 */
function buildKeywords(name, brandName, catName, sku) {
  const tokens = [
    name,
    brandName,
    catName,
    sku,
    'Bangladesh',
    'buy online BD',
    'price',
  ].filter(Boolean);

  // Deduplicate and join
  return [...new Set(tokens)].join(', ');
}

// ---------------------------------------------------------------------------
// Dynamic metadata — rich title/description/keywords for Google rankings
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return { title: 'Product Not Found | MedCore BD', robots: { index: false } };
  }

  const name      = product.name || 'Product';
  const brandName = extractName(product.brand);
  const catName   = extractName(product.category);

  // Always use slug for canonical — fall back to id only if slug missing
  const slug = product.slug || id;

  const title       = `${name} — Price in Bangladesh | MedCore BD`;
  const description = buildDescription(name, brandName, catName, product.price);
  const keywords    = buildKeywords(name, brandName, catName, product.sku);

  // Primary image — prefer isPrimary flag, then first image, then site default
  const primaryImg = product.images?.find(i => i?.isPrimary) || product.images?.[0];
  const imageUrl   =
    (typeof primaryImg === 'string' ? primaryImg : primaryImg?.url) ||
    `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`;

  const canonicalUrl = `${SITE_CONFIG.url}/products/${slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url:    canonicalUrl,
      type:   'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `${name} — MedCore BD Bangladesh` }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [imageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  const slug      = product?.slug || id;
  const catName   = typeof product?.category === 'object'
    ? product.category?.name
    : product?.category || 'Products';

  const breadcrumbs = [
    { name: 'Home',     url: SITE_CONFIG.url },
    { name: catName,    url: `${SITE_CONFIG.url}/products?category=${encodeURIComponent(catName)}` },
    { name: product?.name ?? 'Product', url: `${SITE_CONFIG.url}/products/${slug}` },
  ];

  const productSchema    = product ? generateProductSchema(product) : null;
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      {productSchema    && <StructuredData schema={productSchema} />}
      {breadcrumbSchema && <StructuredData schema={breadcrumbSchema} />}
      {product          && <FAQSchema product={product} />}

      <ProductDetailPage productId={id} heroPriority={true} />
    </>
  );
}
