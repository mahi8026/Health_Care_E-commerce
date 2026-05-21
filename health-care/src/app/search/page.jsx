/**
 * Search page — redirects to /products which handles all search/filter functionality.
 * Kept as a route for backward compatibility and SEO (noindex).
 */
import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: true },
};

export default async function Search({ searchParams }) {
  // In Next.js 15+, searchParams is a Promise that must be awaited
  const resolvedParams = await searchParams;

  // Build query string to forward all params to /products
  const params = new URLSearchParams();
  if (resolvedParams?.q) params.set('q', resolvedParams.q);
  if (resolvedParams?.category) params.set('category', resolvedParams.category);
  if (resolvedParams?.minPrice) params.set('minPrice', resolvedParams.minPrice);
  if (resolvedParams?.maxPrice) params.set('maxPrice', resolvedParams.maxPrice);
  if (resolvedParams?.inStock) params.set('inStock', resolvedParams.inStock);
  if (resolvedParams?.sort) params.set('sort', resolvedParams.sort);
  if (resolvedParams?.brand) params.set('brand', resolvedParams.brand);

  const qs = params.toString();
  redirect(`/products${qs ? `?${qs}` : ''}`);
}
