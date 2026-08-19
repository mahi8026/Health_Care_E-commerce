import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { LANDING_PAGES } from '@/config/landingPages';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';

export const revalidate = 3600;

export const metadata = {
  title: 'Medical Equipment Prices in Bangladesh 2026 | MediportBD',
  description:
    'Live medical equipment prices in Bangladesh — ECG machines, patient monitors, ultrasound, X-ray, autoclaves, nebulizers and more with DGDA certification, warranty and B2B pricing from MediportBD.',
  keywords:
    'medical equipment price Bangladesh, ECG machine price BD, patient monitor price Bangladesh, ultrasound price in Bangladesh, autoclave price, nebulizer price, glucose meter price BD',
  alternates: { canonical: `${SITE_CONFIG.url}/equipment` },
  openGraph: {
    title: 'Medical Equipment Prices in Bangladesh 2026 | MediportBD',
    description: 'Live prices and buying guides for medical equipment in Bangladesh.',
    url: `${SITE_CONFIG.url}/equipment`,
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

export default function EquipmentHub() {
  return (
    <div className="min-h-screen bg-page">
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            MediportBD Price Directory
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Medical Equipment Prices in Bangladesh
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Live prices for the most-searched medical equipment in Bangladesh — updated from our DGDA-registered catalog with genuine warranty, installation and B2B pricing.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDING_PAGES.map(page => {
            const categoryName = CATEGORY_SLUG_MAP[page.categorySlug];
            return (
              <Link
                key={page.slug}
                href={`/equipment/${page.slug}`}
                className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-brand-teal/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden="true">{page.icon}</span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-brand-navy mb-1 leading-snug">{page.title}</h2>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                      {categoryName || 'Medical Equipment'}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                      {page.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">
            Shop by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_SLUG_MAP).slice(0, 12).map(([slug, name]) => (
              <Link
                key={slug}
                href={`/products/category/${slug}`}
                className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-lg font-semibold text-brand-navy mb-2">
            Explore by Topic
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            In-depth topic hubs combining prices, brands, buying guides and product collections.
          </p>
          <Link
            href="/topics"
            className="text-sm font-semibold text-brand-teal hover:underline"
          >
            Browse all topic hubs →
          </Link>
        </section>
      </div>
    </div>
  );
}