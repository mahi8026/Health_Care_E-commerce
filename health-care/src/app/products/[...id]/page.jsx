import StructuredData, {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';
import { SITE_CONFIG } from '@/config/seo';
import ProductDetailPage from '@/views/ProductDetailPage';
import { API as API_BASE } from '@/constants/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------
async function fetchProduct(slug) {
  try {
    // If the slug contains a slash (legacy slug with / in it), pass it as a
    // query param — Express won't decode %2F in path segments by default.
    const url = slug.includes('/')
      ? `${API_BASE}/products?slug=${encodeURIComponent(slug)}`
      : `${API_BASE}/products/${slug}`;
    const res = await fetch(url, {
      next: { revalidate: 3600, tags: [`product-${slug}`] },
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

function extractName(field) {
  if (!field) return '';
  if (typeof field === 'object' && field.name) return String(field.name);
  if (typeof field === 'string') return field;
  return '';
}

function formatPrice(price) {
  if (!price) return 'Contact for Price';
  return `৳${Number(price).toLocaleString('en-BD')}`;
}

function buildDescription(name, brandName, catName, price) {
  const priceStr = formatPrice(price);
  const parts = [`Buy ${name} online in Bangladesh.`];
  if (brandName) parts.push(`Brand: ${brandName}.`);
  if (catName)   parts.push(`Category: ${catName}.`);
  parts.push(`Price: ${priceStr}.`);
  const raw = parts.join(' ').replace(/\s+/g, ' ').trim();
  return raw.length <= 155 ? raw : raw.slice(0, 152) + '…';
}

function buildKeywords(name, brandName, catName, sku) {
  const tokens = [name, brandName, catName, sku, 'Bangladesh', 'buy online BD', 'price'].filter(Boolean);
  return [...new Set(tokens)].join(', ');
}

// ---------------------------------------------------------------------------
// Resolve slug from catch-all segments
// Handles both clean slugs (/products/my-product) and legacy slugs with
// forward slashes (/products/flu-a/b) by joining all segments back together.
// ---------------------------------------------------------------------------
function resolveSlug(segments) {
  return Array.isArray(segments) ? segments.join('/') : String(segments);
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { id: segments } = await params;
  const slug = resolveSlug(segments);
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: 'Product Not Found | MedCore BD', robots: { index: false } };
  }

  const name      = product.name || 'Product';
  const brandName = extractName(product.brand);
  const catName   = extractName(product.category);

  // Canonical always uses the clean slug stored on the product (no slashes)
  const canonicalSlug = product.slug || slug;

  const title       = `${name} — Price in Bangladesh | MedCore BD`;
  const description = buildDescription(name, brandName, catName, product.price);
  const keywords    = buildKeywords(name, brandName, catName, product.sku);

  const primaryImg = product.images?.find(i => i?.isPrimary) || product.images?.[0];
  const imageUrl   =
    (typeof primaryImg === 'string' ? primaryImg : primaryImg?.url) ||
    `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`;

  const canonicalUrl = `${SITE_CONFIG.url}/products/${canonicalSlug}`;

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
  const { id: segments } = await params;
  const slug = resolveSlug(segments);
  const product = await fetchProduct(slug);

  const canonicalSlug = product?.slug || slug;
  const catName = typeof product?.category === 'object'
    ? product.category?.name
    : product?.category || 'Products';

  const categorySlug = CATEGORY_NAME_TO_SLUG[catName];
  const categoryUrl  = categorySlug
    ? `${SITE_CONFIG.url}/products/category/${categorySlug}`
    : `${SITE_CONFIG.url}/products?category=${encodeURIComponent(catName)}`;

  const breadcrumbs = [
    { name: 'Home',                     url: SITE_CONFIG.url },
    { name: catName,                    url: categoryUrl },
    { name: product?.name ?? 'Product', url: `${SITE_CONFIG.url}/products/${canonicalSlug}` },
  ];

  const productSchema    = product ? generateProductSchema(product) : null;
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <>
      {productSchema    && <StructuredData schema={productSchema} />}
      {breadcrumbSchema && <StructuredData schema={breadcrumbSchema} />}
      {product          && <FAQSchema product={product} />}

      <ProductDetailPage productId={slug} heroPriority={true} />
    </>
  );
}
