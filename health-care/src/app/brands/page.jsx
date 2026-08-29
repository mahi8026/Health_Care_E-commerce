import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const revalidate = 3600;

export const metadata = {
  title: 'Medical Equipment Brands in Bangladesh | MediportBD',
  description:
    'Browse all medical equipment brands available at MediportBD Bangladesh — genuine diagnostic devices, surgical instruments, laboratory reagents and hospital equipment from trusted global manufacturers.',
  keywords: 'medical equipment brands Bangladesh, diagnostic brands BD, hospital equipment suppliers Bangladesh',
  alternates: { canonical: `${SITE_CONFIG.url}/brands` },
  openGraph: {
    title: 'Medical Equipment Brands in Bangladesh | MediportBD',
    description: 'Genuine medical equipment brands available in Bangladesh with DGDA certification and warranty.',
    url: `${SITE_CONFIG.url}/brands`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

async function fetchBrands() {
  try {
    const res = await fetch(`${API}/manufacturers`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.data?.manufacturers || data.manufacturers || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Groups brands by first letter for alphabetical nav
function groupByLetter(brands) {
  const groups = {};
  for (const brand of brands) {
    const letter = (brand.name?.[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(brand);
  }
  return groups;
}

export default async function BrandsHub() {
  const brands = await fetchBrands();
  const sorted = [...brands].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const byLetter = groupByLetter(sorted);
  const letters = Object.keys(byLetter).sort();
  const topBrands = [...brands]
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    .slice(0, 8);

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Brands', url: `${SITE_CONFIG.url}/brands` },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Schemas */}
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Medical Equipment Brands at MediportBD Bangladesh',
          description: 'DGDA-registered medical equipment brands available in Bangladesh from MediportBD',
          url: `${SITE_CONFIG.url}/brands`,
          numberOfItems: sorted.length,
          itemListElement: sorted.slice(0, 20).map((brand, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Brand',
              name: brand.name,
              url: `${SITE_CONFIG.url}/brands/${brand.slug}`,
              ...(brand.logo?.url && { logo: brand.logo.url }),
            },
          })),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #001D5D 0%, #002B78 60%, #18AFA9 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        </div>
        <div className="relative container mx-auto max-w-5xl px-4 py-14 md:py-18 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-300">
              MediportBD Brand Directory
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Global Brands,
            <span className="block text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #00D0CA, #00D0CA)' }}>
              Delivered in Bangladesh
            </span>
          </h1>
          <p className="text-white/65 text-sm md:text-base leading-relaxed max-w-2xl mx-auto mb-8">
            Genuine, DGDA-registered medical equipment from {sorted.length}+ global and local
            manufacturers — available with warranty, installation, and B2B pricing nationwide.
          </p>
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { value: `${sorted.length}+`, label: 'Brands' },
              { value: '10,000+', label: 'Products' },
              { value: 'DGDA', label: 'Registered' },
              { value: 'ISO 13485', label: 'Certified' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-[#cfe0ec]">
        <div className="container mx-auto max-w-6xl px-4 py-2.5 flex items-center gap-1.5 text-xs text-tertiary">
          <Link href="/" className="hover:text-[#18AFA9] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#0f172a] font-medium">Brands</span>
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-4 py-10">

        {/* ── Featured / Top brands ──────────────────────────────────── */}
        {topBrands.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#001D5D]">Featured Brands</h2>
              <span className="text-xs text-tertiary">Most products</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topBrands.map(brand => {
                if (!brand.slug) return null;
                return (
                  <Link
                    key={brand._id}
                    href={`/brands/${brand.slug}`}
                    className="group flex flex-col items-center gap-2.5 rounded-2xl bg-white border border-[#cfe0ec] p-4 hover:border-[#18AFA9]/50 hover:shadow-md transition-all"
                  >
                    {brand.logo?.url ? (
                      <div className="relative w-16 h-16 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-center p-2 overflow-hidden">
                        <Image
                          src={brand.logo.url}
                          alt={`${brand.name} logo`}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-2xl">🏥</div>
                    )}
                    <div className="text-center min-w-0 w-full">
                      <p className="text-xs font-semibold text-[#001D5D] truncate group-hover:text-[#18AFA9] transition-colors">{brand.name}</p>
                      <p className="text-[10px] text-tertiary mt-0.5">{brand.productCount || 0} products</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Alphabet jump bar ──────────────────────────────────────── */}
        {letters.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {letters.map(l => (
              <a
                key={l}
                href={`#letter-${l}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-[#18AFA9] border border-[#18AFA9]/25 hover:bg-[#18AFA9] hover:text-white transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        )}

        {/* ── All brands — grouped by letter ────────────────────────── */}
        {sorted.length > 0 ? (
          <div className="space-y-8">
            {letters.map(letter => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#001D5D] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {letter}
                  </div>
                  <div className="h-px flex-1 bg-[#e2e8f0]" />
                  <span className="text-[10px] text-tertiary flex-shrink-0">{byLetter[letter].length} brand{byLetter[letter].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {byLetter[letter].map(brand => {
                    if (!brand.slug) return null;
                    return (
                      <Link
                        key={brand._id}
                        href={`/brands/${brand.slug}`}
                        className="group flex items-center gap-3 rounded-xl bg-white border border-[#cfe0ec] p-4 hover:border-[#18AFA9]/50 hover:shadow-md transition-all"
                      >
                        {brand.logo?.url ? (
                          <div className="relative w-11 h-11 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                            <Image
                              src={brand.logo.url}
                              alt={`${brand.name} logo`}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-xl flex-shrink-0">🏥</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#001D5D] truncate group-hover:text-[#18AFA9] transition-colors">{brand.name}</p>
                          <p className="text-xs text-tertiary mt-0.5">
                            {brand.productCount || 0} products{brand.country ? ` · ${brand.country}` : ''}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-[#cfe0ec] group-hover:text-[#18AFA9] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#cfe0ec] p-12 text-center">
            <div className="text-4xl mb-3">🏥</div>
            <p className="text-sm font-semibold text-[#001D5D] mb-1">Brand directory is being updated</p>
            <p className="text-xs text-tertiary">Please check back soon.</p>
          </div>
        )}

        {/* ── Internal links ──────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="rounded-2xl bg-white border border-[#cfe0ec] p-5">
            <h2 className="text-sm font-bold text-[#001D5D] mb-3">Shop by Category</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/products/category/diagnostic-equipment', label: 'Diagnostic Equipment' },
                { href: '/products/category/surgical-instruments', label: 'Surgical Instruments' },
                { href: '/reagent-store', label: 'Laboratory Reagents' },
                { href: '/products/category/hospital-machines', label: 'Hospital Machines' },
                { href: '/products/category/diabetes-care', label: 'Diabetes Care' },
                { href: '/products', label: 'All Products →' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs font-medium text-[#18AFA9] border border-[#18AFA9]/30 rounded-lg px-3 py-1.5 hover:bg-[#18AFA9] hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#cfe0ec] p-5">
            <h2 className="text-sm font-bold text-[#001D5D] mb-3">Equipment Price Guides</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/equipment/ecg-machine-price-bangladesh', label: 'ECG Machine Prices' },
                { href: '/equipment/ultrasound-machine-price-bangladesh', label: 'Ultrasound Prices' },
                { href: '/equipment/blood-pressure-monitor-price-bangladesh', label: 'BP Monitor Prices' },
                { href: '/equipment/patient-monitor-price-bangladesh', label: 'Patient Monitor Prices' },
                { href: '/equipment', label: 'All Price Guides →' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs font-medium text-[#18AFA9] border border-[#18AFA9]/30 rounded-lg px-3 py-1.5 hover:bg-[#18AFA9] hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
