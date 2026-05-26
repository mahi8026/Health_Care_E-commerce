import HomeClient from './HomeClient';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import StructuredData, {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/structuredData';

export const metadata = {
  title:       PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  keywords:    PAGE_SEO.home.keywords,
  alternates:  { canonical: SITE_CONFIG.url },
  openGraph: {
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    url:         SITE_CONFIG.url,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'MedCore BD — Bangladesh Medical Equipment Supplier' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    images:      ['/og-default.png'],
  },
};

/**
 * Homepage — Server Component.
 * Schema injected server-side; data fetched client-side via HomeClient.
 */
export default function Home() {
  return (
    <>
      <StructuredData schema={generateOrganizationSchema()} />
      <StructuredData schema={generateWebSiteSchema()} />
      <HomeClient initialFeaturedProducts={[]} />
    </>
  );
}
