import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';
import StructuredData from '@/utils/structuredData';

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

export default async function BrandsHub() {
  const brands = await fetchBrands();
  const sorted = [...brands].sort((a, b) => (b.productCount || 0) - (a.productCount || 0));

  return (
    <div className="min-h-screen bg-page">
      {/* ItemList schema — helps Google understand this is a brand directory */}
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
      <section className="bg-brand-navy text-white py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal-light mb-3">
            MediportBD Brand Directory
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold mb-4">
            Medical Equipment Brands in Bangladesh
          </h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Genuine, DGDA-registered medical equipment from trusted global and local manufacturers —
            available with warranty, installation and B2B pricing across Bangladesh.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(brand => {
            const slug = brand.slug;
            if (!slug) return null;
            return (
              <Link
                key={brand._id}
                href={`/brands/${slug}`}
                className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-5 hover:border-brand-teal/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {brand.logo?.url ? (
                    <div className="relative w-12 h-12 rounded-lg border border-[var(--color-border-primary)] bg-white flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                      <Image
                        src={brand.logo.url}
                        alt={`${brand.name} logo`}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-background-secondary)] flex items-center justify-center text-xl">
                      🏥
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-brand-navy truncate">{brand.name}</h2>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {brand.productCount || 0} products{brand.country ? ` · ${brand.country}` : ''}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-secondary)] py-16">
            Brand directory is being updated. Please check back soon.
          </p>
        )}

        {/* Internal linking section — helps Google understand brand/category hierarchy */}
        <section className="mt-8 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
            Shop by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/products/category/diagnostic-equipment" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Diagnostic Equipment</Link>
            <Link href="/products/category/surgical-instruments" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Surgical Instruments</Link>
            <Link href="/reagent-store" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Laboratory Reagents</Link>
            <Link href="/products/category/hospital-machines" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Hospital Machines</Link>
            <Link href="/products/category/orthopedic-supports" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Orthopedic Supports</Link>
            <Link href="/products/category/diabetes-care" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Diabetes Care</Link>
            <Link href="/products/category/mobility-aids" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Mobility Aids</Link>
            <Link href="/products" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors px-3 py-1.5">All Products →</Link>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white border border-[var(--color-border-primary)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
            Equipment Price Guides
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/equipment/ecg-machine-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">ECG Machine Prices</Link>
            <Link href="/equipment/ultrasound-machine-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Ultrasound Prices</Link>
            <Link href="/equipment/blood-pressure-monitor-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">BP Monitor Prices</Link>
            <Link href="/equipment/patient-monitor-price-bangladesh" className="text-xs font-medium text-brand-teal border border-brand-teal/40 rounded-lg px-3 py-1.5 hover:bg-brand-teal hover:text-white transition-colors">Patient Monitor Prices</Link>
            <Link href="/equipment" className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:underline transition-colors px-3 py-1.5">All Price Guides →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}