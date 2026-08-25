import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData from '@/utils/structuredData';

// ---------------------------------------------------------------------------
// Credentials — populated from env vars so real registration numbers can be
// dropped in without a code change. Never fabricate registration numbers;
// unverified fields render as "Available on request".
// ---------------------------------------------------------------------------
const REGISTRATION_NUMBER = process.env.NEXT_PUBLIC_DGDA_REGISTRATION_NUMBER || '';
const TRADE_LICENSE = process.env.NEXT_PUBLIC_TRADE_LICENSE || '';
const BIN_NUMBER = process.env.NEXT_PUBLIC_BIN_NUMBER || '';
const ISO_CERT = process.env.NEXT_PUBLIC_ISO_CERT_NUMBER || '';

export const metadata = {
  title: 'About MediportBD — Medical Equipment Supplier in Dhaka, Bangladesh',
  description:
    'Mediport Bangladesh Ltd. (MediportBD) is a DGDA-registered medical equipment supplier on Topkhana Road, Dhaka — serving hospitals, clinics and diagnostic centres across Bangladesh since 2020.',
  keywords: 'about MediportBD, medical equipment supplier Dhaka, DGDA registered supplier Bangladesh, Mediport Bangladesh Ltd, medical equipment company BD',
  alternates: { canonical: `${SITE_CONFIG.url}/about` },
  openGraph: {
    title: 'About MediportBD — Medical Equipment Supplier in Dhaka, Bangladesh',
    description:
      'Mediport Bangladesh Ltd. (MediportBD) — DGDA-registered medical equipment supplier in Dhaka, Bangladesh. ISO 13485 compliant. Serving hospitals and clinics nationwide.',
    url: `${SITE_CONFIG.url}/about`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About MediportBD — Medical Equipment Supplier in Dhaka',
    description: 'DGDA-registered medical equipment supplier in Dhaka, Bangladesh.',
  },
};

const STATS = [
  { value: '350+', label: 'Products in catalogue' },
  { value: '40+', label: 'Global brands supplied' },
  { value: '18+', label: 'Product categories' },
  { value: 'DGDA', label: 'Registered importer' },
];

const VALUES = [
  {
    title: 'Regulatory integrity first',
    desc: 'Every regulated product we sell is DGDA registered. Certificates are available to any customer on request — no exceptions.',
  },
  {
    title: 'Genuine products only',
    desc: 'We supply through manufacturer-authorised channels, which means authentic devices with real warranties and local service.',
  },
  {
    title: 'Service after the sale',
    desc: 'Free installation and staff training on equipment, 24/7 technical support, and AMC options keep your equipment running.',
  },
  {
    title: 'Transparent B2B pricing',
    desc: 'Institutional buyers get written quotations, 8–30% bulk discounts and 30–90 day credit terms with a dedicated account manager.',
  },
];

const CREDENTIALS = [
  {
    title: 'DGDA Registered',
    detail: REGISTRATION_NUMBER || 'Available on request',
    note: 'Directorate General of Drug Administration, Bangladesh — all regulated products carry DGDA registration.',
  },
  {
    title: 'ISO 13485 Compliant',
    detail: ISO_CERT || 'Available on request',
    note: 'Quality management for medical devices — certification documents available to institutional buyers.',
  },
  {
    title: 'Trade License',
    detail: TRADE_LICENSE || 'Available on request',
    note: 'Registered business operating from Topkhana Road, Dhaka.',
  },
  {
    title: 'BIN Registered',
    detail: BIN_NUMBER || 'Available on request',
    note: 'Business Identification Number — VAT compliant with the National Board of Revenue.',
  },
];

