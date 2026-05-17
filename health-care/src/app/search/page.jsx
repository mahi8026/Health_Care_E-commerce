/**
 * Search page — Server Component wrapper.
 * Metadata is noindex so Google doesn't index search result pages
 * (prevents duplicate content), but the page remains crawlable for links.
 */
import SearchPage from '@/views/SearchPage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title:       PAGE_SEO.search.title,
  description: PAGE_SEO.search.description,
  alternates:  { canonical: `${SITE_CONFIG.url}/search` },
  robots:      { index: false, follow: true },
};

export default function Search() {
  return <SearchPage />;
}
