/**
 * Products listing page — Server Component.
 *
 * Server-renders the first page of products (with filters from the URL)
 * so the catalog is fully crawlable without JavaScript. ProductsPage is a
 * Client Component that hydrates with this data and continues fetching
 * client-side on subsequent filter/page changes.
 */
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
  const categoryName = val('category');
  const category = CATEGORY_NAME_TO_SLUG[categoryName] || categoryName || '';
  const listing = await fetchListing({
    search: val('q'),
    category,
    brand: val('brand'),
    minPrice: val('minPrice'),
    maxPrice: val('maxPrice'),
    inStock: val('inStock') === 'true',
    sortBy: val('sort') || 'name',
    page: val('page') || '1',
  });

  return (
    <ProductsPage
      initialData={listing.products}
      initialPagination={listing.pagination}
      initialCategories={listing.categories}
      initialBrands={listing.brands}
      initialFilters={listing.filters}
    />
  );
}