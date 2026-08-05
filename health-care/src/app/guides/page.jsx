import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { GUIDES, PILLAR_GUIDE, GUIDE_AUTHOR } from '@/config/guides';
import StructuredData from '@/utils/structuredData';

export const metadata = {
  title: 'Medical Equipment Guides & Comparisons Bangladesh 2026 | MediportBD',
  description:
    'Expert medical equipment guides for Bangladesh: ECG machine prices, BP monitor buying guide, DGDA registration explained, laboratory reagents and hospital equipment — written by MediportBD\u2019s clinical team.',
  keywords: 'medical equipment guide Bangladesh, ECG machine price BD, BP monitor buying guide, DGDA registration, laboratory reagents guide, hospital equipment Bangladesh',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://MediportBD.com'}/guides` },
  openGraph: {
    title: 'Medical Equipment Guides & Comparisons Bangladesh 2026 | MediportBD',
    description: 'Expert buying guides and brand comparisons for medical equipment in Bangladesh.',
    url: `${SITE_CONFIG.url}/guides`,
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

const CATEGORY_LABELS = {
  pillar: 'Pillar Guides',
  guide: 'Buying Guides',
  compare: 'Comparisons & Price Guides',
  explainer: 'Regulatory Guides',
};

const ORDER = { pillar: 0, guide: 1, compare: 2, explainer: 3 };

export default function GuidesHub() {
  const grouped = GUIDES
    .slice()
    .sort((a, b) => ORDER[a.type] - ORDER[b.type]);

  const byType = grouped.reduce((acc, g) => {
    (acc[g.type] = acc[g.type] || []).push(g);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-page">
      {/* Article schema for the pillar content */}
      {PILLAR_GUIDE && (
        <StructuredData
          schema={{
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: PILLAR_GUIDE.title,
            description: PILLAR_GUIDE.metaDescription,
            datePublished: PILLAR_GUIDE.updatedAt,
            dateModified: PILLAR_GUIDE.updatedAt,
            mainEntityOfPage: `${SITE_CONFIG.url}/guides`,
            author: {
              '@type': 'Person',
              name: GUIDE_AUTHOR.name,
              jobTitle: 'Founder & Managing Director',
              worksFor: { '@type': 'Organization', name: SITE_CONFIG.fullName },
            },
            publisher: {
              '@type': 'Organization',
              name: SITE_CONFIG.fullName,
              logo: { '@type': 'ImageObject', url: `${SITE_CONFIG.url}/Mediport_Logo.png` },
            },
            inLanguage: 'en-BD',
          }}
        />
      )}

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            MediportBD Knowledge Hub
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Medical Equipment Guides for Bangladesh
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Independent, practical buying guides written by our clinical equipment team —
            DGDA rules, 2026 price ranges, brand comparisons and procurement tips for
            hospitals, clinics and diagnostic centres across Bangladesh.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {/* Pillar guide featured */}
        {PILLAR_GUIDE && (
          <Link
            href={`/guides/${PILLAR_GUIDE.slug}`}
            className="block rounded-2xl border-2 border-[var(--color-brand-teal)] bg-[var(--color-status-success-tint)] p-6 mb-10 hover:shadow-lg transition-shadow"
          >
            <span className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-brand-teal)]">
              Start here — Pillar Guide
            </span>
            <h2 className="text-xl font-semibold text-[var(--color-brand-navy)] mt-1 mb-2">
              {PILLAR_GUIDE.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-3">
              {PILLAR_GUIDE.quickAnswer}
            </p>
            <span className="text-sm font-semibold text-[var(--color-brand-teal)]">Read the full guide →</span>
          </Link>
        )}

        {/* Grouped lists */}
        {Object.entries(byType)
          .filter(([, guides]) => guides.length > 0)
          .map(([type, guides]) => (
            <section key={type} className="mb-12">
              <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-4">
                {CATEGORY_LABELS[type] || 'Guides'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map(guide => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-[var(--color-brand-teal)] hover:shadow-md transition-all"
                  >
                    <p className="text-xs text-[var(--color-brand-teal)] font-semibold uppercase tracking-wider mb-1">
                      {guide.type === 'compare' ? 'Price & Comparison' : guide.type === 'explainer' ? 'DGDA & Compliance' : 'Buying Guide'}
                    </p>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {guide.excerpt}
                    </p>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-3">
                      Updated {guide.updatedAt} · {guide.readMinutes} min read
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}

        {/* Category quick links — internal linking */}
        <section className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-4">
            Browse by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/products/category/diagnostic-equipment" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">Diagnostic Equipment</Link>
            <Link href="/products/category/surgical-instruments" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">Surgical Instruments</Link>
            <Link href="/reagent-store" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">Laboratory Reagents</Link>
            <Link href="/products/category/hospital-machines" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">Hospital Machines</Link>
            <Link href="/products/category/laboratory-equipment" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">Laboratory Equipment</Link>
            <Link href="/dgda-info" className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors">DGDA Compliance</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
