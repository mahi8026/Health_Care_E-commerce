import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

export const metadata = {
  title: 'DGDA Registration & Medical Device Compliance Bangladesh | MediportBD',
  description:
    'MediportBD operates in full compliance with the DGDA (Directorate General of Drug Administration). All medical equipment we sell is DGDA registered, CE certified and imported through authorised channels. Certificates available on request.',
  keywords:
    'DGDA registered medical equipment Bangladesh, DGDA compliance medical devices, CE certified medical equipment BD, DGDA registration Bangladesh, medical device regulation Bangladesh',
  alternates: { canonical: `${SITE_CONFIG.url}/dgda-info` },
  openGraph: {
    title: 'DGDA Registration & Medical Device Compliance Bangladesh | MediportBD',
    description:
      'Every product at MediportBD is DGDA registered and CE certified. Understand how medical device regulation works in Bangladesh and why it matters for your clinic or hospital.',
    url: `${SITE_CONFIG.url}/dgda-info`,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DGDA Registration & Medical Device Compliance | MediportBD',
    description: 'DGDA-registered medical equipment supplier in Bangladesh. All products CE certified.',
  },
};

const DGDA_FAQS = [
  {
    q: 'What is DGDA registration for medical devices in Bangladesh?',
    a: 'DGDA (Directorate General of Drug Administration) registration is mandatory for medical devices imported and sold in Bangladesh. Importers must register each regulated product with DGDA before selling. Without a valid DGDA certificate, a medical device cannot be legally sold in Bangladesh.',
  },
  {
    q: 'How do I verify a medical device is DGDA registered in Bangladesh?',
    a: 'Ask your supplier for the DGDA registration certificate for the specific product. The certificate shows the registration number, product name, manufacturer, and validity period. MediportBD provides DGDA registration documents for all regulated products on request.',
  },
  {
    q: 'What is CE certification for medical devices?',
    a: 'CE marking confirms that a medical device meets European Union safety, health and environmental protection standards. In Bangladesh, CE certification is used alongside DGDA registration as a quality signal. MediportBD only supplies CE-certified products.',
  },
  {
    q: 'What happens if I buy non-DGDA-registered medical equipment in Bangladesh?',
    a: 'Purchasing from an unregistered source can expose your hospital or clinic to regulatory liability, equipment seizure by authorities, invalid warranty, and risk of counterfeit or substandard products that can harm patients.',
  },
  {
    q: 'Does MediportBD hold DGDA registration for all its products?',
    a: 'Yes. Every regulated medical device sold by MediportBD carries a valid DGDA registration certificate. We can supply certificate copies to institutional buyers and procurement officers on request — typically within one business day.',
  },
];

const COMPLIANCE_POINTS = [
  {
    title: 'DGDA Registered Importer',
    desc: 'MediportBD holds DGDA registration as a medical device importer in Bangladesh. Every regulated product we sell is individually DGDA registered.',
  },
  {
    title: 'CE Certified Products Only',
    desc: 'We source exclusively from manufacturers with CE certification — the internationally recognised safety standard used by Bangladesh regulators as a quality benchmark.',
  },
  {
    title: 'Manufacturer Authorisation Letters',
    desc: 'For every brand we distribute, we hold valid manufacturer authorisation letters. This protects buyers from grey-market imports and ensures genuine warranty support.',
  },
  {
    title: 'Batch Traceability',
    desc: 'For reagents, consumables and other lot-controlled products, we maintain batch records with expiry dates, storage temperatures and cold-chain logs — ready for DGDA or internal audit.',
  },
  {
    title: 'Cold Chain Compliance',
    desc: 'Temperature-sensitive reagents and IVDs are stored at 2–8°C or −20°C as required and delivered with temperature-monitored cold-chain packaging.',
  },
  {
    title: 'ISO 13485 Compliant',
    desc: 'Our quality management system follows ISO 13485 standards for medical device distribution, covering supplier qualification, product acceptance, and post-market surveillance.',
  },
];

