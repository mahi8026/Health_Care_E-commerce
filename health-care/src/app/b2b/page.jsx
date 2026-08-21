import B2BDashboardPage from '@/views/B2BDashboardPage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';

export const dynamic = 'force-dynamic';

/**
 * B2B page is publicly crawlable — do NOT noindex.
 * It's a marketing landing page for B2B buyers, not a private dashboard.
 */
export const metadata = {
  title:       PAGE_SEO.b2b.title,
  description: PAGE_SEO.b2b.description,
  keywords:    PAGE_SEO.b2b.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/b2b` },
  openGraph: {
    title:       PAGE_SEO.b2b.title,
    description: PAGE_SEO.b2b.description,
    url:         `${SITE_CONFIG.url}/b2b`,
    images: [{
      url: `${SITE_CONFIG.url}/og?title=B2B+Medical+Supply+Bangladesh&subtitle=Bulk+Discounts+%E2%80%A2+Credit+Terms+%E2%80%A2+Dedicated+Account+Manager&page=B2B+Portal`,
      width: 1200, height: 630,
      alt: 'B2B Medical Equipment Supplier Bangladesh — MediportBD',
    }],
  },
};

export default function B2B() {
  return <B2BDashboardPage />;
}
