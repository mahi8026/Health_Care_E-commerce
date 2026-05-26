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
// Dynamic metadata — rich title/description/keywords for Google rankings
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) return { title: 'Product Not Found | MedCore BD', robots: { index: false } };

  const name      = product.name || 'Product';
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const catName   = typeof product.category === 'object' ? product.category?.name : product.category;
  // Always use slug for canonical — fall back to id only if slug missing
  const slug      = product.slug || id;

  const title = `${name} — Price in Bangladesh | MedCore BD`;
  const descChunk = product.description?.replace(/\s+/g, ' ').trim().slice(0, 110) || '';
  const description = `Buy ${name} in Bangladesh. ${descChunk}${descChunk ? ' ' : ''}Brand: ${brandName || 'N/A'}. Price: ৳${product.price?.toLocaleString()}. DGDA certified. Free delivery Dhaka.`;

  const primaryImg = product.images?.find(i => i?.isPrimary) || product.images?.[0];
  const imageUrl   = (typeof primaryImg === 'string' ? primaryImg : primaryImg?.url) || '/og-default.png';

  const canonicalUrl = `${SITE_CONFIG.url}/products/${slug}`;

  return {
    title,
    description,
    keywords: `${name}, ${brandName || ''}, ${catName || ''} Bangladesh, buy ${name} online BD, ${product.sku || ''}`.replace(/,\s*,/g, ','),
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
