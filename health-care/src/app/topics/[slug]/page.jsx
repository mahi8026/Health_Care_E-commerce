import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { TOPICAL_CLUSTERS, getClusterBySlug, getClusterLandingPages } from '@/config/topicalClusters';
import { getGuideBySlug } from '@/config/guides';
import { fetchListing } from '@/lib/listingData';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { API } from '@/constants/api';
import ProductCard from '@/components/ProductCard';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const revalidate = 3600;
export const dynamicParams = true;

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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cluster = getClusterBySlug(slug);
  if (!cluster) return { title: 'Topic Not Found', robots: { index: false } };

  const canonicalUrl = `${SITE_CONFIG.url}/topics/${cluster.slug}`;
  return {
    title: cluster.metaTitle,
    description: cluster.metaDescription,
    keywords: cluster.keywords.join(', '),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: cluster.metaTitle,
      description: cluster.metaDescription,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: cluster.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: cluster.metaTitle,
      description: cluster.metaDescription,
    },
  };
}

export default async function TopicClusterPage({ params }) {
  const { slug } = await params;
  const cluster = getClusterBySlug(slug);
  if (!cluster) notFound();

  const canonicalUrl = `${SITE_CONFIG.url}/topics/${cluster.slug}`;
  const landingPages = getClusterLandingPages(cluster);
  const guides = (cluster.guideSlugs || []).map(getGuideBySlug).filter(Boolean);
  const categoryName = CATEGORY_SLUG_MAP[cluster.categorySlug];
  const brandNames = await fetchBrandNames();
  const brands = (cluster.brandSlugs || [])
    .filter((s) => brandNames[s])
    .map((s) => ({ slug: s, name: brandNames[s] }));

  const [listing] = await Promise.all([fetchListing({ category: cluster.categorySlug, page: '1' })]);

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Topics', url: `${SITE_CONFIG.url}/topics` },
    { name: cluster.title, url: canonicalUrl },
  ];

  return (
    <div className="min-h-screen bg-page">
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: cluster.title,
          description: cluster.metaDescription,
          url: canonicalUrl,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: listing.products.slice(0, 20).map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Product',
                name: p.name,
                image: (Array.isArray(p.images) && p.images[0]?.url) || p.image,
                url: `${SITE_CONFIG.url}/products/${p.slug || p._id}`,
              },
            })),
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-secondary)] mb-4 flex flex-wrap gap-1.5">
          <Link href="/" className="hover:text-brand-teal transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/topics" className="hover:text-brand-teal transition-colors">Topics</Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-text-primary)]">{cluster.title}</span>
        </nav>

        {/* Hero */}
        <header className="bg-white rounded-2xl border border-[var(--color-border-primary)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-navy via-brand-teal to-brand-teal-light" />
          <div className="p-6 md:p-10">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-4xl" aria-hidden="true">{cluster.icon}</span>
              <span className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal">
                MediportBD Topic Guide
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-semibold text-brand-navy mb-3">{cluster.title}</h1>
            {cluster.intro.map((para, i) => (
              <p key={i} className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mb-3">
                {para}
              </p>
            ))}
          </div>
        </header>

        {/* Price landing pages in this cluster */}
        {landingPages.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Prices & Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {landingPages.map(page => (
                <Link
                  key={page.slug}
                  href={`/equipment/${page.slug}`}
                  className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-brand-teal/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl" aria-hidden="true">{page.icon}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-brand-navy mb-1 leading-snug">{page.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{page.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products from the category */}
        {listing.products.length > 0 && (
          <section className="mt-8">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-navy">Featured Products</h2>
              {categoryName && (
                <Link
                  href={`/products/category/${cluster.categorySlug}`}
                  className="text-xs font-semibold text-brand-teal hover:underline"
                >
                  View all {categoryName} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {listing.products.slice(0, 8).map(product => (
                <ProductCard key={product._id || product.id} product={product} showCategory />
              ))}
            </div>
          </section>
        )}

        {/* Brand links — pass hub authority to brand pages */}
        {brands.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Leading Brands</h2>
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

        {/* Related guides */}
        {guides.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">Buying Guides & Comparisons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-brand-teal/50 hover:shadow-md transition-all"
                >
                  <p className="text-xs text-brand-teal font-semibold uppercase tracking-wider mb-1">
                    {guide.type === 'compare' ? 'Comparison' : 'Guide'}
                  </p>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 leading-snug">{guide.title}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">{guide.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related clusters — internal linking */}
        <section className="mt-8 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Related Topics</h2>
          <div className="flex flex-wrap gap-2">
            {TOPICAL_CLUSTERS
              .filter(c => c.slug !== cluster.slug)
              .map(c => (
                <Link
                  key={c.slug}
                  href={`/topics/${c.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
                >
                  <span aria-hidden="true">{c.icon}</span> {c.title}
                </Link>
              ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-brand-navy text-white p-6 md:p-8 text-center">
          <h2 className="text-lg md:text-xl font-semibold mb-2">
            Need expert advice on {cluster.title.toLowerCase()}?
          </h2>
          <p className="text-sm text-white/70 mb-4 max-w-2xl mx-auto">
            Our Dhaka-based medical equipment team provides free advice, quotations and B2B pricing for hospitals, clinics and diagnostic centres.
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
          </div>
        </div>
      </div>
    </div>
  );
}