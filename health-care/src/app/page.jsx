import App from '../App';
import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import StructuredData, {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/utils/structuredData';

export const metadata = generatePageMetadata(pageMetadata.home);

/**
 * Homepage — Server Component.
 *
 * Temporarily disabled server-side fetch to improve initial load performance.
 * All data will be fetched client-side instead.
 *
 * Requirements: 8.6, 8.7
 */
export default function Home() {
  // Disabled server-side fetch - let client handle all data fetching
  const initialFeaturedProducts = [];

  return (
    <>
      <StructuredData schema={generateOrganizationSchema()} />
      <StructuredData schema={generateWebSiteSchema()} />
      <App initialFeaturedProducts={initialFeaturedProducts} />
    </>
  );
}
