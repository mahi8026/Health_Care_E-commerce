import Link from 'next/link';
import HomePage from '@/views/HomePage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import HomepageFAQs from '@/components/seo/HomepageFAQs';
import { LANDING_PAGES } from '@/config/landingPages';
import QuoteCtaLink from '@/components/conversion/QuoteCtaLink';

export const metadata = {
  title:       PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords:    PAGE_SEO.home.keywords,
  alternates:  { canonical: SITE_CONFIG.url },
  openGraph: {
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url:         SITE_CONFIG.url,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png?v=2026`, width: 1200, height: 630, alt: 'MediportBD — Bangladesh Medical Equipment Supplier' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    images:      [`${SITE_CONFIG.url}/og-default.png`],
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://health-care-e-commerce-ubyy.onrender.com/api';

/**
 * Equipment price-guide links (P-01).
 *
 * The 13 /equipment/<slug> landing pages are the site's highest commercial-intent
 * pages, but the homepage previously rendered zero links to them (audit finding
 * P-01), leaving them dependent on sitemap discovery only.
 *
 * Labels are derived from the landing-page config so this stays a single source
 * of truth — adding a landing page automatically adds it here. The brand suffix
 * and the "Price in Bangladesh 2026" tail are stripped to keep anchor text
 * natural and non-repetitive.
 */
const equipmentLinks = (Array.isArray(LANDING_PAGES) ? LANDING_PAGES : [])
  .filter((p) => p && p.slug)
  .map((p) => {
    const subject = String(p.title || p.slug)
      .replace(/\s*\|\s*MediportBD\s*$/i, '')
      .replace(/\s*Price in Bangladesh(\s*20\d\d)?\s*$/i, '')
      .trim();
    return { slug: p.slug, label: `${subject} price guide` };
  });

/**
 * Fetch home data + settings server-side with ISR (5-min revalidation).
 * Failure-safe: any error returns null and HomePage falls back to its own
 * client-side fetch — the page never blocks on the backend.
 */
async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Homepage — Server Component.
 * Home data + settings fetched server-side (ISR) so the initial HTML contains
 * the full home content (hero slides, categories, featured, stats); HomePage
 * seeds its state from these props and skips its own client fetch.
 * Schema injected server-side; server-rendered guide band below links to the
 * /guides content hub (topical authority + internal linking).
 */
export default async function Home() {
  const [homeRes, settingsRes] = await Promise.all([
    fetchJson(`${API_BASE}/home/data`),
    fetchJson(`${API_BASE}/settings`),
  ]);
  const homeData = homeRes?.success ? homeRes.data : null;
  const settings = settingsRes?.data || null;

  // Below-fold product payloads (featured/newArrivals/testimonials) are no
  // longer rendered at load — they mount on scroll. Keep the ISR HTML small
  // by shipping only the above-fold data; HomePage fetches the rest client-side.
  const initialData = homeData ? {
    categories: homeData.categories,
    categoryCounts: homeData.categoryCounts,
    stats: homeData.stats,
    activePromo: homeData.activePromo,
  } : null;

  return (
    <>
      {/* Organization/WebSite schema is rendered globally in layout.jsx —
          do not duplicate it per page. */}
      
      {/* FAQ Schema for "People Also Ask" feature in Google search results */}
      <HomepageFAQs />
      
      <HomePage initialData={initialData} initialSettings={settings} />

      {/* Why Choose MediportBD - Rich content section for SEO */}
      <section className="bg-[var(--color-background-secondary)] border-t border-[var(--color-border-primary)] py-10 px-4">
        <div className="max-w-[var(--container-width)] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-navy)] mb-3">
              Why Choose MediportBD for Medical Equipment in Bangladesh?
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
              As Bangladesh&apos;s medical equipment supplier since 2020, MediportBD has been supplying hospitals, 
              diagnostic centers, clinics and healthcare professionals with diagnostic devices, 
              surgical instruments, laboratory reagents and hospital machines from the world&apos;s leading brands.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                🏥 Brands We Supply
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Products in our 600+ item catalog are sourced from leading global manufacturers, with DGDA registration details and conformity documents available on request.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                🚚 Free Delivery on Orders over ৳50,000
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Free delivery nationwide on orders over ৳50,000. We confirm delivery details in your quotation.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                💰 B2B and Volume Pricing
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                B2B and volume pricing on request; written quotations on request.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                📞 Technical Support Team
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Technical support is available via phone, WhatsApp and email.
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[var(--color-brand-teal-tint)] to-white rounded-lg p-6 border border-[var(--color-brand-teal)]">
            <h3 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">
              Serving Bangladesh Healthcare Since 2020
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
              MediportBD supplies medical equipment to hospitals, clinics, diagnostic centers, 
              pathology labs and healthcare facilities across Bangladesh. From simple diagnostic tools like blood pressure 
              monitors and thermometers to advanced equipment like ECG machines, patient monitors, ultrasound systems, 
              hematology analyzers and ventilators — we supply products from Siemens Healthineers, GE Healthcare, 
              Philips, Mindray, Roche Diagnostics, Abbott Laboratories, Omron, Rossmax, Beurer and 40+ other trusted manufacturers.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Whether you need surgical instruments for your operating theatre, HbA1c and biochemistry reagents for your 
              diagnostic lab, or PPE supplies for infection control — browse our catalog, request a B2B quote, or call 
              +880 1646-886795 to speak 
              with our team.
            </p>
          </div>
        </div>
      </section>

      {/* Server-rendered SEO content band — answer-first + internal links */}
      <section className="bg-white border-t border-[var(--color-border-primary)] py-12 px-4">
        <div className="max-w-[var(--container-width)] mx-auto">
          <div className="rounded-2xl border border-[var(--color-brand-teal)] bg-[var(--color-status-success-tint)] p-6 mb-8">
            <p className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-brand-teal)] mb-2">
              Quick Answer
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              MediportBD supplies diagnostic devices, surgical instruments, laboratory
              reagents and hospital machines to hospitals and clinics in Bangladesh.
              Products from DGDA-registered importers and manufacturers. Request a
              quotation for B2B pricing.
            </p>
            <div className="mt-4">
              <QuoteCtaLink
                href="/quotes/request?source=home"
                source="home"
                pageType="home"
                className="bg-[var(--color-brand-teal)] text-white hover:bg-[var(--color-brand-teal-hover)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Medical Equipment in Bangladesh
              </h2>
              <ul className="space-y-2">
                <li><Link prefetch={false} href="/guides/medical-equipment-bangladesh-guide" className="text-sm text-[var(--color-brand-teal)] hover:underline">Complete 2026 buying guide →</Link></li>
                <li><Link prefetch={false} href="/guides/diagnostic-equipment-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Diagnostic equipment for clinics →</Link></li>
                <li><Link prefetch={false} href="/guides/hospital-equipment-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Hospital & ICU equipment →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Prices & Comparisons
              </h2>
              <ul className="space-y-2">
                <li><Link prefetch={false} href="/guides/ecg-machine-price-bangladesh-2026" className="text-sm text-[var(--color-brand-teal)] hover:underline">ECG machine prices 2026 →</Link></li>
                <li><Link prefetch={false} href="/guides/bp-monitor-buying-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">BP monitor buying guide →</Link></li>
                <li><Link prefetch={false} href="/guides/laboratory-reagents-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Laboratory reagents guide →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Compliance & B2B
              </h2>
              <ul className="space-y-2">
                <li><Link prefetch={false} href="/guides/dgda-registration-explained" className="text-sm text-[var(--color-brand-teal)] hover:underline">DGDA registration explained →</Link></li>
                <li><Link prefetch={false} href="/guides/surgical-instruments-guide-bangladesh" className="text-sm text-[var(--color-brand-teal)] hover:underline">Surgical instruments guide →</Link></li>
                <li><Link prefetch={false} href="/compare" className="text-sm text-[var(--color-brand-teal)] hover:underline">All comparisons →</Link></li>
                <li><Link prefetch={false} href="/brands" className="text-sm text-[var(--color-brand-teal)] hover:underline">Browse all brands →</Link></li>
              </ul>
            </div>
          </div>

          {/* Equipment price guides (P-01) — homepage links to the 13
              commercial-intent /equipment/ landing pages. */}
          {equipmentLinks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--color-border-primary)]">
              <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
                Medical Equipment Price Guides
              </h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {equipmentLinks.map((item) => (
                  <li key={item.slug}>
                    <Link
                      prefetch={false}
                      href={`/equipment/${item.slug}`}
                      className="text-sm text-[var(--color-brand-teal)] hover:underline"
                    >
                      {item.label} →
                    </Link>
                  </li>
                ))}
                <li>
                  <Link prefetch={false} href="/equipment" className="text-sm text-[var(--color-brand-teal)] hover:underline">
                    All equipment price guides →
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
