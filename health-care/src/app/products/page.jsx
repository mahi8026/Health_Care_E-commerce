/**
 * Products listing page — Server Component wrapper.
 *
 * Exports static metadata for the /products route.
 * ProductsPage is a Client Component and handles all filtering/fetching
 * client-side; onProductClick falls back to internal router navigation.
 */
import ProductsPage from '@/views/ProductsPage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title:       PAGE_SEO.products.title,
  description: PAGE_SEO.products.description,
  keywords:    PAGE_SEO.products.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/products` },
  openGraph: {
    title:       PAGE_SEO.products.title,
    description: PAGE_SEO.products.description,
    url:         `${SITE_CONFIG.url}/products`,
    images: [{ url: '/images/og-products.jpg', width: 1200, height: 630 }],
  },
};

export default function ProductsRoute() {
  // ProductsPage uses its own internal router for navigation — no prop needed.
  return <ProductsPage />;
}
