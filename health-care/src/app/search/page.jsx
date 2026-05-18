/**
 * Search page — redirects to /products which handles all search/filter functionality.
 * Kept as a route for backward compatibility and SEO (noindex).
 */
import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: true },
};

export default function Search({ searchParams }) {
  // Build query string to forward all params to /products
  const params = new URLSearchParams();
  if (searchParams?.q) params.set('q', searchParams.q);
  if (searchParams?.category) params.set('category', searchParams.category);
  if (searchParams?.minPrice) params.set('minPrice', searchParams.minPrice);
  if (searchParams?.maxPrice) params.set('maxPrice', searchParams.maxPrice);
  if (searchParams?.inStock) params.set('inStock', searchParams.inStock);
  if (searchParams?.sort) params.set('sort', searchParams.sort);

  const qs = params.toString();
  redirect(`/products${qs ? `?${qs}` : ''}`);
}
