import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { BANGLADESH_LOCATIONS } from '@/config/bangladesh-seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Medical Equipment Supplier All Bangladesh — Dhaka, Chittagong, Sylhet | MediportBD',
  description: 'Medical equipment supplier serving all Bangladesh divisions: Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh. ✓ Free delivery ✓ DGDA certified. Call: 01646-886795',
  keywords: 'medical equipment supplier bangladesh, medical equipment all bangladesh, hospital equipment nationwide, medical supply bangladesh divisions',
  alternates: { canonical: `${SITE_CONFIG.url}/location` },
  openGraph: {
    title: 'Medical Equipment Supplier All Bangladesh | MediportBD',
    description: 'Serving all 8 divisions of Bangladesh with DGDA certified medical equipment',
    url: `${SITE_CONFIG.url}/location`,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function LocationsPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Locations', url: `${SITE_CONFIG.url}/location` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      
      <article className="min-h-screen bg-[var(--color-background-page)] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-brand-navy)] mb-4">
              Medical Equipment Supplier All Bangladesh
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Serving 8 divisions with DGDA certified medical equipment, diagnostic machines, 
              laboratory reagents, and hospital supplies nationwide
            </p>
          </header>

          {/* Key Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--color-brand-teal)] mb-2">8</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Divisions Covered</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--color-brand-teal)] mb-2">64</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Districts Reached</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--color-brand-teal)] mb-2">500+</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Hospitals Served</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-[var(--color-brand-teal)] mb-2">24/7</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Support Available</div>
            </div>
          </div>

          {/* Division Cards */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Medical Equipment Delivery Across Bangladesh
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BANGLADESH_LOCATIONS.divisions.map((division) => (
                <Link
                  key={division.slug}
                  href={`/location/${division.slug}`}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-brand-navy)] group-hover:text-[var(--color-brand-teal)] transition-colors">
                        {division.name}
                      </h3>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        Population: {division.population}
                      </p>
                    </div>
                    <div className="text-2xl">📍</div>
                  </div>
                  
                  <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 mb-4">
                    <li>✓ Free delivery available</li>
                    <li>✓ 1-3 days shipping</li>
                    <li>✓ Installation service</li>
                  </ul>
                  
                  <div className="text-[var(--color-brand-teal)] text-sm font-medium group-hover:underline">
                    View Details →
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Major Cities */}
          <section className="mb-12 bg-white rounded-xl p-8">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              We Deliver to All Major Cities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {BANGLADESH_LOCATIONS.majorCities.map((city) => (
                <div key={city} className="text-center p-3 bg-[var(--color-background-page)] rounded-lg">
                  <div className="text-sm text-[var(--color-text-secondary)]">{city}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Info */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Nationwide Delivery Service
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">🚚</div>
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Fast Delivery</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Same-day dispatch from Dhaka. 1-3 days for divisional cities, 3-5 days for district areas.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">📦</div>
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Free Delivery</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Free delivery in Dhaka for orders above ৳50,000. Subsidized rates for other divisions.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">❄️</div>
                <h3 className="font-semibold text-[var(--color-brand-navy)] mb-2">Cold Chain</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Temperature-controlled delivery (2-8°C) for laboratory reagents to all divisions.
                </p>
              </div>
            </div>
          </section>

          {/* Medical Hubs */}
          <section className="mb-12 bg-[var(--color-background-page)] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-[var(--color-brand-navy)] mb-6">
              Serving Major Medical Hubs in Bangladesh
            </h2>
            <div className="space-y-3">
              {BANGLADESH_LOCATIONS.medicalHubs.map((hub) => (
                <div key={hub.name} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <div className="text-2xl">🏥</div>
                  <div>
                    <div className="font-semibold text-[var(--color-brand-navy)]">{hub.name}</div>
                    <div className="text-sm text-[var(--color-text-tertiary)]">{hub.area}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[var(--color-brand-navy)] to-[var(--color-brand-teal)] text-white rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Need Medical Equipment Anywhere in Bangladesh?
            </h2>
            <p className="mb-6">
              Get free quote with nationwide delivery and installation support
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/b2b" className="bg-white text-[var(--color-brand-navy)] px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                Request Quote
              </Link>
              <Link href="/products" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[var(--color-brand-navy)]">
                Browse Products
              </Link>
              <a href="tel:+8801646886795" className="bg-[var(--color-brand-teal)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90">
                📞 01646-886795
              </a>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
