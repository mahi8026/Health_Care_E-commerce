import { notFound } from 'next/navigation';
import Link from 'next/link';
import BrandPage from '@/views/BrandPage';
import { SITE_CONFIG } from '@/config/seo';
import { finalTitle, socialTitle } from '@/utils/metadata';
import { API } from '@/constants/api';
import { serverFetchJson, extractList } from '@/lib/serverFetch';
import {
  getBrandFaqs,
  getBrandQuickAnswer,
} from '@/config/brandGEO';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------
async function fetchBrands() {
  const data = await serverFetchJson(`${API}/manufacturers`, { revalidate: 3600 });
  return extractList(data, 'manufacturers');
}

async function fetchBrandProducts(name) {
  const data = await serverFetchJson(
    `${API}/products?brand=${encodeURIComponent(name)}&limit=100`,
    { revalidate: 3600 }
  );
  const products = Array.isArray(data?.data) ? data.data : [];
  const total = Number(data?.pagination?.total) || Number(data?.pagination?.totalDocs) || 0;
  return { products, total };
}

// Allow brands not present at build time (new manufacturers)
export const dynamicParams = true;
// ISR: render on first request, cache for 1 hour instead of pre-rendering
// every brand at build time (avoids heavy backend load during builds).
export const revalidate = 3600;

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
  const products = (await fetchBrandProducts(brandName)).products;
  const productCount = products.length || brand.productCount || 0;
  const categoryAnchor = products[0]?.category?.name
    || (typeof products[0]?.category === 'string' ? products[0]?.category : '');
  // Data-tied title/description only: live sample count + first category seen.
  // No invented ranges, availability, delivery, stock, reviews, or warranty.
  const title = productCount > 0
    ? `${brandName} in Bangladesh — ${productCount}+ Products${categoryAnchor ? ` | ${categoryAnchor}` : ''} | MediportBD`
    : `${brandName} in Bangladesh | Shop Genuine Products | MediportBD`;
  const description = brand.seo?.metaDescription
    || brand.description
    || (productCount > 0
      ? `Browse ${productCount}+ ${brandName} products in Bangladesh${categoryAnchor ? `, starting with ${categoryAnchor}` : ''}. Genuine catalogue, DGDA documentation available for regulated items.`
      : `Shop genuine ${brandName} medical equipment and supplies in Bangladesh from MediportBD.`);

  const canonicalUrl = `${SITE_CONFIG.url}/brands/${slug}`;
  const logoUrl = brand.logo?.url ? brand.logo.url : `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`;

  return {
    title: finalTitle(title),
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: socialTitle(title),
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: logoUrl, width: 1200, height: 630, alt: `${brandName} — MediportBD Bangladesh` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle(title),
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

  const { products } = await fetchBrandProducts(brand.name);
  const brandName = brand.name || 'Medical Brand';
  const canonicalUrl = `${SITE_CONFIG.url}/brands/${slug}`;
  const quickAnswer = getBrandQuickAnswer(slug, brandName);
  const faqs = getBrandFaqs(slug, brandName);

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
                name: p.name,
                url: `${SITE_CONFIG.url}/products/${p.slug || p._id}`,
              })),
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': canonicalUrl,
            url: canonicalUrl,
            name: `${brandName} Products in Bangladesh`,
            speakable: {
              '@type': 'Speakable',
              cssSelector: ['#quick-answer'],
            },
          }),
        }}
      />
      <BrandPage brand={brand} initialProducts={products} />

      {/* Brand GEO box — answer-first, AI-engine extractable + internal links */}
      {quickAnswer && (
        <section className="bg-page px-4 pb-8">
          <div
            id="quick-answer"
            className="container mx-auto max-w-[1280px] rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-4 sm:p-5"
          >
            <p className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
              {brandName} in Bangladesh
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {quickAnswer}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Link href="/guides/medical-equipment-bangladesh-guide" className="text-brand-teal hover:underline">
                Medical Equipment Buying Guide
              </Link>
              <Link href="/guides/dgda-registration-explained" className="text-brand-teal hover:underline">
                DGDA Registration Explained
              </Link>
              <Link href="/b2b" className="text-brand-teal hover:underline">
                B2B Bulk Pricing
              </Link>
              <Link href="/certifications" className="text-brand-teal hover:underline">
                Our Certifications
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}