export default function DGDAInfoPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'DGDA Compliance', url: `${SITE_CONFIG.url}/dgda-info` },
  ];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'DGDA Registration & Medical Device Compliance in Bangladesh',
    description:
      'How DGDA registration works for medical devices in Bangladesh, why it matters for hospitals and clinics, and how MediportBD ensures full compliance.',
    url: `${SITE_CONFIG.url}/dgda-info`,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      logo: { '@type': 'ImageObject', url: `${SITE_CONFIG.url}/Mediport_Logo.png` },
    },
    about: {
      '@type': 'GovernmentOrganization',
      name: 'Directorate General of Drug Administration (DGDA)',
      url: 'http://www.dgda.gov.bd',
      address: { '@type': 'PostalAddress', addressCountry: 'BD' },
    },
    inLanguage: 'en-BD',
    speakable: { '@type': 'Speakable', cssSelector: ['#dgda-quick-answer'] },
  };

  return (
    <div className="min-h-screen bg-page">
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData schema={articleSchema} />
      <FAQSchema faqs={DGDA_FAQS} />

      {/* Hero — answer-first */}
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60 mb-4 flex flex-wrap gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/80">DGDA Compliance</span>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            Regulatory Compliance
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            DGDA Registration &amp; Medical Device Compliance in Bangladesh
          </h1>
          <p
            id="dgda-quick-answer"
            className="text-white/75 text-sm md:text-base leading-relaxed max-w-3xl"
          >
            The Directorate General of Drug Administration (DGDA) regulates medical devices
            sold in Bangladesh. Every regulated product must be DGDA registered before it can
            be legally sold. MediportBD is a DGDA-registered importer supplying only CE-certified,
            manufacturer-authorised medical equipment — with registration certificates available
            to any buyer on request.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-10">

        {/* What is DGDA */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
            What is the DGDA and why does registration matter?
          </h2>
          <p className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)] mb-4">
            The Directorate General of Drug Administration (DGDA), under the Ministry of Health
            and Family Welfare, is the national authority responsible for regulating medical
            devices in Bangladesh. Under the Drug Control Ordinance and subsequent circulars,
            medical devices — from blood pressure monitors and ECG machines to laboratory reagents
            and surgical instruments — must be registered with DGDA before importation and sale.
          </p>
          <p className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)] mb-4">
            For hospitals, clinics and diagnostic centres, buying from a DGDA-registered supplier
            is not just good practice — it protects you from counterfeit products, regulatory
            liability, invalid warranties and potential patient harm. Always ask for the DGDA
            registration certificate before purchasing regulated devices.
          </p>
        </section>

        {/* How MediportBD complies */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-6">
            How MediportBD ensures compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE_POINTS.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border border-[var(--color-border-primary)] bg-white p-5"
              >
                <h3 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-2">
                  {point.title}
                </h3>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Request certificates */}
        <section className="rounded-2xl border border-[var(--color-brand-teal)] bg-[var(--color-status-success-tint)] p-6 mb-10">
          <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-2">
            Request DGDA certificates
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-primary)] mb-4">
            Institutional buyers, procurement officers and auditors can request DGDA registration
            certificates, manufacturer authorisation letters, CE certificates and ISO documentation
            for any product we supply — typically provided within one business day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              Request Documents
            </Link>
            <Link
              href="/certifications"
              className="px-5 py-2.5 rounded-lg border border-[var(--color-brand-teal)] text-sm font-semibold text-[var(--color-brand-teal)] hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
            >
              View Our Certifications
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {DGDA_FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--color-border-primary)] bg-white p-5"
              >
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links — connects this E-E-A-T page to product hierarchy */}
        <section className="rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-brand-navy)] mb-3">
            Browse DGDA-Registered Products
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/products/category/diagnostic-equipment" className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors">Diagnostic Equipment</Link>
            <Link href="/products/category/surgical-instruments" className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors">Surgical Instruments</Link>
            <Link href="/reagent-store" className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors">Laboratory Reagents</Link>
            <Link href="/products/category/hospital-machines" className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors">Hospital Machines</Link>
            <Link href="/products" className="text-sm font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-4 py-2 hover:bg-brand-teal hover:text-white transition-colors">All Products</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link href="/about" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">About MediportBD</Link>
            <Link href="/certifications" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">Certifications</Link>
            <Link href="/guides/dgda-registration-explained" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">DGDA Registration Guide</Link>
            <Link href="/b2b" className="text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline">B2B Procurement</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
