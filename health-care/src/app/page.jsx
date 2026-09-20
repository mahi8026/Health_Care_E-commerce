import Link from 'next/link';
import HomePage from '@/views/HomePage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import HomepageFAQs from '@/components/seo/HomepageFAQs';

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
              As Bangladesh&apos;s most trusted medical equipment supplier since 2020, MediportBD has been supplying hospitals, 
              diagnostic centers, clinics and healthcare professionals across all 64 districts with premium quality diagnostic devices, 
              surgical instruments, laboratory reagents and hospital machines from the world&apos;s leading brands.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                🏥 DGDA-Registered Supplier &amp; ISO 13485-Certified Brands
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Products in our 600+ item catalog are sourced from leading global manufacturers, with DGDA registration details and conformity documents available on request, meeting Bangladesh regulatory standards 
                and international quality benchmarks. We supply products from manufacturers certified to ISO 13485 for medical device quality management.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                🚚 Same-Day Delivery in Dhaka Metro
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Orders placed before 12 PM receive same-day dispatch in Dhaka metro area. Free delivery on orders over ৳50,000. 
                Nationwide courier service ensures your medical equipment reaches any district within 2-5 business days.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                💰 B2B Bulk Pricing &amp; Credit Terms
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Save 8-30% on bulk orders for hospitals and diagnostic centers. B2B clients enjoy 30-90 day credit terms, 
                dedicated account managers, priority processing and customized quotations for government tenders and large projects.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                🔧 Free Installation &amp; Training
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Professional installation and comprehensive staff training included free with all diagnostic equipment purchases 
                in Dhaka metro area. Our certified technicians ensure proper setup, calibration and operation guidance.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                ❄️ Cold Chain for Laboratory Reagents
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                All laboratory reagents from Roche, Abbott, Siemens and bioMérieux are stored at 2-8°C or -20°C as required 
                and delivered with temperature-monitored cold chain management to preserve accuracy and shelf life.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-[var(--color-border-primary)]">
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)] mb-2">
                📞 Technical Support Team
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Technical support team available via phone, WhatsApp and email (Sat–Thu, 9am–6pm). B2B clients receive priority 
                support with dedicated account managers and service contracts for preventive maintenance.
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[var(--color-brand-teal-tint)] to-white rounded-lg p-6 border border-[var(--color-brand-teal)]">
            <h3 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">
              Serving Bangladesh Healthcare Since 2020
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
              MediportBD stocks the complete range of medical equipment needed by hospitals, clinics, diagnostic centers, 
              pathology labs and healthcare facilities across Bangladesh. From simple diagnostic tools like blood pressure 
              monitors and thermometers to advanced equipment like ECG machines, patient monitors, ultrasound systems, 
              hematology analyzers and ventilators — we supply genuine products from Siemens Healthineers, GE Healthcare, 
              Philips, Mindray, Roche Diagnostics, Abbott Laboratories, Omron, Rossmax, Beurer and 40+ other trusted manufacturers.
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Whether you need surgical instruments for your operating theatre, HbA1c and biochemistry reagents for your 
              diagnostic lab, or PPE supplies for infection control — MediportBD is your single-source partner for quality, 
              compliance and reliable service. Browse our catalog, request a B2B quote, or call +880 1646-886795 to speak 
              with our medical equipment specialists today.
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
