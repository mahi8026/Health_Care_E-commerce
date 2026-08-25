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

export async function generateStaticParams() {
  return TOPICAL_CLUSTERS.map(c => ({ slug: c.slug }));
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
      images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630, alt: cluster.title }],
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

  const otherClusters = TOPICAL_CLUSTERS.filter(c => c.slug !== cluster.slug);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0b2545 0%, #0d3162 60%, #0b7a60 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-white/50">
            <Link href="/" className="hover:text-teal-300 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/topics" className="hover:text-teal-300 transition-colors">Topics</Link>
            <span>/</span>
            <span className="text-white/80">{cluster.title}</span>
          </nav>

          <div className="flex items-start gap-5 max-w-4xl">
            {/* Icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl md:text-5xl flex-shrink-0 shadow-xl">
              {cluster.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-300">
                  MediportBD Topic Guide
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">
                {cluster.title}
              </h1>
              <p className="text-sm md:text-base text-white/65 leading-relaxed max-w-2xl mb-4">
                {cluster.intro[0]}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                {landingPages.length > 0 && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {landingPages.length} price guides
                  </div>
                )}
                {guides.length > 0 && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {guides.length} buying guides
                  </div>
                )}
                {listing.products.length > 0 && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {listing.products.length}+ products
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* Extended intro paragraph(s) */}
        {cluster.intro.length > 1 && (
          <div className="rounded-2xl bg-white border border-[#cfe0ec] p-5 md:p-7">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">Overview</h2>
            {cluster.intro.slice(1).map((para, i) => (
              <p key={i} className="text-sm text-[#475569] leading-relaxed mb-3 last:mb-0">{para}</p>
            ))}
          </div>
        )}

        {/* Price landing pages */}
        {landingPages.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#0b2545]">Prices &amp; Specifications</h2>
              <Link href="/equipment" className="text-xs font-semibold text-[#0b7a60] hover:underline">
                All price guides →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {landingPages.map(page => (
                <Link
                  key={page.slug}
                  href={`/equipment/${page.slug}`}
                  className="group flex items-start gap-4 rounded-2xl bg-white border border-[#cfe0ec] p-5 hover:border-[#0b7a60]/50 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {page.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#0b2545] mb-1 leading-snug group-hover:text-[#0b7a60] transition-colors">{page.title}</h3>
                    <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">{page.excerpt}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#0b7a60]">
                      View prices
                      <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        {listing.products.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0b2545]">Featured Products</h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">Genuine, DGDA-registered stock ready to ship</p>
              </div>
              {categoryName && (
                <Link
                  href={`/products/category/${cluster.categorySlug}`}
                  className="text-xs font-semibold text-[#0b7a60] hover:underline"
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

        {/* Brands + Guides side by side on desktop */}
        {(brands.length > 0 || guides.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Leading brands */}
            {brands.length > 0 && (
              <section className="rounded-2xl bg-white border border-[#cfe0ec] p-5">
                <h2 className="text-sm font-bold text-[#0b2545] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#0b2545]/8 flex items-center justify-center text-base">🏷️</span>
                  Leading Brands
                </h2>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/brands/${b.slug}`}
                      className="inline-flex items-center text-xs font-semibold text-[#0b7a60] border border-[#0b7a60]/30 rounded-lg px-3 py-1.5 hover:bg-[#0b7a60] hover:text-white transition-colors"
                    >
                      {b.name}
                    </Link>
                  ))}
                  <Link href="/brands" className="inline-flex items-center text-xs text-[#94a3b8] hover:text-[#0b7a60] px-2 py-1.5 transition-colors">
                    All brands →
                  </Link>
                </div>
              </section>
            )}

            {/* Guides */}
            {guides.length > 0 && (
              <section className="rounded-2xl bg-white border border-[#cfe0ec] p-5">
                <h2 className="text-sm font-bold text-[#0b2545] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#0b2545]/8 flex items-center justify-center text-base">📖</span>
                  Buying Guides
                </h2>
                <div className="space-y-2">
                  {guides.map(guide => (
                    <Link
                      key={guide.slug}
                      href={`/guides/${guide.slug}`}
                      className="group flex items-start gap-2.5 rounded-xl border border-[#e2e8f0] p-3 hover:border-[#0b7a60]/40 hover:bg-[#f8fffe] transition-all"
                    >
                      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] w-16 flex-shrink-0">
                        {guide.type === 'compare' ? 'Compare' : 'Guide'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0b2545] leading-snug group-hover:text-[#0b7a60] transition-colors">{guide.title}</p>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5 line-clamp-1">{guide.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Related topics */}
        <section className="rounded-2xl bg-white border border-[#cfe0ec] p-5">
          <h2 className="text-sm font-bold text-[#0b2545] mb-3">Related Topics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherClusters.map(c => (
              <Link
                key={c.slug}
                href={`/topics/${c.slug}`}
                className="group flex items-center gap-2 rounded-xl border border-[#e2e8f0] p-3 hover:border-[#0b7a60]/40 hover:bg-[#f8fffe] transition-all"
              >
                <span className="text-lg">{c.icon}</span>
                <span className="text-xs font-medium text-[#475569] group-hover:text-[#0b7a60] leading-snug line-clamp-2 transition-colors">
                  {c.title.replace(/ in Bangladesh$/, '')}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div
          className="rounded-2xl text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-10"
          style={{ background: 'linear-gradient(135deg, #0b2545 0%, #0d3162 60%, #0b7a60 100%)' }}
        >
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-teal-300 mb-1">Free Expert Consultation</p>
            <h2 className="text-lg md:text-xl font-bold mb-2">
              Need help choosing {cluster.title.toLowerCase().replace(/ in bangladesh$/, '')}?
            </h2>
            <p className="text-sm text-white/60 max-w-xl">
              Our Dhaka-based team provides free advice, formal quotations, and B2B pricing for hospitals, clinics and diagnostic centres across Bangladesh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <Link
              href="/quotes/request"
              className="px-5 py-2.5 rounded-xl bg-[#0b7a60] text-white text-sm font-bold hover:bg-[#096450] transition-colors"
            >
              Request a Quote
            </Link>
            <Link
              href="/b2b"
              className="px-5 py-2.5 rounded-xl border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              B2B Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
