import { generateProductMetadata } from '@/utils/metadata';
import StructuredData, {
  generateProductSchema,
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import { siteConfig } from '@/config/seo';
import ProductDetailPage from '@/views/ProductDetailPage';
import { API as API_BASE } from '@/constants/api';

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------
async function fetchProduct(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product || data.data || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);
  return generateProductMetadata(product);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  const breadcrumbs = [
    { name: 'Home', url: siteConfig.url },
    {
      name: typeof product?.category === 'object'
        ? product.category?.name
        : product?.category || 'Products',
      url: `${siteConfig.url}/products`,
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
      {productSchema && <StructuredData schema={productSchema} />}
      {breadcrumbSchema && <StructuredData schema={breadcrumbSchema} />}

      {/* Pass the id so ProductDetailPage fetches the correct product */}
      <ProductDetailPage productId={id} heroPriority={true} />
    </>
  );
}
