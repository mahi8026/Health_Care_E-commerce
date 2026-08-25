import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { TOPICAL_CLUSTERS } from '@/config/topicalClusters';

export const revalidate = 3600;

export const metadata = {
  title: 'Medical Equipment Topics & Buying Guides in Bangladesh | MediportBD',
  description:
    'Explore MediportBD topic hubs — ECG machines, blood pressure monitors, ultrasound, surgical instruments, laboratory equipment, hospital ICU equipment and diabetes care with prices, brands and buying guidance in Bangladesh.',
  keywords:
    'medical equipment topics Bangladesh, ECG machines BD, BP monitors Bangladesh, ultrasound machines Bangladesh, surgical instruments BD, ICU equipment Bangladesh, diabetes care BD',
  alternates: { canonical: `${SITE_CONFIG.url}/topics` },
  openGraph: {
    title: 'Medical Equipment Topics & Buying Guides in Bangladesh | MediportBD',
    description: 'Topic hubs with prices, brands and buying guidance for medical equipment in Bangladesh.',
    url: `${SITE_CONFIG.url}/topics`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function TopicsHub() {
  return (
    <div className="min-h-screen bg-page">
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            MediportBD Topic Hubs
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Medical Equipment Topics in Bangladesh
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Complete topic hubs combining prices, brands, buying guides and product collections —
            everything you need to make informed medical equipment purchases in Bangladesh.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICAL_CLUSTERS.map(cluster => (
            <Link
              key={cluster.slug}
              href={`/topics/${cluster.slug}`}
              className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-brand-teal/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl" aria-hidden="true">{cluster.icon}</span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-brand-navy mb-1 leading-snug">{cluster.title}</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                    {cluster.metaDescription}
                  </p>
                  <p className="text-xs text-brand-teal font-semibold mt-2">
                    {cluster.landingSlugs.length} price guides · {cluster.guideSlugs.length} guides →
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">
            Browse the Full Equipment Price Directory
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/equipment"
              className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
            >
              All Equipment Prices
            </Link>
            <Link
              href="/guides"
              className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
            >
              All Buying Guides
            </Link>
            <Link
              href="/brands"
              className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
            >
              Brand Directory
            </Link>
            <Link
              href="/products"
              className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
            >
              All Products
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}