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
  title: 'Certifications & Regulatory Registration',
  description:
    'MediportBD certifications: DGDA-registered medical equipment supplier in Dhaka, ISO 13485 compliant, with trade license and BIN/VAT registration. Verification documents available on request.',
  keywords: 'MediportBD certifications, DGDA registration Bangladesh, ISO 13485 Bangladesh, medical equipment supplier license BD, BIN number Dhaka',
  alternates: { canonical: `${SITE_CONFIG.url}/certifications` },
  openGraph: {
    title: 'Certifications & Regulatory Registration',
    description:
      'Verify MediportBD\u2019s regulatory registrations: DGDA, ISO 13485, trade license and BIN — certificates available on request for institutional buyers.',
    url: `${SITE_CONFIG.url}/certifications`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certifications & Regulatory Registration',
    description: 'DGDA-registered, ISO 13485 compliant medical equipment supplier in Dhaka, Bangladesh.',
  },
};

const CREDENTIALS = [
  {
    title: 'DGDA Registered',
    detail: REGISTRATION_NUMBER || 'Available on request',
    note: 'Directorate General of Drug Administration, Bangladesh — all regulated products we sell carry valid DGDA registration.',
  },
  {
    title: 'ISO 13485 Compliant',
    detail: ISO_CERT || 'Available on request',
    note: 'Quality management for medical devices — certification documents available to institutional buyers on request.',
  },
  {
    title: 'Trade License',
    detail: TRADE_LICENSE || 'Available on request',
    note: 'Registered business operating from Topkhana Road, Dhaka — the licence number can be verified with Dhaka South City Corporation.',
  },
  {
    title: 'BIN Registered',
    detail: BIN_NUMBER || 'Available on request',
    note: 'Business Identification Number — VAT compliant with the National Board of Revenue (NBR), Bangladesh.',
  },
];

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-page">
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Certifications & Regulatory Registration ',
          url: `${SITE_CONFIG.url}/certifications`,
          speakable: { '@type': 'Speakable', cssSelector: ['#cert-summary'] },
          about: {
            '@type': 'Organization',
            name: 'Mediport Bangladesh Ltd.',
            url: SITE_CONFIG.url,
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
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-widest text-brand-teal mb-3">
            Trust & Compliance
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Certifications & Regulatory Registration
          </h1>
          <p id="cert-summary" className="text-white/75 text-sm md:text-base leading-relaxed max-w-3xl mx-auto">
            Mediport Bangladesh Ltd. (MediportBD) is a DGDA-registered medical equipment
            supplier in Dhaka, Bangladesh, operating under a valid trade license and
            BIN/VAT registration. We supply only DGDA-registered, manufacturer-authorised
            products, and certificate copies are available to any customer on request.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {/* Credentials grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {CREDENTIALS.map((cred) => (
            <div key={cred.title} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-5">
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-1">
                {cred.title}
              </h2>
              <p className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-brand-teal)] mb-3">
                {cred.detail}
              </p>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {cred.note}
              </p>
            </div>
          ))}
        </div>

        {/* Why it matters — E-E-A-T */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
            Why these registrations matter
          </h2>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              DGDA registration is mandatory for medical devices and supplies sold in
              Bangladesh. Buying from a registered supplier protects your hospital or
              clinic from counterfeit products, invalid warranties and regulatory liability.
              Every regulated product on MediportBD is traceable to its DGDA certificate.
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
              For institutional buyers, certificate copies form part of your procurement
              and audit files. Our BIN registration means every B2B transaction is
              VAT-compliant and properly documented for NBR inspection.
            </p>
          </div>
        </section>

        {/* Verification */}
        <section className="rounded-2xl border border-[var(--color-brand-teal)] bg-[var(--color-status-success-tint)] p-6 mb-10">
          <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-2">
            Request certificate copies
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)] mb-4">
            Send us your institution name and required certificates via email or WhatsApp,
            and we will provide verified copies — DGDA registration, ISO documents,
            trade license and BIN — typically within one business day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/dgda-info"
              className="px-5 py-2.5 rounded-lg border border-[var(--color-brand-teal)] text-sm font-semibold text-[var(--color-brand-teal)] hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
            >
              DGDA Compliance
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">Related pages</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/about"
              className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/guides/dgda-registration-explained"
              className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
            >
              DGDA Registration Explained
            </Link>
            <Link
              href="/b2b"
              className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
            >
              B2B Procurement
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