export default function AboutPage() {
  const address = `${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.city} ${SITE_CONFIG.address.postalCode}, ${SITE_CONFIG.address.country}`;
  const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="min-h-screen bg-page">
      {/* AboutPage JSON-LD */}
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About MediportBD',
          url: `${SITE_CONFIG.url}/about`,
          mainEntity: {
            '@type': 'Organization',
            name: 'Mediport Bangladesh Ltd.',
            url: SITE_CONFIG.url,
            email: SITE_CONFIG.email,
            telephone: SITE_CONFIG.phone,
            address: {
              '@type': 'PostalAddress',
              streetAddress: SITE_CONFIG.address.street,
              addressLocality: SITE_CONFIG.address.city,
              addressCountry: 'BD',
              postalCode: SITE_CONFIG.address.postalCode,
            },
          },
        }}
      />

      {/* Hero — answer-first for AI extraction */}
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            About Us
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Bangladesh&apos;s Trusted Medical Equipment Supplier Since 2020
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Mediport Bangladesh Ltd. (MediportBD) is a DGDA-registered medical equipment
            supplier based on Topkhana Road, Dhaka. We supply diagnostic equipment,
            surgical instruments, laboratory reagents and hospital machines to
            hospitals, clinics and diagnostic centres across Bangladesh — with genuine
            products, transparent B2B pricing and service after the sale.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--color-border-primary)] bg-white">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(stat => (
              <div key={stat.label}>
                <p className="text-2xl md:text-3xl font-bold text-[var(--color-brand-navy)]">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
            Who We Are
          </h2>
          <p className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)] mb-4">
            MediportBD was founded in 2020 to close a gap Bangladesh hospitals and clinics
            face every day: sourcing genuine, properly registered medical equipment without
            the risk of grey-market imports. From our office at Azad Tower, Topkhana Road —
            beside BMA Bhaban, Dhaka — we manage the entire chain: DGDA-registered imports,
            cold-chain reagent handling, warehousing, delivery, installation and after-sales
            service.
          </p>
          <p className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)] mb-4">
            We are neither a marketplace nor an aggregator. We are the supplier — we hold
            stock, we carry the registration responsibility, and our engineers install and
            support the equipment we sell. For institutional buyers this means one accountable
            partner for procurement, compliance and maintenance.
          </p>
          <p className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)]">
            Today MediportBD serves GP chambers, clinics, diagnostic centres, hospitals and
            government and private health programmes with 350+ products across 18+
            categories and 40+ global brands, including Rossmax, Omron, Microlife, Beurer,
            Accu-Chek, Tynor, JMS, Romsons, B.Braun and ConvaTec.
          </p>
        </div>
      </section>

      {/* Credentials — E-E-A-T */}
      <section className="py-12 px-4 bg-white border-y border-[var(--color-border-primary)]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-2">
            Company Credentials &amp; Compliance
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Documents are available to verify on request. Contact our regulatory affairs
            team for certificates.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CREDENTIALS.map(cred => (
              <div key={cred.title} className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] p-5">
                <p className="text-sm font-semibold text-[var(--color-brand-navy)]">{cred.title}</p>
                <p className="text-xs text-[var(--color-brand-teal)] font-medium mt-1">{cred.detail}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{cred.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/dgda-info" className="inline-block text-sm font-semibold text-[var(--color-brand-teal)] hover:underline">
              Read our full DGDA compliance statement →
            </Link>
          </div>
        </div>
      </section>

      {/* What we value */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-6">
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALUES.map(value => (
              <div key={value.title} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-5">
                <h3 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-2">{value.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-12 px-4 bg-white border-y border-[var(--color-border-primary)]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-6">
            Leadership
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-5 rounded-xl border border-[var(--color-border-primary)] p-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))' }}
              aria-hidden="true"
            >
              MR
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-brand-navy)]">Mahim Rahman</h3>
              <p className="text-sm text-[var(--color-brand-teal)] font-medium mb-2">Founder &amp; Managing Director</p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                10+ years in medical equipment sourcing and distribution in Bangladesh —
                responsible for supplier qualification, DGDA compliance and B2B client
                relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-2">
            Visit Our Showroom in Dhaka
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {address} — beside BMA Bhaban. Open Saturday–Thursday, 9:00 AM – 6:00 PM.
          </p>
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border-primary)]">
            <iframe
              title="MediportBD showroom location — Topkhana Road, Dhaka"
              src={mapsEmbed}
              width="100%"
              height="320"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0, display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 pb-16">
        <div className="container mx-auto max-w-4xl rounded-2xl bg-brand-navy text-white p-8 text-center">
          <h2 className="text-lg md:text-xl font-semibold mb-2">Talk to our team about your requirements</h2>
          <p className="text-sm text-white/70 mb-5">
            Free product consultations, demonstrations and written B2B quotations.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="tel:+8801646886795"
              className="px-5 py-2.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/b2b"
              className="px-5 py-2.5 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              B2B Pricing
            </Link>
          </div>
        </div>

        {/* Internal link grid — helps Google connect about page to content hierarchy */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
            <h3 className="text-xs font-semibold text-[var(--color-brand-navy)] uppercase tracking-wider mb-2">Our Products</h3>
            <ul className="space-y-1.5">
              <li><Link href="/products" className="text-xs text-[var(--color-brand-teal)] hover:underline">All Medical Equipment</Link></li>
              <li><Link href="/products/category/diagnostic-equipment" className="text-xs text-[var(--color-brand-teal)] hover:underline">Diagnostic Equipment</Link></li>
              <li><Link href="/reagent-store" className="text-xs text-[var(--color-brand-teal)] hover:underline">Laboratory Reagents</Link></li>
              <li><Link href="/products/category/surgical-instruments" className="text-xs text-[var(--color-brand-teal)] hover:underline">Surgical Instruments</Link></li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
            <h3 className="text-xs font-semibold text-[var(--color-brand-navy)] uppercase tracking-wider mb-2">Price Guides</h3>
            <ul className="space-y-1.5">
              <li><Link href="/equipment/ecg-machine-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">ECG Machine Prices</Link></li>
              <li><Link href="/equipment/ultrasound-machine-price-bangladesh" className="text-xs text-[var(--color-brand-teal)] hover:underline">Ultrasound Prices</Link></li>
              <li><Link href="/equipment" className="text-xs text-[var(--color-brand-teal)] hover:underline">All Equipment Prices</Link></li>
              <li><Link href="/guides" className="text-xs text-[var(--color-brand-teal)] hover:underline">Buying Guides</Link></li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
            <h3 className="text-xs font-semibold text-[var(--color-brand-navy)] uppercase tracking-wider mb-2">Compliance</h3>
            <ul className="space-y-1.5">
              <li><Link href="/dgda-info" className="text-xs text-[var(--color-brand-teal)] hover:underline">DGDA Compliance</Link></li>
              <li><Link href="/certifications" className="text-xs text-[var(--color-brand-teal)] hover:underline">Certifications</Link></li>
              <li><Link href="/brands" className="text-xs text-[var(--color-brand-teal)] hover:underline">Our Brands</Link></li>
              <li><Link href="/topics" className="text-xs text-[var(--color-brand-teal)] hover:underline">Topic Hubs</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
