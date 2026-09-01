/**
 * Products listing page — Server Component.
 *
 * Server-renders the first page of products (with filters from the URL)
 * so the catalog is fully crawlable without JavaScript. ProductsPage is a
 * Client Component that hydrates with this data and continues fetching
 * client-side on subsequent filter/page changes.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { fetchListing } from '@/lib/listingData';

export const metadata = {
  title:       PAGE_SEO.products.title,
  description: PAGE_SEO.products.description,
  keywords:    PAGE_SEO.products.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/products` },
  openGraph: {
    title:       PAGE_SEO.products.title,
    description: PAGE_SEO.products.description,
    url:         `${SITE_CONFIG.url}/products`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default async function ProductsRoute({ searchParams }) {
  const resolvedParams = await Promise.resolve(searchParams || {});
  const val = (key) => {
    const v = resolvedParams[key];
    return Array.isArray(v) ? v[0] || '' : v || '';
  };

  // Guard: the SearchAction schema uses {search_term_string} as a URL template
  // variable. If Google crawls the literal placeholder URL
  // /products?q={search_term_string} it gets a 200 with no results = Soft 404.
  // Return a real 404 instead so Google stops flagging it.
  const rawQuery = val('q');
  if (rawQuery === '{search_term_string}') {
    notFound();
  }

  const categoryName = val('category');
  const category = CATEGORY_NAME_TO_SLUG[categoryName] || categoryName || '';
  const listing = await fetchListing({
    search: rawQuery,
    category,
    brand: val('brand'),
    minPrice: val('minPrice'),
    maxPrice: val('maxPrice'),
    inStock: val('inStock') === 'true',
    sortBy: val('sort') || 'name',
    page: val('page') || '1',
  });

  return (
    <>
      {/* Server-rendered topic hub links — Compact single-line layout */}
      <nav
        aria-label="Browse by topic"
        className="bg-white border-b border-[var(--color-border-tertiary)]"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mr-0.5 whitespace-nowrap flex-shrink-0">
            Topic Guides:
          </span>
          <Link href="/topics/ecg-machines" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">ECG Machines</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/blood-pressure-monitors" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">BP Monitors</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/ultrasound-machines" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">Ultrasound</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/surgical-instruments" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">Surgical Instruments</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/laboratory-equipment-reagents" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">Lab Reagents</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/hospital-icu-equipment" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">Hospital & ICU</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0">·</span>
          <Link href="/topics/diabetes-care" className="text-[10px] text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0">Diabetes Care</Link>
          <span className="text-[var(--color-border-primary)] text-[10px] flex-shrink-0 hidden sm:block">·</span>
          <Link href="/topics" className="text-[10px] font-semibold text-[var(--color-brand-teal,#18AFA9)] hover:underline whitespace-nowrap flex-shrink-0 hidden sm:block">All Topics →</Link>
        </div>
      </nav>

      <ProductsPage
        initialData={listing.products}
        initialPagination={listing.pagination}
        initialCategories={listing.categories}
        initialBrands={listing.brands}
        initialFilters={listing.filters}
      />

      {/* Server-rendered internal link section — helps Google discover price pages
          and brand pages from the products listing */}
      <section className="bg-white border-t border-[var(--color-border-tertiary)] py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy,#1a2e4a)] mb-3">
                Equipment Price Guides
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/equipment/ecg-machine-price-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">ECG Machine Prices Bangladesh 2026</Link></li>
                <li><Link href="/equipment/blood-pressure-monitor-price-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Blood Pressure Monitor Prices</Link></li>
                <li><Link href="/equipment/ultrasound-machine-price-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Ultrasound Machine Prices</Link></li>
                <li><Link href="/equipment/patient-monitor-price-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Patient Monitor Prices</Link></li>
                <li><Link href="/equipment/ventilator-price-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Ventilator Prices Bangladesh</Link></li>
                <li><Link href="/equipment" className="text-xs font-semibold text-[var(--color-brand-teal,#18AFA9)] hover:underline">View All Price Guides →</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy,#1a2e4a)] mb-3">
                Top Categories
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/products/category/diagnostic-equipment" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Diagnostic Equipment</Link></li>
                <li><Link href="/products/category/orthopedic-supports" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Orthopedic Supports</Link></li>
                <li><Link href="/products/category/surgical-and-wound-care" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Surgical & Wound Care</Link></li>
                <li><Link href="/products/category/consumables" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Consumables</Link></li>
                <li><Link href="/products/category/diabetes-care" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Diabetes Care</Link></li>
                <li><Link href="/products/category/mobility-aids" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Mobility Aids</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy,#1a2e4a)] mb-3">
                Brands & Guides
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/brands" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">All Medical Equipment Brands</Link></li>
                <li><Link href="/guides/medical-equipment-bangladesh-guide" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Medical Equipment Guide 2026</Link></li>
                <li><Link href="/guides/diagnostic-equipment-guide-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Diagnostic Equipment Guide</Link></li>
                <li><Link href="/guides/laboratory-reagents-guide-bangladesh" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">Laboratory Reagents Guide</Link></li>
                <li><Link href="/b2b" className="text-xs text-[var(--color-brand-teal,#18AFA9)] hover:underline">B2B Bulk Pricing</Link></li>
                <li><Link href="/guides" className="text-xs font-semibold text-[var(--color-brand-teal,#18AFA9)] hover:underline">All Buying Guides →</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}