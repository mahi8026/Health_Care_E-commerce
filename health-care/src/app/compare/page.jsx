import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { COMPARISON_GUIDES } from '@/config/guides';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Medical Equipment Comparisons & Price Guides Bangladesh',
  description:
    'Side-by-side medical equipment comparisons for Bangladesh: ECG machine brands, BP monitors, HbA1c reagents — with 2026 price ranges, spec tables and clear recommendations.',
  keywords: 'medical equipment comparison Bangladesh, ECG machine brand comparison, BP monitor comparison, HbA1c reagent comparison, medical equipment price BD',
  alternates: { canonical: `${SITE_CONFIG.url}/compare` },
  openGraph: {
    title: 'Medical Equipment Comparisons & Price Guides Bangladesh',
    description: 'Brand-by-brand comparisons and 2026 price guides for medical equipment in Bangladesh.',
    url: `${SITE_CONFIG.url}/compare`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function CompareHub() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Comparisons', url: `${SITE_CONFIG.url}/compare` },
  ];

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Medical Equipment Comparisons in Bangladesh',
    description: 'Side-by-side medical equipment brand comparisons with 2026 price ranges for the Bangladesh market.',
    url: `${SITE_CONFIG.url}/compare`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: COMPARISON_GUIDES.length,
      itemListElement: COMPARISON_GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Article',
          name: g.title,
          url: `${SITE_CONFIG.url}/guides/${g.slug}`,
          description: g.excerpt,
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-page">
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData schema={collectionSchema} />
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            Brand vs Brand
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Medical Equipment Comparisons in Bangladesh
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            We compare medical equipment brands head-to-head for the Bangladesh market —
            with 2026 price ranges, specification tables and a clear recommendation
            for your setting (GP chamber, clinic, hospital or diagnostic centre).
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {COMPARISON_GUIDES.map(guide => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-6 mb-4 hover:border-[var(--color-brand-teal)] hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {guide.title}
              </h2>
              <span className="text-xs text-[var(--color-text-tertiary)] whitespace-nowrap">Updated {guide.updatedAt}</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-3">
              {guide.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-brand-teal)]">View comparison →</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">{guide.readMinutes} min read</span>
            </div>
          </Link>
        ))}

        <p className="text-xs text-[var(--color-text-secondary)] mt-6 leading-relaxed">
          Prices shown are indicative 2026 Bangladesh market ranges and change with import duties and
          currency movement. Request a written quotation for current pricing and B2B discounts.
        </p>

        {/* Internal links — equipment price pages + category pages */}
        <section className="mt-8 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
            Live Price Guides
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <Link href="/equipment/ecg-machine-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">ECG Machine Prices</Link>
            <Link href="/equipment/blood-pressure-monitor-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">BP Monitor Prices</Link>
            <Link href="/equipment/ultrasound-machine-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Ultrasound Prices</Link>
            <Link href="/equipment/glucose-meter-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Glucose Meter Prices</Link>
            <Link href="/equipment" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline px-3 py-1.5">All Price Guides →</Link>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            <Link href="/guides" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">All Buying Guides</Link>
            <Link href="/topics" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">Topic Hubs</Link>
            <Link href="/brands" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">Brand Directory</Link>
            <Link href="/products" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">All Products</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
