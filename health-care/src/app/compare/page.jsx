import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { COMPARISON_GUIDES } from '@/config/guides';

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
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

export default function CompareHub() {
  return (
    <div className="min-h-screen bg-page">
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
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] whitespace-nowrap">Updated {guide.updatedAt}</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-3">
              {guide.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-brand-teal)]">View comparison →</span>
              <span className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{guide.readMinutes} min read</span>
            </div>
          </Link>
        ))}

        <p className="text-xs text-[var(--color-text-secondary)] mt-6 leading-relaxed">
          Prices shown are indicative 2026 Bangladesh market ranges and change with import duties and
          currency movement. Request a written quotation for current pricing and B2B discounts.
        </p>
      </div>
    </div>
  );
}
