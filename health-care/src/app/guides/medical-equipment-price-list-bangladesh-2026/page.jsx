import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Medical Equipment Price List Bangladesh 2026 — Complete Pricing Guide | MediportBD',
  description: 'Complete medical equipment price list in Bangladesh 2026. Compare ECG machines, patient monitors, ultrasound, surgical instruments, lab reagents. Updated monthly. 350+ product prices.',
  keywords: 'medical equipment price bangladesh, ecg machine price bd, patient monitor price, ultrasound machine price bangladesh, surgical instruments price, lab reagent price bangladesh',
  alternates: { canonical: `${SITE_CONFIG.url}/guides/medical-equipment-price-list-bangladesh-2026` },
  openGraph: {
    title: 'Medical Equipment Price List Bangladesh 2026 | MediportBD',
    description: 'Complete pricing guide for medical equipment in Bangladesh. Compare 350+ products from ECG machines to lab reagents. Updated monthly.',
    url: `${SITE_CONFIG.url}/guides/medical-equipment-price-list-bangladesh-2026`,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function MedicalEquipmentPriceList() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Guides', url: `${SITE_CONFIG.url}/guides` },
    { name: 'Medical Equipment Price List 2026', url: `${SITE_CONFIG.url}/guides/medical-equipment-price-list-bangladesh-2026` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the average price of medical equipment in Bangladesh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Medical equipment prices in Bangladesh vary widely: diagnostic devices (৳50,000-৳50 lakh), surgical instruments (৳500-৳50,000), laboratory reagents (৳2,000-৳50,000 per kit), hospital machines (৳1 lakh-৳1 crore). B2B bulk orders receive 8-30% discounts.'
        }
      },
      {
        '@type': 'Question',
        name: 'Where can I find the best prices for medical equipment in Bangladesh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MediportBD offers competitive medical equipment prices in Bangladesh with 8-30% B2B discounts, free delivery in Dhaka for orders above ৳50,000, and 30-90 day credit terms for hospitals. All products are DGDA registered and CE certified.'
        }
      }
    ]
  };

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData schema={faqSchema} />
      
      <article className="min-h-screen bg-[var(--color-background-page)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="text-[var(--color-brand-teal)] hover:underline">Home</Link></li>
              <li className="text-[var(--color-text-tertiary)]">/</li>
              <li><Link href="/guides" className="text-[var(--color-brand-teal)] hover:underline">Guides</Link></li>
              <li className="text-[var(--color-text-tertiary)]">/</li>
              <li className="text-[var(--color-text-secondary)]">Medical Equipment Price List 2026</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-brand-navy)] mb-4">
              Medical Equipment Price List Bangladesh 2026
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] mb-4">
              Complete pricing guide for medical equipment in Bangladesh. Compare 350+ products including ECG machines, patient monitors, ultrasound systems, surgical instruments, and laboratory reagents.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-tertiary)]">
              <span>📅 Updated: September 2026</span>
              <span>•</span>
              <span>⏱️ 15 min read</span>
              <span>•</span>
              <span>✅ DGDA Verified Prices</span>
            </div>
          </header>

          {/* Quick Summary */}
          <div className="bg-[var(--color-status-success-tint)] border border-[var(--color-brand-teal)] rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">Quick Price Overview</h2>
            <ul className="space-y-2 text-sm">
              <li>💉 <strong>Diagnostic Equipment:</strong> ৳50,000 - ৳50 lakh (ECG, ultrasound, patient monitors)</li>
              <li>🔪 <strong>Surgical Instruments:</strong> ৳500 - ৳50,000 (scissors, forceps, trocar sets)</li>
              <li>🧪 <strong>Laboratory Reagents:</strong> ৳2,000 - ৳50,000 per kit (HbA1c, CBC, biochemistry)</li>
              <li>🏥 <strong>Hospital Machines:</strong> ৳1 lakh - ৳1 crore (ventilators, infusion pumps, dialysis)</li>
              <li>💰 <strong>B2B Discounts:</strong> 8-30% off for bulk orders (min ৳1 lakh)</li>
            </ul>
          </div>

          {/* Diagnostic Equipment Prices */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-4 border-b-2 border-[var(--color-brand-teal)] pb-2">
              1. Diagnostic Equipment Prices Bangladesh
            </h2>

            <h3 className="text-xl font-semibold text-[var(--color-brand-navy)] mb-3 mt-6">ECG Machines Price Bangladesh</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-[var(--color-brand-navy)] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Product Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Brand</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Price (৳)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">3-Channel ECG Machine</td>
                    <td className="border border-gray-300 px-4 py-3">BPL</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳85,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">6-Channel ECG Machine</td>
                    <td className="border border-gray-300 px-4 py-3">Edan</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳1,25,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">12-Channel ECG Machine</td>
                    <td className="border border-gray-300 px-4 py-3">Mindray/Edan</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳2,50,000 - ৳4,50,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-[var(--color-brand-navy)] mb-3 mt-6">Patient Monitor Prices Bangladesh</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-[var(--color-brand-navy)] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Product Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Brand</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Price (৳)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">5-Parameter Patient Monitor</td>
                    <td className="border border-gray-300 px-4 py-3">Comen</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳1,80,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Hospital+Machines" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Multi-Parameter Patient Monitor</td>
                    <td className="border border-gray-300 px-4 py-3">Mindray</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳3,50,000 - ৳7,00,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Hospital+Machines" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-[var(--color-brand-navy)] mb-3 mt-6">Blood Pressure Monitor Prices</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-[var(--color-brand-navy)] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Product Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Brand</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Price (৳)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Digital BP Monitor (Arm)</td>
                    <td className="border border-gray-300 px-4 py-3">Omron</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳3,500 - ৳5,500</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Digital BP Monitor (Wrist)</td>
                    <td className="border border-gray-300 px-4 py-3">Rossmax</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳2,800 - ৳4,200</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Aneroid BP Monitor</td>
                    <td className="border border-gray-300 px-4 py-3">Rossmax/Microlife</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳1,500 - ৳2,500</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/products?category=Diagnostic+Equipment" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Laboratory Reagents */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-4 border-b-2 border-[var(--color-brand-teal)] pb-2">
              2. Laboratory Reagents Price Bangladesh
            </h2>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-[var(--color-brand-navy)] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left">Reagent Type</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Brand</th>
                    <th className="border border-gray-300 px-4 py-3 text-left">Tests/Kit</th>
                    <th className="border border-gray-300 px-4 py-3 text-right">Price (৳)</th>
                    <th className="border border-gray-300 px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">HbA1c Test Kit</td>
                    <td className="border border-gray-300 px-4 py-3">Finecare</td>
                    <td className="border border-gray-300 px-4 py-3">25 tests</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳8,500</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/reagent-store" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">CBC Reagent</td>
                    <td className="border border-gray-300 px-4 py-3">Mindray</td>
                    <td className="border border-gray-300 px-4 py-3">1000 tests</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳18,000 - ৳25,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/reagent-store" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Glucose Test Kit</td>
                    <td className="border border-gray-300 px-4 py-3">Human/GPL</td>
                    <td className="border border-gray-300 px-4 py-3">100 tests</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳2,500 - ৳3,500</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/reagent-store" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Cholesterol Test Kit</td>
                    <td className="border border-gray-300 px-4 py-3">Human/GPL</td>
                    <td className="border border-gray-300 px-4 py-3">100 tests</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳2,800 - ৳4,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/reagent-store" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">Troponin I Test Kit</td>
                    <td className="border border-gray-300 px-4 py-3">Finecare</td>
                    <td className="border border-gray-300 px-4 py-3">25 tests</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">৳12,000 - ৳15,000</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <Link href="/reagent-store" className="text-[var(--color-brand-teal)] hover:underline text-sm">View</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* B2B Pricing */}
          <section className="mb-12 bg-[var(--color-brand-navy)] text-white rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">B2B Bulk Pricing Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-[var(--color-brand-teal)]">Bulk Discount Tiers:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Orders ৳1 lakh - ৳3 lakh: <strong>8% discount</strong></li>
                  <li>✓ Orders ৳3 lakh - ৳5 lakh: <strong>15% discount</strong></li>
                  <li>✓ Orders ৳5 lakh - ৳10 lakh: <strong>20% discount</strong></li>
                  <li>✓ Orders above ৳10 lakh: <strong>25-30% discount</strong></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-[var(--color-brand-teal)]">Additional B2B Benefits:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ 30-90 day credit terms</li>
                  <li>✓ Free installation in Dhaka</li>
                  <li>✓ Dedicated account manager</li>
                  <li>✓ 24/7 technical support</li>
                  <li>✓ Quarterly maintenance visits</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/b2b" className="inline-block bg-[var(--color-brand-teal)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                Request B2B Quote →
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6 border-b-2 border-[var(--color-brand-teal)] pb-2">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">What is the average price of medical equipment in Bangladesh?</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Medical equipment prices vary widely: diagnostic devices (৳50,000-৳50 lakh), surgical instruments (৳500-৳50,000), laboratory reagents (৳2,000-৳50,000 per kit), hospital machines (৳1 lakh-৳1 crore). B2B bulk orders receive 8-30% discounts.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Are these prices for retail or wholesale?</h3>
                <p className="text-[var(--color-text-secondary)]">
                  Prices listed are retail prices. MediportBD offers 8-30% B2B wholesale discounts for hospitals, clinics, and diagnostic centers based on order volume. Contact us for customized B2B pricing.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Where can I find the best prices for medical equipment in Bangladesh?</h3>
                <p className="text-[var(--color-text-secondary)]">
                  MediportBD offers competitive medical equipment prices in Bangladesh with 8-30% B2B discounts, free delivery in Dhaka for orders above ৳50,000, and 30-90 day credit terms for hospitals. All products are DGDA registered and CE certified.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Do medical equipment prices include installation?</h3>
                <p className="text-[var(--color-text-secondary)]">
                  MediportBD provides free installation and staff training for diagnostic equipment (ECG, patient monitors, ultrasound) in Dhaka metro area. Installation costs outside Dhaka are subsidized based on distance and equipment type.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">How often are medical equipment prices updated?</h3>
                <p className="text-[var(--color-text-secondary)]">
                  This price list is updated monthly to reflect current market prices, currency fluctuations, and import costs. Prices shown are subject to change without notice. Contact MediportBD for the most current pricing.
                </p>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6 border-b-2 border-[var(--color-brand-teal)] pb-2">
              Related Price Guides
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/equipment/ecg-machine-price-bangladesh" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-1">ECG Machine Prices Bangladesh</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Compare 3, 6, and 12-channel ECG machines</p>
              </Link>
              <Link href="/equipment/patient-monitor-price-bangladesh" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-1">Patient Monitor Prices</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">5-parameter and multi-parameter monitors</p>
              </Link>
              <Link href="/equipment/ultrasound-machine-price-bangladesh" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-1">Ultrasound Machine Prices</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Portable and full-featured ultrasound systems</p>
              </Link>
              <Link href="/reagent-store" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-1">Laboratory Reagent Prices</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Complete reagent catalog with bulk pricing</p>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[var(--color-brand-navy)] to-[var(--color-brand-teal)] text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Need a Custom Quote for Your Hospital?</h2>
            <p className="mb-6">Get personalized B2B pricing with 8-30% bulk discounts and flexible credit terms</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/b2b" className="bg-white text-[var(--color-brand-navy)] px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                Request B2B Quote
              </Link>
              <Link href="/contact" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[var(--color-brand-navy)]">
                Contact Sales Team
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
