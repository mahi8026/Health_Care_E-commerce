import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/seo';
import { BANGLADESH_LOCATIONS } from '@/config/bangladesh-seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

// Generate static params for all Bangladesh cities
export async function generateStaticParams() {
  return BANGLADESH_LOCATIONS.divisions.map((division) => ({
    city: division.slug,
  }));
}

// Dynamic metadata for each city
export async function generateMetadata({ params }) {
  const { city } = await params;
  const division = BANGLADESH_LOCATIONS.divisions.find(d => d.slug === city);
  
  if (!division) {
    return {
      title: 'Location Not Found | MediportBD',
      robots: { index: false, follow: false },
    };
  }

  const title = `Medical Equipment ${division.name} — Supplier in ${division.name} Bangladesh`;
  const description = `Buy medical equipment in ${division.name}, Bangladesh. ✓ DGDA certified ✓ Free delivery in ${division.name} ✓ ECG, ultrasound, lab reagents ✓ Serving ${division.population} people. Call: 01646-886795`;

  return {
    title,
    description,
    keywords: `medical equipment ${division.name}, hospital equipment ${division.name}, diagnostic equipment ${division.name}, medical supplier ${division.name} Bangladesh, healthcare equipment ${division.name}`,
    alternates: { canonical: `${SITE_CONFIG.url}/location/${city}` },
    openGraph: {
      title,
      description,
      url: `${SITE_CONFIG.url}/location/${city}`,
      images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function CityPage({ params }) {
  const { city } = await params;
  const division = BANGLADESH_LOCATIONS.divisions.find(d => d.slug === city);
  
  if (!division) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Locations', url: `${SITE_CONFIG.url}/location` },
    { name: division.name, url: `${SITE_CONFIG.url}/location/${city}` },
  ];

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: `MediportBD ${division.name}`,
    description: `Medical equipment supplier serving ${division.name} and surrounding areas in Bangladesh.`,
    areaServed: {
      '@type': 'City',
      name: division.name,
      containedIn: {
        '@type': 'Country',
        name: 'Bangladesh',
      },
    },
    telephone: '+8801646886795',
    url: `${SITE_CONFIG.url}/location/${city}`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Where can I buy medical equipment in ${division.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can buy medical equipment in ${division.name} from MediportBD with free delivery across ${division.name}. We supply ECG machines, patient monitors, lab reagents, and surgical instruments to hospitals and clinics in ${division.name}. Call: 01646-886795`
        }
      },
      {
        '@type': 'Question',
        name: `Does MediportBD deliver medical equipment to ${division.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, MediportBD delivers medical equipment to ${division.name} and all areas in ${division.name} division. Free delivery for orders above ৳50,000. Standard delivery takes 1-3 days in ${division.name} city and 3-5 days in ${division.name} district areas.`
        }
      },
      {
        '@type': 'Question',
        name: `What medical equipment is available in ${division.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `MediportBD supplies all types of medical equipment in ${division.name}: diagnostic machines (ECG, ultrasound, patient monitors), surgical instruments, laboratory reagents, hospital furniture, PPE, and medical consumables. All products are DGDA registered.`
        }
      }
    ]
  };

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData schema={localBusinessSchema} />
      <StructuredData schema={faqSchema} />
      
      <article className="min-h-screen bg-[var(--color-background-page)] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="text-[var(--color-brand-teal)] hover:underline">Home</Link></li>
              <li className="text-[var(--color-text-tertiary)]">/</li>
              <li><Link href="/location" className="text-[var(--color-brand-teal)] hover:underline">Locations</Link></li>
              <li className="text-[var(--color-text-tertiary)]">/</li>
              <li className="text-[var(--color-text-secondary)]">{division.name}</li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-brand-navy)] mb-4">
              Medical Equipment Supplier in {division.name}, Bangladesh
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] mb-4">
              Serving {division.population} people in {division.name} with DGDA certified medical equipment, 
              diagnostic machines, laboratory reagents, and hospital supplies.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="bg-[var(--color-status-success-tint)] text-[var(--color-brand-teal)] px-3 py-1 rounded-full">
                📍 Free Delivery in {division.name}
              </span>
              <span className="bg-[var(--color-status-success-tint)] text-[var(--color-brand-teal)] px-3 py-1 rounded-full">
                ✅ DGDA Certified
              </span>
              <span className="bg-[var(--color-status-success-tint)] text-[var(--color-brand-teal)] px-3 py-1 rounded-full">
                🚚 1-3 Days Delivery
              </span>
            </div>
          </header>

          {/* Key Info Card */}
          <div className="bg-gradient-to-r from-[var(--color-brand-navy)] to-[var(--color-brand-teal)] text-white rounded-xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">📞 Contact Us</h3>
                <p className="text-sm">Call: +880 1646-886795</p>
                <p className="text-sm">Email: mediportbdofficial@gmail.com</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🚚 Delivery Info</h3>
                <p className="text-sm">Free delivery in {division.name}</p>
                <p className="text-sm">Orders above ৳50,000</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⏰ Service Hours</h3>
                <p className="text-sm">Sat-Thu: 9 AM - 6 PM</p>
                <p className="text-sm">Friday: 10 AM - 2 PM</p>
              </div>
            </div>
          </div>

          {/* Product Categories for this Location */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Medical Equipment Available in {division.name}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/products/category/diagnostic-equipment" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">🏥 Diagnostic Equipment</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  ECG machines, patient monitors, ultrasound systems for hospitals in {division.name}
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Products →</span>
              </Link>

              <Link href="/reagent-store" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">🧪 Laboratory Reagents</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  HbA1c, CBC, biochemistry kits with cold chain delivery to {division.name}
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Reagents →</span>
              </Link>

              <Link href="/products/category/surgical-instruments" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">🔪 Surgical Instruments</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Complete surgical instrument sets for clinics in {division.name}
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Instruments →</span>
              </Link>

              <Link href="/products/category/hospital-machines" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">🏥 Hospital Machines</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Ventilators, infusion pumps, nebulizers for {division.name} hospitals
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Machines →</span>
              </Link>

              <Link href="/products/category/laboratory-equipment" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">🔬 Lab Equipment</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Hematology analyzers, microscopes for diagnostic centers in {division.name}
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Equipment →</span>
              </Link>

              <Link href="/products/category/consumables" className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">💉 Medical Consumables</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  Needles, catheters, gloves, syringes delivered to {division.name}
                </p>
                <span className="text-[var(--color-brand-teal)] text-sm font-medium">View Consumables →</span>
              </Link>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-12 bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Why Hospitals in {division.name} Choose MediportBD
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">DGDA Registered Supplier</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    All products comply with Bangladesh medical device regulations. Licensed supplier for {division.name}.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">🚚</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Fast Delivery to {division.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    1-3 days delivery in {division.name} city. Free delivery for orders above ৳50,000.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">💰</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">B2B Pricing Available</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    8-30% bulk discounts for hospitals and clinics in {division.name}. Credit terms available.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">🔧</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Installation & Training</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Free installation service in {division.name}. Staff training included for diagnostic equipment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">❄️</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Cold Chain for Reagents</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Temperature-controlled delivery (2-8°C) for laboratory reagents to {division.name}.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-3xl">📞</div>
                <div>
                  <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">24/7 Support</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Technical support hotline for {division.name} hospitals. Call: 01646-886795
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Frequently Asked Questions — {division.name}
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">
                  Where can I buy medical equipment in {division.name}?
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  You can buy medical equipment in {division.name} from MediportBD with free delivery across {division.name}. 
                  We supply ECG machines, patient monitors, lab reagents, and surgical instruments to hospitals and clinics 
                  in {division.name}. Order online or call: 01646-886795
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">
                  Does MediportBD deliver medical equipment to {division.name}?
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Yes, MediportBD delivers medical equipment to {division.name} and all areas in {division.name} division. 
                  Free delivery for orders above ৳50,000. Standard delivery takes 1-3 days in {division.name} city and 
                  3-5 days in {division.name} district areas.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">
                  What medical equipment is available in {division.name}?
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  MediportBD supplies all types of medical equipment in {division.name}: diagnostic machines (ECG, ultrasound, 
                  patient monitors), surgical instruments, laboratory reagents, hospital furniture, PPE, and medical consumables. 
                  All products are DGDA registered and CE certified.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">
                  Do you provide installation service in {division.name}?
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Yes, MediportBD provides free installation and staff training for diagnostic equipment in {division.name}. 
                  Our certified technicians will visit your hospital or clinic in {division.name} to set up and calibrate 
                  ECG machines, patient monitors, and ultrasound systems.
                </p>
              </div>
            </div>
          </section>

          {/* Other Bangladesh Locations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              We Also Serve Other Cities in Bangladesh
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BANGLADESH_LOCATIONS.divisions
                .filter(d => d.slug !== city)
                .map(d => (
                  <Link 
                    key={d.slug}
                    href={`/location/${d.slug}`}
                    className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl mb-2">📍</div>
                    <div className="font-semibold text-[var(--color-brand-navy)]">{d.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{d.population}</div>
                  </Link>
                ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[var(--color-brand-navy)] to-[var(--color-brand-teal)] text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Need Medical Equipment in {division.name}?
            </h2>
            <p className="mb-6">
              Get personalized quote with free delivery and installation in {division.name}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/b2b" className="bg-white text-[var(--color-brand-navy)] px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                Request Quote
              </Link>
              <Link href="/products" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[var(--color-brand-navy)]">
                Browse Products
              </Link>
              <a href="tel:+8801646886795" className="bg-[var(--color-brand-teal)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                📞 Call Now
              </a>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
