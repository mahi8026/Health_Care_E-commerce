import Link from 'next/link';
import B2BDashboardPage from '@/views/B2BDashboardPage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import B2BFAQs from '@/components/seo/B2BFAQs';

export const dynamic = 'force-dynamic';

/**
 * B2B page is publicly crawlable — do NOT noindex.
 * It's a marketing landing page for B2B buyers, not a private dashboard.
 */
export const metadata = {
  title:       PAGE_SEO.b2b.title,
  description: PAGE_SEO.b2b.description,
  keywords:    PAGE_SEO.b2b.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/b2b` },
  openGraph: {
    title:       PAGE_SEO.b2b.title,
    description: PAGE_SEO.b2b.description,
    url:         `${SITE_CONFIG.url}/b2b`,
    images: [{
      url: `${SITE_CONFIG.url}/og?title=B2B+Medical+Supply+Bangladesh&subtitle=Bulk+Discounts+%E2%80%A2+Credit+Terms+%E2%80%A2+Dedicated+Account+Manager&page=B2B+Portal`,
      width: 1200, height: 630,
      alt: 'B2B Medical Equipment Supplier Bangladesh — MediportBD',
    }],
  },
};

export default function B2B() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'B2B Portal', url: `${SITE_CONFIG.url}/b2b` },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'B2B Medical Equipment Supply Bangladesh',
    description: 'Bulk medical equipment supply for hospitals, clinics and diagnostic centres in Bangladesh with 8–30% discounts and 30–90 day credit terms.',
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.url,
    },
    areaServed: { '@type': 'Country', name: 'Bangladesh' },
    url: `${SITE_CONFIG.url}/b2b`,
  };

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData schema={serviceSchema} />
      <B2BFAQs />
      <B2BDashboardPage />

      {/* Server-rendered internal link section — Googlebot follows these even
          though B2BDashboardPage is force-dynamic and client-rendered */}
      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Top Product Categories
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/products/category/diagnostic-equipment" className="text-xs text-[var(--color-brand-teal)] hover:underline">Diagnostic Equipment</Link></li>
                <li><Link href="/products/category/surgical-instruments" className="text-xs text-[var(--color-brand-teal)] hover:underline">Surgical Instruments</Link></li>
                <li><Link href="/reagent-store" className="text-xs text-[var(--color-brand-teal)] hover:underline">Laboratory Reagents</Link></li>
                <li><Link href="/products/category/hospital-machines" className="text-xs text-[var(--color-brand-teal)] hover:underline">Hospital Machines</Link></li>
                <li><Link href="/products/category/consumables" className="text-xs text-[var(--color-brand-teal)] hover:underline">Consumables</Link></li>
                <li><Link href="/products" className="text-xs font-semibold text-[var(--color-brand-teal)] hover:underline">All Products →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Price Guides for Hospitals
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/equipment/ecg-machine-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">ECG Machine Prices 2026</Link></li>
                <li><Link href="/equipment/patient-monitor-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">Patient Monitor Prices</Link></li>
                <li><Link href="/equipment/ventilator-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">Ventilator Prices</Link></li>
                <li><Link href="/equipment/infusion-pump-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">Infusion Pump Prices</Link></li>
                <li><Link href="/equipment/surgical-instruments-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">Surgical Instruments Prices</Link></li>
                <li><Link href="/equipment" className="text-xs font-semibold text-[var(--color-brand-teal)] hover:underline">All Price Guides →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Compliance &amp; Guides
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/dgda-info" className="text-xs text-[var(--color-brand-teal)] hover:underline">DGDA Compliance</Link></li>
                <li><Link href="/certifications" className="text-xs text-[var(--color-brand-teal)] hover:underline">Certifications</Link></li>
                <li><Link href="/guides/b2b-medical-procurement-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">B2B Procurement Guide</Link></li>
                <li><Link href="/guides/medical-equipment-bangladesh-guide" className="text-xs text-[var(--color-brand-teal)] hover:underline">Equipment Buying Guide</Link></li>
                <li><Link href="/topics/hospital-icu-equipment" className="text-xs text-[var(--color-brand-teal)] hover:underline">Hospital &amp; ICU Equipment</Link></li>
                <li><Link href="/brands" className="text-xs font-semibold text-[var(--color-brand-teal)] hover:underline">Brand Directory →</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
