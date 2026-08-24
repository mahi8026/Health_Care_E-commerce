import Link from 'next/link';
import NotFoundSearch from '@/components/search/NotFoundSearch';

// ---------------------------------------------------------------------------
// Custom 404 — keeps users on-site via search + popular destinations
// instead of letting them bounce back to a search engine.
// ---------------------------------------------------------------------------

// Noindex: 404 pages must never be indexed.
// Next.js already sends a 404 HTTP status for this component,
// but the explicit robots tag ensures crawlers don't cache any content.
export const metadata = {
  title: 'Page Not Found | MediportBD',
  robots: { index: false, follow: true },
};

const POPULAR_LINKS = [
  { label: 'All Products', href: '/products' },
  { label: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment' },
  { label: 'Surgical Instruments', href: '/products/category/surgical-instruments' },
  { label: 'Laboratory Reagents', href: '/reagent-store' },
  { label: 'Hospital Machines', href: '/products/category/hospital-machines' },
  { label: 'PPE & Safety', href: '/products/category/ppe-and-safety' },
  { label: 'Buying Guides', href: '/guides' },
  { label: 'Support & Resources', href: '/support' },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-page py-16 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        <p className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-[var(--color-brand-teal)] mb-4">
          Error 404
        </p>
        <h1 className="text-3xl md:text-5xl font-semibold text-[var(--color-brand-navy)] mb-4">
          Page Not Found
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching for the product you need, or browse one of our popular
          categories below.
        </p>

        <NotFoundSearch />

        <nav aria-label="Popular pages">
          <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-4">
            Popular Pages
          </h2>
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {POPULAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
