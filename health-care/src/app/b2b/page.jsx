import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import B2BDashboardPage from '@/views/B2BDashboardPage';

export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata(pageMetadata.b2b);

export default function B2B() {
  return <B2BDashboardPage />;
}
