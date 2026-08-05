import Link from 'next/link';
import HomePage from '@/views/HomePage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import StructuredData, {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/structuredData';

export const metadata = {
  title:       PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords:    PAGE_SEO.home.keywords,
  alternates:  { canonical: SITE_CONFIG.url },
  openGraph: {
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url:         SITE_CONFIG.url,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'MediportBD — Bangladesh Medical Equipment Supplier' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    images:      ['/og-default.png'],
  },
};

/**
 * Homepage — Server Component.
 * Schema injected server-side; data fetched client-side via HomePage.
 * Server-rendered guide band below links to the /guides content hub
 * (topical authority + internal linking from the highest-authority page).
 */
export default function Home() {
  return (
    <>
      <StructuredData schema={generateOrganizationSchema()} />
      <StructuredData schema={generateWebSiteSchema()} />
      <HomePage />

      {/* Server-rendered SEO content band — answer-first + internal links */}
      <section className="bg-white border-t border-[var(--color-border-primary)] py-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="rounded-2xl border border-[var(--color-brand-teal)] bg-[var(--color-status-success-tint)] p-6 mb-8">
            <p className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-brand-teal)] mb-2">
              Quick Answer
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              MediportBD is a DGDA-registered medical equipment supplier based in Dhaka,
              Bangladesh, offering diagnostic devices, surgical instruments, laboratory
              reagents and hospital machines to hospitals and clinics nationwide — with
              B2B bulk pricing, cold-chain delivery and free installation on equipment
              in Dhaka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Medical Equipment in Bangladesh
              </h2>
              <ul className="space-y-2">
                <li><Link href="/guides/medical-equipment-bangladesh-guide" className="text-sm text-[var(--color-brand-teal)] hover:underline">Complete 2026 buying guide →</Link></li>
                <li><Link href="/guides/diagnostic-equipment-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Diagnostic equipment for clinics →</Link></li>
                <li><Link href="/guides/hospital-equipment-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Hospital & ICU equipment →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Prices & Comparisons
              </h2>
              <ul className="space-y-2">
                <li><Link href="/guides/ecg-machine-price-bangladesh-2026" className="text-sm text-[var(--color-brand-teal)] hover:underline">ECG machine prices 2026 →</Link></li>
                <li><Link href="/guides/bp-monitor-buying-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">BP monitor buying guide →</Link></li>
                <li><Link href="/guides/laboratory-reagents-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Laboratory reagents & cold chain →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Compliance & B2B
              </h2>
              <ul className="space-y-2">
                <li><Link href="/guides/dgda-registration-explained" className="text-sm text-[var(--color-brand-teal)] hover:underline">DGDA registration explained →</Link></li>
                <li><Link href="/guides/surgical-instruments-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Surgical instruments guide →</Link></li>
                <li><Link href="/compare" className="text-sm text-[var(--color-brand-teal)] hover:underline">All comparisons →</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
