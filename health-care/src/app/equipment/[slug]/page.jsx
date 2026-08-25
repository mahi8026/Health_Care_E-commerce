import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';
import { LANDING_PAGES, getLandingPageBySlug } from '@/config/landingPages';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { getClustersForLandingPage } from '@/config/topicalClusters';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = getLandingPageBySlug(slug);
  if (!page) return { title: 'Page Not Found', robots: { index: false } };

  const canonicalUrl = `${SITE_CONFIG.url}/equipment/${slug}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords.join(', '),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: page.metaTitle,
      description: page.metaDescription,
      images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

async function fetchProducts(searchTerm) {
  try {
    const res = await fetch(`${API}/products?search=${encodeURIComponent(searchTerm)}&limit=12`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : (Array.isArray(data.products) ? data.products : []);
  } catch {
    return [];
  }
}

async function fetchBrandNames() {
  try {
    const res = await fetch(`${API}/manufacturers`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const data = await res.json();
    const list = data.data?.manufacturers || data.manufacturers || [];
    return Object.fromEntries(
      (Array.isArray(list) ? list : []).map((b) => [b.slug, b.name])
    );
  } catch {
    return {};
  }
}

export default async function EquipmentLandingPage({ params }) {
  const { slug } = await params;
  const page = getLandingPageBySlug(slug);
  if (!page) notFound();

  const canonicalUrl = `${SITE_CONFIG.url}/equipment/${slug}`;
  const [products, brandNames] = await Promise.all([
    fetchProducts(page.search),
    page.brandSlugs ? fetchBrandNames() : Promise.resolve({}),
  ]);
  const brands = (page.brandSlugs || [])
    .filter((s) => brandNames[s])
    .map((s) => ({ slug: s, name: brandNames[s] }));

  const categoryName = CATEGORY_SLUG_MAP[page.categorySlug];
  const parentClusters = getClustersForLandingPage(slug);
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Equipment', url: `${SITE_CONFIG.url}/equipment` },
    { name: page.title, url: canonicalUrl },
  ];

  const itemList = products.slice(0, 20).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Product',
      name: p.name,
      image: (Array.isArray(p.images) && p.images[0]) || p.image,
      url: `${SITE_CONFIG.url}/products/${p.slug || p._id}`,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'BDT',
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    },
  }));

  return (
    <div className="min-h-screen bg-page">
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: page.title,
          description: page.metaDescription,
          url: canonicalUrl,
          mainEntity: { '@type': 'ItemList', itemListElement: itemList },
        }}
      />
      <FAQSchema faqs={page.faqs} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-secondary)] mb-4 flex flex-wrap gap-1.5">
          <Link href="/" className="hover:text-brand-teal transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/equipment" className="hover:text-brand-teal transition-colors">Equipment</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-text-primary)]">{page.title}</span>
        </nav>

        {/* Topic cluster cross-links — passes authority upward to hub pages */}
        {parentClusters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--color-text-tertiary)] font-medium">Topic guide:</span>
            {parentClusters.map(cluster => (
              <Link
                key={cluster.slug}
                href={`/topics/${cluster.slug}`}
                className="inline-flex items-center gap-1 text-brand-teal border border-brand-teal/30 rounded-lg px-3 py-1 hover:bg-brand-teal hover:text-white transition-colors"
              >
                <span aria-hidden="true">{cluster.icon}</span>
                {cluster.title}
              </Link>
            ))}
            {categoryName && (
              <Link
                href={`/products/category/${page.categorySlug}`}
                className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors"
              >
                All {categoryName} →
              </Link>
            )}
          </div>
        )}

        {/* Hero */}
        <header className="bg-white rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-navy via-brand-teal to-brand-teal-light" />
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl" aria-hidden="true">{page.icon}</span>
              <span className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal">
                MediportBD Price Guide · 2026
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-semibold text-brand-navy mb-3">
              {page.title}
            </h1>
            <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
              {page.excerpt}
            </p>
          </div>
        </header>

        {/* Live product grid */}
        <section className="mt-8">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-navy">
              Live Prices from Our Catalog
            </h2>
            <Link
              href={`/products/category/${page.categorySlug}`}
              className="text-xs font-semibold text-brand-teal hover:underline"
            >
              View all {categoryName || 'related products'} →
            </Link>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={page.icon}
              title="Products loading"
              description="Our team is updating this category. Contact us for the latest availability and pricing."
              action={{
                label: 'Request a Quote',
                onClick: undefined,
                href: '/quotes/request',
              }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map(product => (
                <ProductCard key={product._id || product.id} product={product} showCategory />
              ))}
            </div>
          )}
        </section>

        {/* Brand links — pass landing-page authority to brand pages */}
        {brands.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Top Brands in Bangladesh</h2>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}`}
                  className="inline-flex items-center text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Long-form SEO content */}
        <section className="mt-10 bg-white border border-[var(--color-border-primary)] rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-brand-navy mb-3">
            {page.title} — Complete Guide
          </h2>
          {page.intro.map((para, i) => (
            <p key={i} className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-secondary)] mb-4">
              {para}
            </p>
          ))}
        </section>

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section id="landing-faqs" className="mt-8">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {page.faqs.map(faq => (
                <div key={faq.q} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-brand-navy text-white p-6 md:p-8 text-center">
          <h2 className="text-lg md:text-xl font-semibold mb-2">
            Need a bulk quote or hospital tender price?
          </h2>
          <p className="text-sm text-white/70 mb-4 max-w-2xl mx-auto">
            Our Dhaka-based team provides free quotations, B2B pricing and DGDA documentation for hospitals, clinics and diagnostic centres across Bangladesh.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/quotes/request"
              className="px-5 py-2.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/b2b"
              className="px-5 py-2.5 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              B2B Pricing
            </Link>
            <Link
              href={`/products/category/${page.categorySlug}`}
              className="px-5 py-2.5 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Browse Category
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}