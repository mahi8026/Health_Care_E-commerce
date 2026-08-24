import { notFound } from 'next/navigation';
import Link from 'next/link';
import BrandPage from '@/views/BrandPage';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';
import {
  getBrandFaqs,
  getBrandQuickAnswer,
} from '@/config/brandGEO';

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