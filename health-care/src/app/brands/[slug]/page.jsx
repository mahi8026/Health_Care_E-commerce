import { notFound } from 'next/navigation';
import BrandPage from '@/views/BrandPage';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function fetchBrands() {
  try {
    const res = await fetch(`${API}/manufacturers`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.data?.manufacturers || data.manufacturers || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function fetchBrandProducts(name) {
  try {
    const res = await fetch(`${API}/products?brand=${encodeURIComponent(name)}&limit=48`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Static params — one page per active brand
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const brands = await fetchBrands();
  return brands.filter(b => b.slug).map(b => ({ slug: b.slug }));
}

// Allow brands not present at build time (new manufacturers)
export const dynamicParams = true;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const brands = await fetchBrands();
  const brand = brands.find(b => b.slug === slug);

  if (!brand) {
    return { title: 'Brand Not Found', robots: { index: false } };
  }

  const brandName = brand.name || 'Medical Brand';
  const title = `${brandName} — Products & Price in Bangladesh | MediportBD`;
  const description =
    brand.seo?.metaDescription ||
    brand.description ||
    `Buy authentic ${brandName} products in Bangladesh. Browse prices, specifications and genuine ${brandName} medical equipment with DGDA certification, warranty and B2B pricing from MediportBD.`;

  const canonicalUrl = `${SITE_CONFIG.url}/brands/${slug}`;
  const logoUrl = brand.logo?.url ? brand.logo.url : `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: logoUrl, width: 1200, height: 630, alt: `${brandName} — MediportBD Bangladesh` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [logoUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function BrandDetailPage({ params }) {
  const { slug } = await params;
  const brands = await fetchBrands();
  const brand = brands.find(b => b.slug === slug);

  if (!brand) {
    notFound();
  }

  const products = await fetchBrandProducts(brand.name);
  const brandName = brand.name || 'Medical Brand';
  const canonicalUrl = `${SITE_CONFIG.url}/brands/${slug}`;

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Brands', url: `${SITE_CONFIG.url}/brands` },
    { name: brandName, url: canonicalUrl },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((b, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: b.name,
              item: b.url,
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${brandName} Products`,
            description: `Shop authentic ${brandName} medical equipment and supplies in Bangladesh at MediportBD.`,
            url: canonicalUrl,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: products.slice(0, 20).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'Product',
                  name: p.name,
                  image: (Array.isArray(p.images) && p.images[0]) || p.image,
                  url: `${SITE_CONFIG.url}/products/${p.slug || p._id}`,
                },
              })),
            },
          }),
        }}
      />
      <BrandPage brand={brand} initialProducts={products} />
    </>
  );
}