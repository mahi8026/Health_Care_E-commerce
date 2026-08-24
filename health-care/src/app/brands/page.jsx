import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';

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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logo.url}
                      alt={`${brand.name} logo`}
                      className="w-12 h-12 object-contain rounded-lg border border-[var(--color-border-primary)] p-1 bg-white"
                    />
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
      </div>
    </div>
  );
}